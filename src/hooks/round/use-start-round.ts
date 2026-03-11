import { startRound } from "@/api/rounds"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import type { RoundResponse } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type UseStartRoundProps = {
  roomId: string
  options?: MutationOptions<RoundResponse>
}

export function useStartRound({ roomId, options }: UseStartRoundProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => startRound(roomId),
    onSuccess: (round) => {
      options?.onSuccess?.(round)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATE, roomId] })
    },
    onError: (error) => {
      options?.onError?.(error)
      toast.error("Erro ao iniciar rodada")
    },
  })

  return { startRound: mutation.mutate, isStarting: mutation.isPending }
}
