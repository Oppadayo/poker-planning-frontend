import { deleteStory } from "@/api/stories"
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
    onSuccess: (_, storyId) => {
        if (options?.onSuccess) {
            options.onSuccess(_)
        }

      queryClient.setQueryData<RoomStateResponse>(['roomState', roomId], (old) => {
        if (!old) return old
        return { ...old, stories: old.stories.filter((s) => s.id !== storyId) }
      })
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