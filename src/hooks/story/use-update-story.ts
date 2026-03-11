import { updateStory } from "@/api/stories"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import type { StoryResponse, StoryUpdateRequest } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type useUpdateStoryProps = {
    roomId: string
    storyId: string
    options?: MutationOptions<StoryResponse>
}


export function useUpdateStory({ roomId, storyId, options }: useUpdateStoryProps) {
    const queryClient = useQueryClient() 
    
    const updateMutation = useMutation({
    mutationFn: (data: StoryUpdateRequest) =>
      updateStory(roomId, storyId, data),
    onSuccess: (story) => {

        if (options?.onSuccess) {
        options.onSuccess(story)
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATE, roomId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STORY_LIST] })
      
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