import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://poker-planning-server.onrender.com'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Inject auth headers before every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const guestId = localStorage.getItem('guestId')

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  } else if (guestId) {
    config.headers['X-Guest-Id'] = guestId
  }

  return config
})

/** Attach the guest token for a specific room (host-only operations). */
export function withGuestToken(roomId: string): Record<string, string> {
  const stored = localStorage.getItem(`guestToken:${roomId}`)
  return stored ? { 'X-Guest-Token': stored } : {}
}
