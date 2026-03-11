import { apiClient, withGuestToken } from './client'
import type { InviteCreateRequest, InviteResponse, JoinRoomResponse, RoomJoinRequest } from '@/types'

export async function createInvite(roomId: string, data: InviteCreateRequest): Promise<InviteResponse> {
  const res = await apiClient.post<InviteResponse>(`/rooms/${roomId}/invites`, data, {
    headers: withGuestToken(roomId),
  })
  return res.data
}

export async function listInvites(roomId: string): Promise<InviteResponse[]> {
  const res = await apiClient.get<InviteResponse[]>(`/rooms/${roomId}/invites`, {
    headers: withGuestToken(roomId),
  })
  return res.data
}

export async function revokeInvite(roomId: string, inviteId: string): Promise<{inviteId: string}> {
  const res = await apiClient.post(`/invites/${inviteId}/revoke`, null, {
    headers: {
      ...withGuestToken(roomId),
      'X-Room-Id': roomId,
    },
  })
  return res.data
}

export async function getInvite(token: string): Promise<InviteResponse> {
  const res = await apiClient.get<InviteResponse>(`/invites/${token}`)
  return res.data
}

export async function joinByInvite(
  token: string,
  data: RoomJoinRequest,
): Promise<JoinRoomResponse> {
  const res = await apiClient.post<JoinRoomResponse>(`/invites/${token}/join`, data)
  return res.data
}
