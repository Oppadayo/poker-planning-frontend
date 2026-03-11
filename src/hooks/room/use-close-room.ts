import { closeRoom } from "@/api/rooms"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type UseCloseRoomProps = {
  roomId: string
  options?: MutationOptions<void>
}

export function useCloseRoom({ roomId, options }: UseCloseRoomProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => closeRoom(roomId),
    onSuccess: () => {
      options?.onSuccess?.()
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.ROOM_STATE, roomId] })
    },
    onError: (error) => {
      options?.onError?.(error)
      toast.error("Erro ao fechar a sala")
    },
  })

  return { closeRoom: mutation.mutate, isClosing: mutation.isPending }
}
