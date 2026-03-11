import { kickParticipant } from "@/api/rooms"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type UseKickParticipantProps = {
  roomId: string
  options?: MutationOptions<void>
}

export function useKickParticipant({ roomId, options }: UseKickParticipantProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (participantId: string) => kickParticipant(roomId, participantId),
    onSuccess: () => {
      options?.onSuccess?.()
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATE, roomId] })
      toast.success("Participante removido")
    },
    onError: (error) => {
      options?.onError?.(error)
      toast.error("Erro ao remover participante")
    },
  })

  return { kickParticipant: mutation.mutate, isKicking: mutation.isPending }
}
