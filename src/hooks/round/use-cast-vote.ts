import { castVote } from "@/api/rounds"
import type { MutationOptions } from "@/mutation-options"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

type UseCastVoteProps = {
  roomId: string
  options?: MutationOptions<string>
}

export function useCastVote({ roomId, options }: UseCastVoteProps) {
  const mutation = useMutation({
    mutationFn: (value: string) => castVote(roomId, { value }),
    onSuccess: (_, value) => {
      options?.onSuccess?.(value)
    },
    onError: (error) => {
      options?.onError?.(error)
      toast.error("Erro ao registrar voto")
    },
  })

  return { castVote: mutation.mutate, isCasting: mutation.isPending }
}
