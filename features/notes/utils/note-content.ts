import type { LinkPreviewMetadata, NoteItem } from "@/features/home/types";

export interface BackendAttachment {
  id?: string;
  fileName?: string;
  mimeType?: string;
  storageKey?: string;
  name?: string;
  type?: string;
  url?: string;
  size?: number;
}

export interface BackendNoteItem {
  id: string;
  title: string;
  content: unknown;
  plainText?: string;
  parentId?: string | null;
  labelId?: string | null;
  boardX?: number | null;
  boardY?: number | null;
  labels?: string[];
  background?: string;
  color?: string;
  textColor?: string;
  category?: string | null;
  children?: NoteItem[];
  label?: { id: string; name: string };
  attachments?: BackendAttachment[];
  files?: BackendAttachment[];
  linkPreviews?: LinkPreviewMetadata[];
  isArchived?: boolean;
  deletedAt?: string | null;
}

export interface StructuredAiNoteContent {
  summary?: string;
  notes?: string;
  keyTakeaways?: string[];
  text?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isStructuredContent(value: unknown): value is StructuredAiNoteContent {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function extractStructuredContent(
  content: unknown,
): StructuredAiNoteContent | null {
  if (isStructuredContent(content)) {
    return content;
  }
  if (typeof content === "string") {
    const trimmed = content.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (isStructuredContent(parsed)) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function formatNoteContentToHtml(
  content: unknown,
  plainText?: string,
): string {
  if (typeof content === "string") {
    const structured = extractStructuredContent(content);
    if (!structured) {
      return content;
    }
    return formatStructuredToHtml(structured, plainText);
  }

  if (isStructuredContent(content)) {
    return formatStructuredToHtml(content, plainText);
  }

  return plainText ? escapeHtml(plainText) : "";
}

function formatStructuredToHtml(
  structured: StructuredAiNoteContent,
  plainText?: string,
): string {
  const parts: string[] = [];

  if (structured.summary) {
    parts.push(`<p><strong>${escapeHtml(structured.summary)}</strong></p>`);
  }

  const bodyText = structured.notes || structured.text || plainText;
  if (bodyText) {
    const paragraphs = bodyText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`);
    parts.push(...paragraphs);
  }

  if (Array.isArray(structured.keyTakeaways) && structured.keyTakeaways.length > 0) {
    const items = structured.keyTakeaways
      .map((item) => `<li>${escapeHtml(String(item))}</li>`)
      .join("");
    parts.push(`<ul>${items}</ul>`);
  }

  if (parts.length === 0) {
    return plainText ? `<p>${escapeHtml(plainText)}</p>` : "";
  }

  return parts.join("");
}

export function formatNoteContentToText(
  content: unknown,
  plainText?: string,
): string {
  if (typeof content === "string") {
    const structured = extractStructuredContent(content);
    if (!structured) {
      return content || plainText || "";
    }
    return formatStructuredToText(structured, plainText);
  }

  if (isStructuredContent(content)) {
    return formatStructuredToText(content, plainText);
  }

  return plainText || "";
}

function formatStructuredToText(
  structured: StructuredAiNoteContent,
  plainText?: string,
): string {
  if (plainText && plainText.trim()) {
    return plainText;
  }

  const sections: string[] = [];
  if (structured.summary) {
    sections.push(structured.summary);
  }
  if (structured.notes || structured.text) {
    sections.push(structured.notes || structured.text || "");
  }
  if (Array.isArray(structured.keyTakeaways) && structured.keyTakeaways.length > 0) {
    sections.push(
      `Key Takeaways:\n${structured.keyTakeaways.map((item) => `• ${item}`).join("\n")}`,
    );
  }
  return sections.join("\n\n");
}

export function mapBackendNoteToNoteItem(note: BackendNoteItem): NoteItem {
  return {
    id: note.id,
    title: note.title || "Untitled",
    parentId: note.parentId ?? null,
    labelId: note.labelId ?? null,
    boardX: typeof note.boardX === "number" ? note.boardX : null,
    boardY: typeof note.boardY === "number" ? note.boardY : null,
    labels:
      Array.isArray(note.labels) && note.labels.length > 0
        ? note.labels
        : note.label?.name
          ? [note.label.name]
          : note.category
            ? [note.category]
            : [],
    color: note.background || note.color,
    background: note.background || note.color,
    textColor: note.textColor,
    subNotes: note.children || [],
    files: (note.attachments || note.files || []).map((att) => ({
      id: att.id || `file-${Math.random().toString(36).slice(2, 9)}`,
      name: att.fileName || att.name || "attachment",
      type: att.mimeType || att.type || "application/octet-stream",
      url: att.storageKey || att.url || "",
      size: att.size || 0,
    })),
    linkPreviews: note.linkPreviews || [],
    content: formatNoteContentToHtml(note.content, note.plainText),
    category: note.label?.name || note.category,
    isArchived: Boolean(note.isArchived),
    deletedAt: note.deletedAt ?? null,
  };
}
