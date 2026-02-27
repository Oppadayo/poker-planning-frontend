import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface IdentityState {
  // Guest
  guestId: string
  displayName: string
  // Auth
  token: string | null
  userId: string | null
  username: string | null
  email: string | null
  // Guest tokens per room  { [roomId]: guestToken }
  guestTokens: Record<string, string>

  // Actions
  setDisplayName: (name: string) => void
  setAuth: (token: string, userId: string, username: string, email: string) => void
  logout: () => void
  setGuestToken: (roomId: string, token: string) => void
  removeGuestToken: (roomId: string) => void
  getGuestToken: (roomId: string) => string | undefined
}

function generateGuestId(): string {
  return crypto.randomUUID()
}

export const useIdentityStore = create<IdentityState>()(
  persist(
    (set, get) => ({
      guestId: generateGuestId(),
      displayName: '',
      token: null,
      userId: null,
      username: null,
      email: null,
      guestTokens: {},

      setDisplayName: (name) => set({ displayName: name }),

      setAuth: (token, userId, username, email) => {
        localStorage.setItem('token', token)
        set({ token, userId, username, email })
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, userId: null, username: null, email: null })
      },

      setGuestToken: (roomId, token) => {
        localStorage.setItem(`guestToken:${roomId}`, token)
        set((state) => ({
          guestTokens: { ...state.guestTokens, [roomId]: token },
        }))
      },

      removeGuestToken: (roomId) => {
        localStorage.removeItem(`guestToken:${roomId}`)
        set((state) => {
          const tokens = { ...state.guestTokens }
          delete tokens[roomId]
          return { guestTokens: tokens }
        })
      },

      getGuestToken: (roomId) => get().guestTokens[roomId],
    }),
    {
      name: 'poker-identity',
      partialize: (state) => ({
        guestId: state.guestId,
        displayName: state.displayName,
        token: state.token,
        userId: state.userId,
        username: state.username,
        email: state.email,
        guestTokens: state.guestTokens,
      }),
    },
  ),
)

// Sync guestId to localStorage for the axios interceptor
useIdentityStore.subscribe((state) => {
  localStorage.setItem('guestId', state.guestId)
  if (state.token) {
    localStorage.setItem('token', state.token)
  }
})

// Initialize localStorage immediately so the axios interceptor can read
// guestId before the first state change (fixes 403 on fresh page load)
const _init = useIdentityStore.getState()
localStorage.setItem('guestId', _init.guestId)
if (_init.token) localStorage.setItem('token', _init.token)
