import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Wifi, WifiOff, LogOut, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWsStore } from '@/store/wsStore'
import type { ParticipantResponse, RoomResponse } from '@/types'
import { useLeaveRoom } from '@/hooks/room/use-leave-room'
import { useCloseRoom } from '@/hooks/room/use-close-room'

interface Props {
  room: RoomResponse
  me: ParticipantResponse
}

export function RoomHeader({ room, me }: Props) {
  const navigate = useNavigate()
  const wsStatus = useWsStore((s) => s.status)
  const [copying, setCopying] = useState(false)

  const { leaveRoom, isLeaving } = useLeaveRoom({
    roomId: room.id,
    options: { onSuccess: () => navigate('/') },
  })

  const { closeRoom, isClosing } = useCloseRoom({
    roomId: room.id,
    options: { onSuccess: () => navigate('/') },
  })

  function copyCode() {
    navigator.clipboard.writeText(room.code)
    setCopying(true)
    toast.success('Código copiado!')
    setTimeout(() => setCopying(false), 1500)
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground bg-primary">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="font-black text-lg truncate tracking-tight">{room.name}</h1>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 px-2 py-0.5 border-2 border-foreground bg-card font-mono text-sm font-bold transition-[transform,box-shadow] shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer"
          title="Copiar código"
        >
          <span>{copying ? '✓' : room.code}</span>
          <Copy className="h-3 w-3" />
        </button>
        {me.role === 'HOST' && (
          <Badge variant="default" className="text-xs bg-foreground text-background border-foreground">HOST</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span title={`WebSocket: ${wsStatus}`}>
          {wsStatus === 'connected' ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
        </span>

        {me.role === 'HOST' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Fechar a sala permanentemente?')) closeRoom()
            }}
            disabled={isClosing}
          >
            <X className="h-4 w-4 mr-1" />
            Fechar sala
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => leaveRoom()}
          disabled={isLeaving}
        >
          <LogOut className="h-4 w-4 mr-1" />
          Sair
        </Button>
      </div>
    </header>
  )
}
