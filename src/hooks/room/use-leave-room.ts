import { leaveRoom } from "@/api/rooms"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type UseLeaveRoomProps = {
  roomId: string
  options?: MutationOptions<void>
}

export function useLeaveRoom({ roomId, options }: UseLeaveRoomProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => leaveRoom(roomId),
    onSuccess: () => {
      options?.onSuccess?.()
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.ROOM_STATE, roomId] })
    },
    onError: (error) => {
      options?.onError?.(error)
      toast.error("Erro ao sair da sala")
    },
  })

  return { leaveRoom: mutation.mutate, isLeaving: mutation.isPending }
}
