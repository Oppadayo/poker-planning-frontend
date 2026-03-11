import { resetRound } from "@/api/rounds"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import type { RoundResponse } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type UseResetRoundProps = {
  roomId: string
  options?: MutationOptions<RoundResponse>
}

export function useResetRound({ roomId, options }: UseResetRoundProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => resetRound(roomId),
    onSuccess: (round) => {
      options?.onSuccess?.(round)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATE, roomId] })
    },
    onError: (error) => {
      options?.onError?.(error)
      toast.error("Erro ao resetar rodada")
    },
  })

  return { resetRound: mutation.mutate, isResetting: mutation.isPending }
}
