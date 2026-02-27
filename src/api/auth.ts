import { apiClient } from './client'
import type { AuthLoginRequest, AuthRegisterRequest, AuthResponse } from '@/types'

export async function register(data: AuthRegisterRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/register', data)
  return res.data
}

export async function login(data: AuthLoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login', data)
  return res.data
}
