import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NOTES } from "@/constants/api.constant";
import { api } from "@/lib/axios";
import { NotePayload } from "@/types/Note-type";

export function useNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data } = await api.get(NOTES.getAll);
      return data.notes || [];
    },
  });
}

export function useNoteById(id: string) {
  return useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      const { data } = await api.get(NOTES.getById(id));
      return data.notes || [];
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
