import { apiClient, withGuestToken } from './client'
import type {
  JoinRoomResponse,
  RoomCreateRequest,
  RoomJoinRequest,
  RoomResponse,
  RoomStateResponse,
} from '@/types'

export async function createRoom(data: RoomCreateRequest): Promise<JoinRoomResponse> {
  const guestId = localStorage.getItem('guestId')
  const headers = guestId ? { 'X-Guest-Id': guestId } : {}
  const res = await apiClient.post<JoinRoomResponse>('/rooms', data, { headers })
  return res.data
}

export async function getRoom(roomId: string): Promise<RoomResponse> {
  const res = await apiClient.get<RoomResponse>(`/rooms/${roomId}`)
  return res.data
}

export async function getRoomState(roomId: string): Promise<RoomStateResponse> {
  const res = await apiClient.get<RoomStateResponse>(`/rooms/${roomId}/state`)
  return res.data
}

export async function joinRoom(roomId: string, data: RoomJoinRequest): Promise<JoinRoomResponse> {
  const res = await apiClient.post<JoinRoomResponse>(`/rooms/${roomId}/join`, data)
  return res.data
}

export async function joinByCode(code: string, data: RoomJoinRequest): Promise<JoinRoomResponse> {
  const res = await apiClient.post<JoinRoomResponse>(`/rooms/join-by-code/${code}`, data)
  return res.data
}

export async function leaveRoom(roomId: string): Promise<void> {
  await apiClient.post(`/rooms/${roomId}/leave`)
}

export async function closeRoom(roomId: string): Promise<void> {
  await apiClient.post(`/rooms/${roomId}/close`, null, {
    headers: withGuestToken(roomId),
  })
}

export async function kickParticipant(roomId: string, participantId: string): Promise<void> {
  await apiClient.delete(`/rooms/${roomId}/participants/${participantId}`, {
    headers: withGuestToken(roomId),
  })
}

export async function transferHost(roomId: string, newHostParticipantId: string): Promise<void> {
  await apiClient.post(`/rooms/${roomId}/transfer-host/${newHostParticipantId}`, null, {
    headers: withGuestToken(roomId),
  })
}
