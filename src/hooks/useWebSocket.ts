import { useEffect, useRef, useCallback } from 'react'
import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useWsStore } from '@/store/wsStore'
import { useIdentityStore } from '@/store/identityStore'
import type {
  WsEvent,
  ParticipantResponse,
  StoryResponse,
  RoundResponse,
  RoomStateResponse,
} from '@/types'
import { QUERY_KEYS } from '@/constants/query-keys'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:8080/ws'

export function useWebSocket(roomId: string | null) {
  const clientRef = useRef<Client | null>(null)
  const queryClient = useQueryClient()
  const { setStatus, markEventProcessed, isEventProcessed } = useWsStore()
  const { token, guestId, guestTokens } = useIdentityStore()

  const handleEvent = useCallback(
    (event: WsEvent) => {
      if (isEventProcessed(event.eventId)) return
      markEventProcessed(event.eventId)

      if (!roomId) return

      const stateKey = ['roomState', roomId]

      switch (event.type) {
        case 'PARTICIPANT_JOINED':
        case 'PARTICIPANT_LEFT':
        case 'PARTICIPANT_KICKED':
        case 'HOST_TRANSFERRED': {
          const participant = event.payload as ParticipantResponse
          queryClient.setQueryData<RoomStateResponse>(stateKey, (old) => {
            if (!old) return old
            if (event.type === 'PARTICIPANT_JOINED') {
              const exists = old.participants.some((p) => p.id === participant.id)
              return {
                ...old,
                participants: exists
                  ? old.participants.map((p) => (p.id === participant.id ? participant : p))
                  : [...old.participants, participant],
              }
            }
            if (event.type === 'PARTICIPANT_LEFT') {
              return {
                ...old,
                participants: old.participants.map((p) =>
                  p.id === participant.id ? { ...p, online: false } : p,
                ),
              }
            }
            if (event.type === 'PARTICIPANT_KICKED') {
              return {
                ...old,
                participants: old.participants.filter((p) => p.id !== participant.id),
              }
            }
            // HOST_TRANSFERRED: re-fetch full state
            queryClient.invalidateQueries({ queryKey: stateKey })
            return old
          })
          break
        }

        case 'STORY_CREATED': {
          const story = event.payload as StoryResponse
          queryClient.setQueryData<RoomStateResponse>(stateKey, (old) => {
            if (!old) return old
            const exists = old.stories.some((s) => s.id === story.id)
            return {
              ...old,
              stories: exists ? old.stories : [...old.stories, story],
            }
          })
          break
        }

        case 'STORY_UPDATED': {
          const story = event.payload as StoryResponse
          queryClient.setQueryData<RoomStateResponse>(stateKey, (old) => {
            if (!old) return old
            return {
              ...old,
              stories: old.stories.map((s) => (s.id === story.id ? story : s)),
            }
          })
          break
        }

        case 'STORY_DELETED': {
          const { storyId } = event.payload as { storyId: string }
          queryClient.setQueryData<RoomStateResponse>(stateKey, (old) => {
            if (!old) return old
            return {
              ...old,
              stories: old.stories.filter((s) => s.id !== storyId),
            }
          })
          break
        }

        case 'STORY_REORDERED': {
          const stories = event.payload as StoryResponse[]
          queryClient.invalidateQueries({ queryKey: stateKey})
          queryClient.invalidateQueries({queryKey: [QUERY_KEYS.STORY_LIST, roomId]})
          queryClient.setQueryData<RoomStateResponse>(stateKey, (old) => {
            if (!old) return old
            return { ...old, stories }
          })
          break
        }

        case 'STORY_SELECTED': {
          const { storyId } = event.payload as { storyId: string }
          queryClient.setQueryData<RoomStateResponse>(stateKey, (old) => {
            if (!old) return old
            return {
              ...old,
              currentStoryId: storyId,
              room: { ...old.room, currentStoryId: storyId },
              stories: old.stories.map((s) => ({
                ...s,
                status: s.id === storyId ? 'SELECTED' : s.status === 'SELECTED' ? 'PENDING' : s.status,
              })),
            }
          })
          break
        }

        case 'ROUND_STARTED': {
          const round = event.payload as RoundResponse
          queryClient.setQueryData<RoomStateResponse>(stateKey, (old) => {
            if (!old) return old
            return { ...old, round }
          })
          break
        }

        case 'VOTE_CAST': {
          const vote = event.payload as { participantId: string; hasVoted: boolean }
          queryClient.setQueryData<RoomStateResponse>(stateKey, (old) => {
            if (!old || !old.round) return old
            const updatedVotes = old.round.votes.some((v) => v.participantId === vote.participantId)
              ? old.round.votes.map((v) =>
                  v.participantId === vote.participantId ? { ...v, hasVoted: true, value: undefined } : v,
                )
              : [...old.round.votes, { participantId: vote.participantId, hasVoted: true }]
            return { ...old, round: { ...old.round, votes: updatedVotes } }
          })
          break
        }

        case 'ROUND_REVEALED': {
          queryClient.invalidateQueries({ queryKey: stateKey })
          break
        }

        case 'ROUND_RESET': {
          const round = event.payload as RoundResponse
          queryClient.setQueryData<RoomStateResponse>(stateKey, (old) => {
            if (!old) return old
            return { ...old, round }
          })
          break
        }

        case 'ROUND_FINALIZED': {
          const { storyId, finalEstimate } = event.payload as { storyId: string; finalEstimate: string }
          queryClient.setQueryData<RoomStateResponse>(stateKey, (old) => {
            if (!old) return old
            return {
              ...old,
              round: old.round ? { ...old.round, status: 'FINALIZED' } : old.round,
              stories: old.stories.map((s) =>
                s.id === storyId ? { ...s, status: 'ESTIMATED', finalEstimate } : s,
              ),
            }
          })
          break
        }

        case 'ROOM_CLOSED':
          toast.info('A sala foi encerrada pelo host.')
          queryClient.invalidateQueries({ queryKey: stateKey })
          break

        case 'STATE_SNAPSHOT':
          queryClient.setQueryData<RoomStateResponse>(stateKey, event.payload as RoomStateResponse)
          break

        default:
          break
      }
    },
    [roomId, queryClient, isEventProcessed, markEventProcessed],
  )

  useEffect(() => {
    if (!roomId) return

    const connectHeaders: Record<string, string> = {}
    if (token) {
      connectHeaders['Authorization'] = `Bearer ${token}`
    } else if (guestId) {
      connectHeaders['X-Guest-Id'] = guestId
      const guestToken = guestTokens[roomId]
      if (guestToken) connectHeaders['X-Guest-Token'] = guestToken
    }

    setStatus('connecting')

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders,
      reconnectDelay: 3000,
      onConnect: () => {
        setStatus('connected')
        client.subscribe(`/topic/rooms/${roomId}/events`, (msg: IMessage) => {
          try {
            const event = JSON.parse(msg.body) as WsEvent
            handleEvent(event)
          } catch {
            // ignore parse errors
          }
        })
      },
      onDisconnect: () => setStatus('disconnected'),
      onStompError: () => setStatus('error'),
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setStatus('disconnected')
    }
  }, [roomId, token, guestId, guestTokens, setStatus, handleEvent])

  const sendVote = useCallback(
    (value: string) => {
      if (!roomId || !clientRef.current?.connected) return
      clientRef.current.publish({
        destination: `/app/rooms/${roomId}/vote`,
        body: JSON.stringify({ value }),
      })
    },
    [roomId],
  )

  return { sendVote }
}
