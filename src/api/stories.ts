import { apiClient, withGuestToken } from './client'
import type {
  StoryCreateRequest,
  StoryReorderRequest,
  StoryResponse,
  StoryUpdateRequest,
} from '@/types'

export async function getStories(roomId: string): Promise<StoryResponse[]> {
  const res = await apiClient.get<StoryResponse[]>(`/rooms/${roomId}/stories`)
  return res.data
}

export async function createStory(roomId: string, data: StoryCreateRequest): Promise<StoryResponse> {
  const res = await apiClient.post<StoryResponse>(`/rooms/${roomId}/stories`, data, {
    headers: withGuestToken(roomId),
  })
  return res.data
}

export async function updateStory(
  roomId: string,
  storyId: string,
  data: StoryUpdateRequest,
): Promise<StoryResponse> {
  const res = await apiClient.put<StoryResponse>(`/stories/${storyId}`, data, {
    headers: withGuestToken(roomId),
  })
  return res.data
}

export async function deleteStory(roomId: string, storyId: string): Promise<void> {
  await apiClient.delete(`/stories/${storyId}`, {
    headers: withGuestToken(roomId),
  })
}

export async function reorderStories(
  roomId: string,
  data: StoryReorderRequest,
): Promise<StoryResponse[]> {
  const res = await apiClient.post<StoryResponse[]>(`/rooms/${roomId}/stories/reorder`, data, {
    headers: withGuestToken(roomId),
  })
  return res.data
}

export async function selectStory(roomId: string, storyId: string): Promise<void> {
  await apiClient.post(`/rooms/${roomId}/stories/${storyId}/select`, null, {
    headers: withGuestToken(roomId),
  })
}
