import { updateStory } from "@/api/stories"
import type { MutationOptions } from "@/mutation-options"
import type { RoomStateResponse } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type useUpdateStoryProps = {
    roomId: string
    storyId: string
    options?: MutationOptions<void>
}


export function useUpdateStory({ roomId, storyId, options }: useUpdateStoryProps) {
    const queryClient = useQueryClient() 
    
    const updateMutation = useMutation({
    mutationFn: (data) =>
      updateStory(roomId, storyId, data),
    onSuccess: (story) => {

        if (options?.onSuccess) {
        options.onSuccess(story)
      }
      queryClient.invalidateQueries({ queryKey: ['roomState', roomId] })
      
      toast.success('História atualizada')
     
    },
    onError: (error) => {
        if(options?.onError) {
            options.onError(error)
        }
        toast.error('Erro ao atualizar história')},
  })

  return { updateStory: updateMutation.mutate, isUpdating: updateMutation.isPending }
}