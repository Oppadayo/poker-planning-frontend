import { apiClient } from './client'
import type { ClaimRequest, RoomResponse } from '@/types'

export async function getSessions(): Promise<RoomResponse[]> {
  const res = await apiClient.get<RoomResponse[]>('/me/sessions')
  return res.data
}

export async function claimSessions(data: ClaimRequest): Promise<void> {
  await apiClient.post('/me/claim', data)
}
