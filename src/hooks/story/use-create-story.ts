import { createStory } from "@/api/stories"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import type { StoryResponse } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"


type useCreateStoryProps = {
    options?: MutationOptions<StoryResponse>
    roomId: string
}

export function useCreateStory({roomId, options }: useCreateStoryProps ) {
    const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data) => createStory(roomId, data),
    onSuccess: (story) => {
        if (options?.onSuccess) {
            options.onSuccess(story)
        }
        queryClient.invalidateQueries({queryKey: [QUERY_KEYS.ROOM_STATE, roomId]})
        queryClient.invalidateQueries({queryKey: [QUERY_KEYS.STORY_LIST]})
      
        toast.success('História criada')
    },
    onError: (error) => {
        if(options?.onError) {
            options.onError(error)
        }
        toast.error('Erro ao criar história')},
  })

  return { createStory: createMutation.mutate, isCreating: createMutation.isPending }
}