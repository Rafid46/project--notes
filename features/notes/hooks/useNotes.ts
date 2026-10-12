import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { NOTES } from "@/constants/api.constant";
import { api } from "@/lib/axios";
import { NotePayload } from "@/types/Note-type";

export function useNotes(params?: {
  keyword?: string;
  limit?: number;
  skip?: number;
}) {
  return useQuery({
    queryKey: ["notes", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.keyword?.trim()) searchParams.append("keyword", params.keyword.trim());
      if (params?.limit !== undefined) searchParams.append("limit", String(params.limit));
      if (params?.skip !== undefined) searchParams.append("skip", String(params.skip));
      const url = searchParams.toString() ? `${NOTES.getAll}?${searchParams.toString()}` : NOTES.getAll;
      const { data } = await api.get(url);
      return data.notes || [];
    },
  });
}

export function useInfiniteNotes(params: {
  keyword?: string;
  limit?: number;
} = {}) {
  const { keyword = "", limit = 15 } = params;
  return useInfiniteQuery({
    queryKey: ["notes", "infinite", keyword, limit],
    queryFn: async ({ pageParam = 0 }) => {
      const searchParams = new URLSearchParams();
      if (keyword.trim()) searchParams.append("keyword", keyword.trim());
      searchParams.append("limit", String(limit));
      searchParams.append("skip", String(pageParam));

      const { data } = await api.get(`${NOTES.getAll}?${searchParams.toString()}`);
      return {
        notes: data.notes || [],
        total: data.total ?? (data.notes?.length || 0),
        skip: pageParam,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentCount = allPages.reduce((acc, p) => acc + (p.notes?.length || 0), 0);
      if (currentCount < lastPage.total) {
        return currentCount;
      }
      return undefined;
    },
  });
}

export function useNoteById(id: string) {
  return useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      const { data } = await api.get(NOTES.getById(id));
      return data.note || data.notes || null;
    },
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NotePayload) => {
      const { data } = await api.post(NOTES.create, payload);
      return data.notes || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: NotePayload;
    }) => {
      const { data } = await api.put(NOTES.update(id), payload);
      return data.notes || [];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note", variables.id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(NOTES.delete(id));
      return data.notes || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
