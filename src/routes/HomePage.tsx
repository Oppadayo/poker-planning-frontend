import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, ArrowRight, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AuthModal } from '@/components/auth/AuthModal'
import { createRoom, joinByCode } from '@/api/rooms'
import { getSessions } from '@/api/me'
import { useIdentityStore } from '@/store/identityStore'
import type { DeckType, RoomCreateRequest } from '@/types'

const createRoomSchema = z.object({
  name: z.string().min(1, 'Obrigatório').max(100),
  displayName: z.string().min(1, 'Obrigatório').max(100),
  deckType: z.enum(['FIBONACCI', 'T_SHIRT', 'POWERS_OF_TWO', 'CUSTOM']),
  allowObservers: z.boolean(),
})

const joinCodeSchema = z.object({
  code: z.string().min(1, 'Obrigatório'),
  displayName: z.string().min(1, 'Obrigatório').max(100),
})

type CreateRoomForm = z.infer<typeof createRoomSchema>
type JoinCodeForm = z.infer<typeof joinCodeSchema>

export function HomePage() {
  const navigate = useNavigate()
  const { token, username, displayName, logout, setGuestToken, setDisplayName } = useIdentityStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const createForm = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      displayName: displayName || '',
      deckType: 'FIBONACCI',
      allowObservers: true,
    },
  })

  const joinForm = useForm<JoinCodeForm>({
    resolver: zodResolver(joinCodeSchema),
    defaultValues: { code: '', displayName: displayName || '' },
  })

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
    enabled: !!token,
  })

  const createMutation = useMutation({
    mutationFn: (data: RoomCreateRequest) => createRoom(data),
    onSuccess: (res) => {
      if (res.guestToken) {
        setGuestToken(res.room.id, res.guestToken)
      }
      setDisplayName(createForm.getValues('displayName'))
      navigate(`/rooms/${res.room.id}`)
    },
    onError: () => toast.error('Erro ao criar sala'),
  })

  const joinMutation = useMutation({
    mutationFn: ({ code, displayName }: JoinCodeForm) =>
      joinByCode(code.toUpperCase().trim(), { displayName }),
    onSuccess: (res) => {
      if (res.guestToken) {
        setGuestToken(res.room.id, res.guestToken)
      }
      setDisplayName(joinForm.getValues('displayName'))
      navigate(`/rooms/${res.room.id}`)
    },
    onError: () => toast.error('Código inválido ou sala não encontrada'),
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b-2 border-foreground px-4 py-3 flex items-center justify-between bg-primary">
        <div className="flex items-center gap-2">
         
          <span className="font-black text-lg tracking-tight">Poker Planning</span>
        </div>
        <div className="flex items-center gap-2">
          {token ? (
            <>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-4 w-4" />
                {username}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAuthMode('login')
                  setAuthOpen(true)
                }}
              >
                Entrar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setAuthMode('register')
                  setAuthOpen(true)
                }}
              >
                Criar conta
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-12 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-black tracking-tight uppercase">Poker Planning</h1>
          <p className="text-muted-foreground font-semibold text-base">
            Estime histórias com seu time — sem login necessário
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Create Room */}
          <Card
            className="cursor-pointer transition-[transform,box-shadow] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none bg-primary"
            onClick={() => setCreateOpen(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary-foreground">
                <Plus className="h-5 w-5" />
                Criar sala
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">Inicie uma nova sessão de planning poker</CardDescription>
            </CardHeader>
          </Card>

          {/* Join by code */}
          <Card
            className="cursor-pointer transition-[transform,box-shadow] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            onClick={() => setJoinOpen(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Entrar por código
              </CardTitle>
              <CardDescription>Use o código de 6 caracteres da sala</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* My sessions */}
        {token && sessions && sessions.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-black text-xl uppercase tracking-tight">Minhas sessões</h2>
            <div className="space-y-2">
              {sessions.map((room) => (
                <Card
                  key={room.id}
                  className="cursor-pointer transition-[transform,box-shadow] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                  onClick={() => navigate(`/rooms/${room.id}`)}
                >
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{room.code}</p>
                    </div>
                    <Badge variant={room.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {room.status === 'ACTIVE' ? 'Ativa' : 'Encerrada'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Create Room Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar sala</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label>Nome da sala</Label>
              <Input placeholder="Sprint 42" {...createForm.register('name')} />
              {createForm.formState.errors.name && (
                <p className="text-xs text-destructive">{createForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Seu nome</Label>
              <Input placeholder="Como você quer aparecer" {...createForm.register('displayName')} />
              {createForm.formState.errors.displayName && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.displayName.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Deck</Label>
              <select
                className="w-full border-2 border-foreground rounded-none px-3 py-2 text-sm font-medium bg-card outline-none focus:shadow-brutal-sm cursor-pointer"
                {...createForm.register('deckType')}
              >
                {(['FIBONACCI', 'T_SHIRT', 'POWERS_OF_TWO', 'CUSTOM'] as DeckType[]).map((d) => (
                  <option key={d} value={d}>
                    {d === 'FIBONACCI' ? 'Fibonacci (0,1,2,3,5,8…)' :
                     d === 'T_SHIRT' ? 'T-Shirt (XS,S,M,L,XL)' :
                     d === 'POWERS_OF_TWO' ? 'Potências de 2 (1,2,4,8…)' :
                     'Customizado'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowObservers"
                {...createForm.register('allowObservers')}
                className="rounded"
              />
              <Label htmlFor="allowObservers">Permitir observers</Label>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar sala'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join by Code Dialog */}
      <Dialog open={joinOpen} onOpenChange={(v) => !v && setJoinOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrar por código</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={joinForm.handleSubmit((d) => joinMutation.mutate(d))}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label>Código da sala</Label>
              <Input
                placeholder="ABC123"
                className="uppercase font-mono tracking-widest"
                {...joinForm.register('code')}
              />
              {joinForm.formState.errors.code && (
                <p className="text-xs text-destructive">{joinForm.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Seu nome</Label>
              <Input placeholder="Como você quer aparecer" {...joinForm.register('displayName')} />
              {joinForm.formState.errors.displayName && (
                <p className="text-xs text-destructive">
                  {joinForm.formState.errors.displayName.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={joinMutation.isPending}>
              {joinMutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultMode={authMode} />
    </div>
  )
}
