import { transferHost } from "@/api/rooms"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type UseTransferHostProps = {
  roomId: string
  options?: MutationOptions<void>
}

export function useTransferHost({ roomId, options }: UseTransferHostProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (participantId: string) => transferHost(roomId, participantId),
    onSuccess: () => {
      options?.onSuccess?.()
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATE, roomId] })
      toast.success("Host transferido")
    },
    onError: (error) => {
      options?.onError?.(error)
      toast.error("Erro ao transferir host")
    },
  })

  return { transferHost: mutation.mutate, isTransferring: mutation.isPending }
}
