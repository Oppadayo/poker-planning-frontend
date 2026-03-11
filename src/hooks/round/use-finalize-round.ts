import { finalizeRound } from "@/api/rounds"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import type { RoundResponse } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type UseFinalizeRoundProps = {
  roomId: string
  options?: MutationOptions<RoundResponse>
}

export function useFinalizeRound({ roomId, options }: UseFinalizeRoundProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (finalEstimate: string) => finalizeRound(roomId, { finalEstimate }),
    onSuccess: (round) => {
      options?.onSuccess?.(round)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATE, roomId] })
      toast.success("Estimativa finalizada!")
    },
    onError: (error) => {
      options?.onError?.(error)
      toast.error("Erro ao finalizar estimativa")
    },
  })

  return { finalizeRound: mutation.mutate, isFinalizing: mutation.isPending }
}
