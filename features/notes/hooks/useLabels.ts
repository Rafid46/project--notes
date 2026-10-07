import { useQuery } from "@tanstack/react-query";
import { LABELS } from "@/constants/api.constant";
import type { Label } from "@/features/home/types";

import { api } from "@/lib/axios";

export function useLabels(userId: string | null | undefined) {
  return useQuery<Label[]>({
    queryKey: ["labels", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await api.get(LABELS.getAll(userId));
      return data.labels || [];
    },
    enabled: !!userId,
  });
}
