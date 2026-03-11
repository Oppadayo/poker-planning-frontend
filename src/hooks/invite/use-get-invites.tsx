import { listInvites } from "@/api/invites"
import { useQuery } from "@tanstack/react-query"

export const useGetInvites = (roomId: string) => {

const { data: invites, isLoading } = useQuery({
    queryKey: ['invites', roomId],
    queryFn: () => listInvites(roomId),
  })

return { invites, isLoading }

}