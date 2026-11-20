import type {
  BackendNoteItem,
  StructuredAiNoteContent,
} from "@/features/notes/utils/note-content";

export interface AiConvertPayload {
  text?: string;
  command?: string;
  file?: File | null;
  saveToDb?: boolean;
  parentId?: string | null;
  labelId?: string | null;
  labels?: string[];
  background?: string;
  signal?: AbortSignal;
}

export interface AiGeneratedNoteDraft {
  id?: string;
  title: string;
  plainText: string;
  content: StructuredAiNoteContent | string;
  labels: string[];
  background?: string;
  labelId?: string | null;
}

export interface AiAttachmentPreview {
  fileName: string;
  mimeType: string;
  storageKey: string;
}

export interface AiConvertResponse {
  success: boolean;
  note: BackendNoteItem | AiGeneratedNoteDraft;
  attachment?: AiAttachmentPreview | null;
}

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  fileName?: string;
  createdAt: number;
  note?: AiGeneratedNoteDraft;
  savedNoteId?: string;
  isSaved?: boolean;
  error?: string;
}
