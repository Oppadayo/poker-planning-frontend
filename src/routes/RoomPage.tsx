import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RoomHeader } from '@/components/room/RoomHeader'
import { ParticipantList } from '@/components/room/ParticipantList'
import { StoryList } from '@/components/room/StoryList'
import { VotingArea } from '@/components/room/VotingArea'
import { InvitePanel } from '@/components/room/InvitePanel'
import { getRoomState } from '@/api/rooms'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useWsStore } from '@/store/wsStore'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const wsStatus = useWsStore((s) => s.status)

  const {
    data: state,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['roomState', roomId],
    queryFn: () => getRoomState(roomId!),
    enabled: !!roomId,
    retry: 1,
    staleTime: Infinity,     // WS keeps data fresh
    gcTime: 1000 * 60 * 5,
  })

  // Connect WebSocket
  useWebSocket(roomId ?? null)

  // Re-sync on reconnect
  useEffect(() => {
    if (wsStatus === 'connected' && roomId) {
      queryClient.invalidateQueries({ queryKey: ['roomState', roomId] })
    }
  }, [wsStatus, roomId, queryClient])

  useEffect(() => {
    if (isError) {
      toast.error('Sala não encontrada ou acesso negado')
      navigate('/')
    }
  }, [isError, navigate])

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="h-14 border-b-2 border-foreground bg-primary flex items-center px-4 gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-60 border-r-2 border-foreground p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
          <div className="flex-1 p-6 space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-12" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!state) return null

  const { room, me, participants, stories, currentStoryId, round } = state
  const currentStory = stories.find((s) => s.id === currentStoryId)
  const isHost = me.role === 'HOST'

  if (room.status === 'CLOSED') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-sm">
          <AlertDescription>
            Esta sala foi encerrada.{' '}
            <button className="underline" onClick={() => navigate('/')}>
              Voltar ao início
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <RoomHeader room={room} me={me} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <ResizablePanelGroup
      orientation="horizontal"
     // className="max-w-sm rounded-lg border"
    >
      <ResizablePanel >
        <aside className="h-full border-r-2 border-foreground flex-shrink-0 flex flex-col bg-sidebar">
          <ScrollArea className="flex-1 p-3">
            <ParticipantList participants={participants} me={me} roomId={room.id} />
            <Separator className="my-4 border-foreground/20" />
            <StoryList
              stories={stories}
              me={me}
              roomId={room.id}
              currentStoryId={currentStoryId}
            />
            {isHost && (
              <>
                <Separator className="my-4 border-foreground/20" />
                <InvitePanel roomId={room.id} />
              </>
            )}
          </ScrollArea>
        </aside>
  </ResizablePanel>
  <ResizableHandle withHandle />
        {/* Main voting area */}
        <ResizablePanel defaultSize="80%">
        <main className="flex-1 overflow-hidden">
          {/* Mobile: tabs */}
          <div className="md:hidden h-full">
            <Tabs defaultValue="vote" className="h-full flex flex-col">
              <TabsList className="mx-4 mt-3">
                <TabsTrigger value="vote">Votação</TabsTrigger>
                <TabsTrigger value="people">Participantes</TabsTrigger>
                <TabsTrigger value="stories">Histórias</TabsTrigger>
              </TabsList>
              <TabsContent value="vote" className="flex-1 overflow-auto p-4">
                <VotingArea
                  round={round}
                  me={me}
                  participants={participants}
                  currentStory={currentStory}
                  roomId={room.id}
                  deckType={room.deckType}
                />
              </TabsContent>
              <TabsContent value="people" className="flex-1 overflow-auto p-4">
                <ParticipantList participants={participants} me={me} roomId={room.id} />
              </TabsContent>
              <TabsContent value="stories" className="flex-1 overflow-auto p-4">
                <StoryList
                  stories={stories}
                  me={me}
                  roomId={room.id}
                  currentStoryId={currentStoryId}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop: just voting */}
          <div className="hidden md:block h-full overflow-auto p-6">
            <VotingArea
              round={round}
              me={me}
              participants={participants}
              currentStory={currentStory}
              roomId={room.id}
              deckType={room.deckType}
            />
          </div>
        </main>
        </ResizablePanel>
        </ResizablePanelGroup>
        
      </div>
    </div>
  )
}
