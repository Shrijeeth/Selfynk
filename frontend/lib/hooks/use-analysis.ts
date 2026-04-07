import { useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import type { Analysis } from "@/types"

export function useAnalysis(entryId: number | null) {
  return useQuery<Analysis>({
    queryKey: ["analysis", entryId],
    queryFn: async () => {
      const res = await api.get<Analysis>(`/api/v1/analysis/${entryId}`)
      return res.data
    },
    enabled: entryId !== null,
  })
}

export function useInvalidateAnalysis() {
  const queryClient = useQueryClient()
  return (entryId: number) =>
    queryClient.invalidateQueries({ queryKey: ["analysis", entryId] })
}
