import { revokeInvite } from "@/api/invites"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type useRevokeInviteProps = {
    options?: MutationOptions<{inviteId: string}>
    roomId: string
}



export function useRevokeInvite({ roomId, options }: useRevokeInviteProps) {

const queryClient = useQueryClient()

    const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => revokeInvite(roomId, inviteId),
    onSuccess: (inviteId) => {
        if (options?.onSuccess) {
            options.onSuccess(inviteId)
        }

        queryClient.invalidateQueries({queryKey: [QUERY_KEYS.INVITES, inviteId]})
        toast.success('Convite revogado')
    },
    onError: (error) => {if(options?.onError) {options.onError(error)}
        toast.error('Erro ao revogar convite')
    },
  })

  return { revokeInvite: revokeMutation.mutate, isRevoking: revokeMutation.isPending }



}