import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { LABELS } from "@/constants/api.constant";
import type { Label } from "@/features/home/types";
import { api } from "@/lib/axios";

export function useLabels(params?: {
  keyword?: string;
  limit?: number;
  skip?: number;
}) {
  return useQuery<Label[]>({
    queryKey: ["labels", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.keyword?.trim()) searchParams.append("keyword", params.keyword.trim());
      if (params?.limit !== undefined) searchParams.append("limit", String(params.limit));
      if (params?.skip !== undefined) searchParams.append("skip", String(params.skip));
      const url = searchParams.toString() ? `${LABELS.getAll}?${searchParams.toString()}` : LABELS.getAll;
      const { data } = await api.get(url);
      return data.labels || [];
    },
  });
}

export function useInfiniteLabels(params: {
  keyword?: string;
  limit?: number;
} = {}) {
  const { keyword = "", limit = 15 } = params;
  return useInfiniteQuery({
    queryKey: ["labels", "infinite", keyword, limit],
    queryFn: async ({ pageParam = 0 }) => {
      const searchParams = new URLSearchParams();
      if (keyword.trim()) searchParams.append("keyword", keyword.trim());
      searchParams.append("limit", String(limit));
      searchParams.append("skip", String(pageParam));

      const { data } = await api.get(`${LABELS.getAll}?${searchParams.toString()}`);
      return {
        labels: (data.labels || []) as Label[],
        total: (data.total ?? (data.labels?.length || 0)) as number,
        skip: pageParam,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentCount = allPages.reduce((acc, p) => acc + (p.labels?.length || 0), 0);
      if (currentCount < lastPage.total) {
        return currentCount;
      }
      return undefined;
    },
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const { data } = await api.post(LABELS.create, { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });
}

export function useUpdateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.put(LABELS.update(id), { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });
}

export function useDeleteLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(LABELS.delete(id));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });
}

export function useSetNoteLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      noteId,
      labels,
      labelId,
    }: {
      noteId: string;
      labels?: string[];
      labelId?: string | null;
    }) => {
      const { data } = await api.patch(LABELS.setNoteLabel, {
        noteId,
        labels,
        labelId,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note", variables.noteId] });
    },
  });
}
