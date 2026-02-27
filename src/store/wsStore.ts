import { create } from 'zustand'

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface WsState {
  status: WsStatus
  roomId: string | null
  processedEventIds: Set<string>

  setStatus: (status: WsStatus) => void
  setRoomId: (roomId: string | null) => void
  markEventProcessed: (eventId: string) => void
  isEventProcessed: (eventId: string) => boolean
  reset: () => void
}

export const useWsStore = create<WsState>()((set, get) => ({
  status: 'disconnected',
  roomId: null,
  processedEventIds: new Set(),

  setStatus: (status) => set({ status }),
  setRoomId: (roomId) => set({ roomId }),

  markEventProcessed: (eventId) =>
    set((state) => ({
      processedEventIds: new Set([...state.processedEventIds, eventId]),
    })),

  isEventProcessed: (eventId) => get().processedEventIds.has(eventId),

  reset: () =>
    set({
      status: 'disconnected',
      roomId: null,
      processedEventIds: new Set(),
    }),
}))
