import { revokeInvite } from "@/api/invites"
import { useMutation, useQueryClient, type MutationOptions } from "@tanstack/react-query"
import { toast } from "sonner"

type useRevokeInviteProps = {
    options?: MutationOptions<void>
    roomId: string
}



export function useRevokeInvite({ roomId, options }: useRevokeInviteProps) {

const queryClient = useQueryClient()

    const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => revokeInvite(roomId, inviteId),
    onSuccess: (_) => {
        if (options?.onSuccess) {
            options.onSuccess(_)
        }

        queryClient.invalidateQueries(['invites', roomId])
        toast.success('Convite revogado')
    },
    onError: (error) => {if(options?.onError) {options.onError(error)}
        toast.error('Erro ao revogar convite')
    },
  })

  return { revokeInvite: revokeMutation.mutate, isRevoking: revokeMutation.isPending }



}