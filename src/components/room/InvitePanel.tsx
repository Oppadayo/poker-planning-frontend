import {  useState } from 'react'
import { Copy, Link, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { ParticipantRole } from '@/types'
import { useGetInvites } from '@/hooks/invite/use-get-invites'
import { useCreateInvite } from '@/hooks/invite/use-create-invite'
import { useRevokeInvite } from '@/hooks/invite/use-revoke-invite'

interface Props {
  roomId: string
}

const FRONTEND_URL = window.location.origin

export function InvitePanel({ roomId }: Props) {
  
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<{
    role: ParticipantRole
    maxUses: string
    expiresAt: string
  }>({ role: 'PARTICIPANT', maxUses: '', expiresAt: '' })

const { invites, isLoading } = useGetInvites(roomId)

const {createInvite, isCreating} = useCreateInvite({roomId, options:{
  onSuccess: () => {
    setCreateOpen(false)
  },

}})

 

const {isRevoking,revokeInvite} = useRevokeInvite({roomId,})

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${FRONTEND_URL}/invite/${token}`)
    toast.success('Link copiado!')
  }

  const activeInvites = invites?.filter((i) => !i.revoked) ?? []

  const onCreateInvite = () => {
    createInvite({
      role: form.role,
      maxUses: form.maxUses ? parseInt(form.maxUses, 10) : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Convites
        </p>
        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm font-semibold text-muted-foreground">Carregando...</p>
      )}

      {activeInvites.length === 0 && !isLoading && (
        <p className="text-sm font-semibold text-muted-foreground text-center py-2 border-2 border-dashed border-foreground/20">Nenhum convite ativo</p>
      )}

      {activeInvites.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center justify-between p-2 border-2 border-foreground text-sm shadow-brutal-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="default" className="text-xs shrink-0">
              {invite.role}
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground">
              {invite.uses}/{invite.maxUses ?? '∞'} usos
            </span>
          </div>
          <div className="flex gap-1">
            {invite.token && (
              <button
                className="p-1 border border-foreground/30 hover:border-foreground hover:bg-muted cursor-pointer"
                title="Copiar link"
                onClick={() => copyLink(invite.token!)}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              className="p-1 border border-foreground/30 hover:border-foreground hover:bg-muted cursor-pointer"
              title="Copiar link do convite"
              onClick={() => {
                const link = `${FRONTEND_URL}/invite/${invite.id}`
                navigator.clipboard.writeText(link)
                toast.success('ID do convite copiado!')
              }}
            >
              <Link className="h-3.5 w-3.5" />
            </button>
            <button
              className="p-1 border border-foreground/30 hover:border-destructive hover:bg-destructive/10 text-destructive cursor-pointer"
              title="Revogar"
              onClick={() => revokeInvite(invite.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar convite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Role</Label>
              <select
                className="w-full border-2 border-foreground rounded-none px-3 py-2 text-sm font-medium bg-card outline-none focus:shadow-brutal-sm cursor-pointer"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as ParticipantRole })}
              >
                <option value="PARTICIPANT">Participante</option>
                <option value="OBSERVER">Observer</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Máximo de usos (opcional)</Label>
              <Input
                type="number"
                placeholder="Ilimitado"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Expira em (opcional)</Label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
            <Button
              className="w-full"  
              onClick={onCreateInvite}          
              disabled={isCreating}
            >
              {isCreating ? 'Criando...' : 'Criar e copiar link'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
