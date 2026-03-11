import { deleteStory } from "@/api/stories"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import type { RoomStateResponse } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type useDeleteStoryProps = {
    roomId: string
    options?: MutationOptions<void>
}

export function useDeleteStory({ roomId, options }: useDeleteStoryProps    ){

    const queryClient = useQueryClient()

     const deleteMutation = useMutation({
    mutationFn: (storyId: string) => deleteStory(roomId, storyId),
    onSuccess: (_) => {
        if (options?.onSuccess) {
            options.onSuccess(_)
        }

        queryClient.invalidateQueries({queryKey: [QUERY_KEYS.ROOM_STATE, roomId]})
        queryClient.invalidateQueries({queryKey: [QUERY_KEYS.STORY_LIST]})
      
      toast.success('História removida')
    },
    onError: (error) => {
        if (options?.onError) {
            options.onError(error)
        }
        toast.error('Erro ao remover história')}

        
  })

  return { deleteStory: deleteMutation.mutate, isDeleting: deleteMutation.isPending }
}