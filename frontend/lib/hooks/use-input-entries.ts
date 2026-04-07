import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import type { InputMode, InputEntry, Emotion } from "@/types"

const ENTRIES_KEY = "input-entries"

export interface CreateEntryPayload {
  mode: InputMode
  content: string
  context_tags?: string[]
  emotion?: Emotion | null
  alignment_score?: number | null
}

export interface UpdateEntryPayload {
  mode?: InputMode
  content?: string
  context_tags?: string[]
  emotion?: Emotion | null
  alignment_score?: number | null
}

export function useInputEntries(mode?: InputMode) {
  return useQuery<InputEntry[]>({
    queryKey: mode ? [ENTRIES_KEY, mode] : [ENTRIES_KEY],
    queryFn: async () => {
      const res = await api.get<InputEntry[]>("/api/v1/input", {
        params: { limit: 100, ...(mode ? { mode } : {}) },
      })
      return res.data
    },
  })
}

export function useCreateEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateEntryPayload) => {
      const res = await api.post<InputEntry>("/api/v1/input", payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENTRIES_KEY] })
    },
  })
}

export function useUpdateEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: UpdateEntryPayload & { id: number }) => {
      const res = await api.put<InputEntry>(`/api/v1/input/${id}`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENTRIES_KEY] })
    },
  })
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/input/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENTRIES_KEY] })
    },
  })
}
