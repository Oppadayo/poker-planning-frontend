// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthRegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthLoginRequest {
  usernameOrEmail: string
  password: string
}

export interface AuthResponse {
  token: string
  userId: string
  username: string
  email: string
}

// ─── Rooms ───────────────────────────────────────────────────────────────────

export type DeckType = 'FIBONACCI' | 'T_SHIRT' | 'POWERS_OF_TWO' | 'CUSTOM'
export type RoomStatus = 'ACTIVE' | 'CLOSED'
export type ParticipantRole = 'HOST' | 'PARTICIPANT' | 'OBSERVER'

export interface RoomCreateRequest {
  name: string
  displayName: string
  deckType: DeckType
  allowObservers: boolean
}

export interface RoomJoinRequest {
  displayName: string
  role?: ParticipantRole
}

export interface RoomResponse {
  id: string
  name: string
  code: string
  deckType: DeckType
  allowObservers: boolean
  status: RoomStatus
  currentStoryId?: string
  createdAt: string
}

export interface ParticipantResponse {
  id: string
  role: ParticipantRole
  displayName: string
  online: boolean
}

export interface JoinRoomResponse {
  room: RoomResponse
  me: ParticipantResponse
  guestToken?: string
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export type StoryStatus = 'PENDING' | 'SELECTED' | 'ESTIMATED'

export interface StoryCreateRequest {
  title: string
  description?: string
  externalRef?: string
}

export interface StoryUpdateRequest {
  title?: string
  description?: string
  externalRef?: string
}

export interface StoryReorderRequest {
  storyIds: string[]
}

export interface StoryResponse {
  id: string
  roomId: string
  title: string
  description?: string
  externalRef?: string
  orderIndex: number
  status: StoryStatus
  finalEstimate?: string
  createdAt: string
}

// ─── Rounds ──────────────────────────────────────────────────────────────────

export type RoundStatus = 'VOTING' | 'REVEALED' | 'FINALIZED'

export interface VoteRequest {
  value: string
}

export interface FinalizeRoundRequest {
  finalEstimate: string
}

export interface VoteResponse {
  participantId: string
  hasVoted: boolean
  value?: string
}

export interface RoundResponse {
  id: string
  storyId: string
  status: RoundStatus
  startedAt: string
  revealedAt?: string
  finalizedAt?: string
  votes: VoteResponse[]
}

// ─── Invites ─────────────────────────────────────────────────────────────────

export interface InviteCreateRequest {
  role: ParticipantRole
  expiresAt?: string
  maxUses?: number
}

export interface InviteResponse {
  id: string
  roomId: string
  role: ParticipantRole
  expiresAt?: string
  maxUses?: number
  uses: number
  revoked: boolean
  createdAt: string
  token?: string
}

// ─── Room State ───────────────────────────────────────────────────────────────

export interface RoomStateResponse {
  room: RoomResponse
  me: ParticipantResponse
  participants: ParticipantResponse[]
  stories: StoryResponse[]
  currentStoryId?: string
  round?: RoundResponse
}

// ─── Me ──────────────────────────────────────────────────────────────────────

export interface ClaimRequest {
  guestId: string
  guestToken: string
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export type WsEventType =
  | 'PARTICIPANT_JOINED'
  | 'PARTICIPANT_LEFT'
  | 'STORY_CREATED'
  | 'STORY_UPDATED'
  | 'STORY_DELETED'
  | 'STORY_REORDERED'
  | 'STORY_SELECTED'
  | 'ROUND_STARTED'
  | 'VOTE_CAST'
  | 'ROUND_REVEALED'
  | 'ROUND_RESET'
  | 'ROUND_FINALIZED'
  | 'ROOM_CLOSED'
  | 'STATE_SNAPSHOT'
  | 'PARTICIPANT_KICKED'
  | 'HOST_TRANSFERRED'

export interface WsEvent<T = unknown> {
  eventId: string
  type: WsEventType
  roomId: string
  timestamp: string
  payload: T
}

// ─── Deck Constants ───────────────────────────────────────────────────────────

export const DECK_VALUES: Record<DeckType, string[]> = {
  FIBONACCI: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'],
  T_SHIRT: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'],
  POWERS_OF_TWO: ['1', '2', '4', '8', '16', '32', '64', '?'],
  CUSTOM: [],
}

// ─── Error ────────────────────────────────────────────────────────────────────

export interface ErrorResponse {
  status: number
  error: string
  message: string
  path: string
  timestamp: string
}
