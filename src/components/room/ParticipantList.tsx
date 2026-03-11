import { Crown, MoreHorizontal, UserMinus, ArrowRightLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ParticipantResponse } from '@/types'
import { useKickParticipant } from '@/hooks/room/use-kick-participant'
import { useTransferHost } from '@/hooks/room/use-transfer-host'

interface Props {
  participants: ParticipantResponse[]
  me: ParticipantResponse
  roomId: string
}

export function ParticipantList({ participants, me, roomId }: Props) {
  const { kickParticipant, isKicking } = useKickParticipant({ roomId })
  const { transferHost, isTransferring } = useTransferHost({ roomId })

  const isHost = me.role === 'HOST'

  return (
    <div className="space-y-1">
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 mb-2">
        Participantes ({participants.length})
      </p>
      {participants.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between px-2 py-1.5 border border-foreground/20 hover:border-foreground hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`h-2 w-2 flex-shrink-0 border border-foreground ${
                p.online ? 'bg-green-500' : 'bg-muted-foreground/40'
              }`}
            />
            <span className="truncate text-sm font-semibold">{p.displayName}</span>
            {p.role === 'HOST' && (
              <Crown className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            )}
            {p.role === 'OBSERVER' && (
              <Badge variant="secondary" className="text-xs px-1 py-0">obs</Badge>
            )}
          </div>

          {isHost && p.id !== me.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 border border-foreground/30 hover:border-foreground hover:bg-muted cursor-pointer">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => transferHost(p.id)}
                  disabled={isTransferring}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transferir host
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => kickParticipant(p.id)}
                  disabled={isKicking}
                  className="text-destructive"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Expulsar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  )
}
