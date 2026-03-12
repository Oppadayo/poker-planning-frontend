import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getInvite, joinByInvite } from '@/api/invites'
import { useIdentityStore } from '@/store/identityStore'

interface JoinForm {
  displayName: string
}

export function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { displayName: savedName, setDisplayName, setGuestToken } = useIdentityStore()

  const { register, handleSubmit, watch } = useForm<JoinForm>({
    defaultValues: { displayName: savedName || '' },
  })

  const displayNameValue = watch('displayName')

  const {
    data: invite,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => getInvite(token!),
    enabled: !!token,
    retry: false,
  })

  const joinMutation = useMutation({
    mutationFn: (displayName: string) =>
      joinByInvite(token!, { displayName, role: invite?.role }),
    onSuccess: (res, displayName) => {
      if (res.guestToken) {
        setGuestToken(res.room.id, res.guestToken)
      }
      setDisplayName(displayName)
      navigate(`/rooms/${res.room.id}`)
    },
    onError: () => toast.error('Convite inválido, expirado ou com uso máximo atingido'),
  })

  const onSubmit = handleSubmit(({ displayName }) => {
    joinMutation.mutate(displayName.trim())
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError || !invite) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-sm">
          <AlertDescription>
            Convite inválido ou expirado.{' '}
            <button className="underline" onClick={() => navigate('/')}>
              Voltar ao início
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (invite.revoked) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-sm">
          <AlertDescription>
            Este convite foi revogado.{' '}
            <button className="underline" onClick={() => navigate('/')}>
              Voltar ao início
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Você foi convidado!</CardTitle>
          <CardDescription>Entre na sessão de Poker Planning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Badge variant="secondary">
              {invite.role === 'PARTICIPANT' ? 'Participante' :
               invite.role === 'OBSERVER' ? 'Observer' :
               invite.role}
            </Badge>
          </div>

          {invite.expiresAt && (
            <p className="text-xs text-muted-foreground text-center">
              Expira em: {new Date(invite.expiresAt).toLocaleString('pt-BR')}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="displayName">Seu nome</Label>
              <Input
                id="displayName"
                placeholder="Como você quer aparecer"
                {...register('displayName', { required: true })}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!displayNameValue?.trim() || joinMutation.isPending}
            >
              {joinMutation.isPending ? 'Entrando...' : 'Entrar na sala'}
            </Button>
          </form>

          <button
            className="w-full text-sm text-muted-foreground hover:underline"
            onClick={() => navigate('/')}
          >
            Cancelar
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
