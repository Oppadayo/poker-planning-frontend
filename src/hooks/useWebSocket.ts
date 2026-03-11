import { useEffect, useRef, useCallback } from 'react'
import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useWsStore } from '@/store/wsStore'
import { useIdentityStore } from '@/store/identityStore'
import type { WsEvent } from '@/types'

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
        case 'HOST_TRANSFERRED':
        case 'STORY_CREATED':
        case 'STORY_UPDATED':
        case 'STORY_DELETED':
        case 'STORY_REORDERED':
        case 'STORY_SELECTED':
        case 'ROUND_STARTED':
        case 'VOTE_CAST':
        case 'ROUND_REVEALED':
        case 'ROUND_RESET':
        case 'ROUND_FINALIZED':
        case 'STATE_SNAPSHOT':
          queryClient.invalidateQueries({ queryKey: stateKey })
          break

        case 'ROOM_CLOSED':
          toast.info('A sala foi encerrada pelo host.')
          queryClient.invalidateQueries({ queryKey: stateKey })
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
