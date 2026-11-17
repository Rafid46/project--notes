import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AI, NOTES } from "@/constants/api.constant";
import { api } from "@/lib/axios";
import type { NotePayload } from "@/types/Note-type";
import type { BackendNoteItem } from "@/features/notes/utils/note-content";
import type { AiConvertPayload, AiConvertResponse } from "../types";

export function useAiConvert() {
  const queryClient = useQueryClient();

  return useMutation<AiConvertResponse, Error, AiConvertPayload>({
    mutationFn: async (payload) => {
      if (payload.file) {
        const formData = new FormData();
        formData.append("file", payload.file);
        if (payload.text?.trim()) {
          formData.append("text", payload.text.trim());
        }
        if (payload.command?.trim()) {
          formData.append("command", payload.command.trim());
        }
        formData.append("saveToDb", String(payload.saveToDb ?? true));
        if (payload.parentId) {
          formData.append("parentId", payload.parentId);
        }
        if (payload.labelId) {
          formData.append("labelId", payload.labelId);
        }
        if (payload.background) {
          formData.append("background", payload.background);
        }
        if (payload.labels && payload.labels.length > 0) {
          payload.labels.forEach((label) => formData.append("labels", label));
        }

        const { data } = await api.post<AiConvertResponse>(AI.convert, formData);
        return data;
      }

      const body = {
        text: payload.text?.trim() || "",
        command: payload.command?.trim() || undefined,
        saveToDb: payload.saveToDb ?? true,
        parentId: payload.parentId || undefined,
        labelId: payload.labelId || undefined,
        labels: payload.labels && payload.labels.length > 0 ? payload.labels : undefined,
        background: payload.background || undefined,
      };

      const { data } = await api.post<AiConvertResponse>(AI.convert, body);
      return data;
    },
    onSuccess: (_data, variables) => {
      if (variables.saveToDb !== false) {
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      }
    },
  });
}

export function useSaveAiNote() {
  const queryClient = useQueryClient();

  return useMutation<BackendNoteItem, Error, NotePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<{ success: boolean; note: BackendNoteItem }>(
        NOTES.create,
        payload,
      );
      return data.note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
