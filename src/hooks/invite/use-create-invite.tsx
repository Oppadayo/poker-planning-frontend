import { createInvite } from "@/api/invites"
import type { MutationOptions } from "@/mutation-options"
import type { InviteCreateRequest, InviteResponse } from "@/types"
import { useMutation, useQueryClient} from "@tanstack/react-query"
import { toast } from "sonner"

const FRONTEND_URL = window.location.origin


type useCreateInviteProps = {
    options?: MutationOptions<InviteResponse>
    roomId: string
}


export function useCreateInvite({ roomId, options }: useCreateInviteProps) {

    const queryClient = useQueryClient()


const createMutation = useMutation({
    mutationFn: (data: InviteCreateRequest) => {
      
      return createInvite(roomId, data)
    },
    onSuccess: (invite) => {
        if (options?.onSuccess) {
            options.onSuccess(invite)
        }

      queryClient.setQueryData<InviteResponse[]>(['invites', roomId], (old) => [
        ...(old ?? []),
        invite,
      ])
      toast.success('Convite criado!')
      if (invite.token) {
        const link = `${FRONTEND_URL}/invite/${invite.token}`
        navigator.clipboard.writeText(link)
        toast.info('Link copiado para a área de transferência')
      }
      
    },
    onError: (error) => {
        if (options?.onError) {
            options.onError(error)
        }
        toast.error('Erro ao criar convite')
    },
  })

  return {createInvite: createMutation.mutate, isCreating: createMutation.isPending }
}