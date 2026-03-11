import { revealVotes } from "@/api/rounds"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import type { RoundResponse } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type UseRevealVotesProps = {
  roomId: string
  options?: MutationOptions<RoundResponse>
}

export function useRevealVotes({ roomId, options }: UseRevealVotesProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => revealVotes(roomId),
    onSuccess: (round) => {
      options?.onSuccess?.(round)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATE, roomId] })
    },
    onError: (error) => {
      options?.onError?.(error)
      toast.error("Erro ao revelar votos")
    },
  })

  return { revealVotes: mutation.mutate, isRevealing: mutation.isPending }
}
