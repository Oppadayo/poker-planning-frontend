import { apiClient, withGuestToken } from './client'
import type { FinalizeRoundRequest, RoundResponse, VoteRequest } from '@/types'

export async function startRound(roomId: string): Promise<RoundResponse> {
  const res = await apiClient.post<RoundResponse>(`/rooms/${roomId}/rounds/start`, null, {
    headers: withGuestToken(roomId),
  })
  return res.data
}

export async function castVote(roomId: string, data: VoteRequest): Promise<void> {
  await apiClient.post(`/rooms/${roomId}/rounds/vote`, data)
}

export async function revealVotes(roomId: string): Promise<RoundResponse> {
  const res = await apiClient.post<RoundResponse>(`/rooms/${roomId}/rounds/reveal`, null, {
    headers: withGuestToken(roomId),
  })
  return res.data
}

export async function resetRound(roomId: string): Promise<RoundResponse> {
  const res = await apiClient.post<RoundResponse>(`/rooms/${roomId}/rounds/reset`, null, {
    headers: withGuestToken(roomId),
  })
  return res.data
}

export async function finalizeRound(
  roomId: string,
  data: FinalizeRoundRequest,
): Promise<RoundResponse> {
  const res = await apiClient.post<RoundResponse>(`/rooms/${roomId}/rounds/finalize`, data, {
    headers: withGuestToken(roomId),
  })
  return res.data
}
