import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, register } from '@/api/auth'
import { claimSessions } from '@/api/me'
import { useIdentityStore } from '@/store/identityStore'

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Obrigatório'),
  password: z.string().min(1, 'Obrigatório'),
})

const registerSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres').max(50),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(100),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

interface Props {
  open: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register'
}

export function AuthModal({ open, onClose, defaultMode = 'login' }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const { setAuth, guestId, guestTokens } = useIdentityStore()

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      setAuth(data.token, data.userId, data.username, data.email)
      // Try to claim any guest sessions
      const firstToken = Object.values(guestTokens)[0]
      if (firstToken) {
        try {
          await claimSessions({ guestId, guestToken: firstToken })
        } catch {
          // non-critical
        }
      }
      toast.success(`Bem-vindo, ${data.username}!`)
      onClose()
    },
    onError: () => toast.error('Credenciais inválidas'),
  })

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: async (data) => {
      setAuth(data.token, data.userId, data.username, data.email)
      const firstToken = Object.values(guestTokens)[0]
      if (firstToken) {
        try {
          await claimSessions({ guestId, guestToken: firstToken })
        } catch {
          // non-critical
        }
      }
      toast.success(`Conta criada! Bem-vindo, ${data.username}!`)
      onClose()
    },
    onError: () => toast.error('Username ou e-mail já cadastrado'),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Entrar' : 'Criar conta'}</DialogTitle>
        </DialogHeader>

        {mode === 'login' ? (
          <form
            onSubmit={loginForm.handleSubmit((d) => loginMutation.mutate(d))}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="usernameOrEmail">Username ou e-mail</Label>
              <Input id="usernameOrEmail" {...loginForm.register('usernameOrEmail')} />
              {loginForm.formState.errors.usernameOrEmail && (
                <p className="text-xs text-destructive">
                  {loginForm.formState.errors.usernameOrEmail.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" {...loginForm.register('password')} />
              {loginForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => setMode('register')}
              >
                Criar conta
              </button>
            </p>
          </form>
        ) : (
          <form
            onSubmit={registerForm.handleSubmit((d) => registerMutation.mutate(d))}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...registerForm.register('username')} />
              {registerForm.formState.errors.username && (
                <p className="text-xs text-destructive">
                  {registerForm.formState.errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...registerForm.register('email')} />
              {registerForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="reg-password">Senha</Label>
              <Input id="reg-password" type="password" {...registerForm.register('password')} />
              {registerForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Criando...' : 'Criar conta'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => setMode('login')}
              >
                Entrar
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
