import { selectStory } from "@/api/stories"
import { QUERY_KEYS } from "@/constants/query-keys"
import type { MutationOptions } from "@/mutation-options"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type UseSelectStoryProps = {
  roomId: string
  options?: MutationOptions<void>
}

export function useSelectStory({ roomId, options }: UseSelectStoryProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (storyId: string) => selectStory(roomId, storyId),
    onSuccess: () => {
      options?.onSuccess?.()
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATE, roomId] })
    },
    onError: (error) => {
      options?.onError?.(error)
      toast.error("Erro ao selecionar história")
    },
  })

  return { selectStory: mutation.mutate, isSelecting: mutation.isPending }
}
