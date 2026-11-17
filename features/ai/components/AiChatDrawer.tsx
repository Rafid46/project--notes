"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ThinkingOrb } from "thinking-orbs";
import {
  Sparkles,
  X,
  Paperclip,
  ArrowUp,
  ExternalLink,
  Check,
  FileText,
  RotateCcw,
  BookmarkPlus,
  Loader2,
} from "lucide-react";
import type { Label, NoteItem } from "@/features/home/types";
import {
  extractStructuredContent,
  mapBackendNoteToNoteItem,
  type BackendNoteItem,
} from "@/features/notes/utils/note-content";
import { useAiConvert, useSaveAiNote } from "../hooks/useAiConvert";
import type { AiChatMessage, AiGeneratedNoteDraft } from "../types";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLabel?: Label | null;
  notesCount: number;
  onNoteCreated: (note: NoteItem) => void;
  onOpenNote: (noteId: string) => void;
  onLimitReached?: () => void;
}

const MAX_NOTES_LIMIT = 5;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const STARTER_PROMPTS = [
  "Turn rough meeting notes into structured action items",
  "Create a clean study guide on React Server Components",
  "Summarize key ideas and takeaways from an uploaded file",
];

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Could not generate note. Please try again.";
}

export default function AiChatDrawer({
  isOpen,
  onClose,
  selectedLabel,
  notesCount,
  onNoteCreated,
  onOpenNote,
  onLimitReached,
}: AiChatDrawerProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [applyActiveLabel, setApplyActiveLabel] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const aiConvert = useAiConvert();
  const saveAiNote = useSaveAiNote();

  const isAtLimit = notesCount >= MAX_NOTES_LIMIT;
  const effectiveAutoSave = autoSave && !isAtLimit;

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiConvert.isPending]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleFileSelect = (file: File | null) => {
    setFileError(null);
    if (!file) {
      setAttachedFile(null);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError("File exceeds the 25 MB limit.");
      return;
    }
    setAttachedFile(file);
  };

  const handleSend = async (promptOverride?: string) => {
    const textValue = (promptOverride ?? input).trim();
    if ((!textValue && !attachedFile) || aiConvert.isPending) return;

    const currentFile = promptOverride ? null : attachedFile;
    const userMessage: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textValue || `Convert attached file: ${currentFile?.name ?? "file"}`,
      fileName: currentFile?.name,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!promptOverride) {
      setInput("");
      setAttachedFile(null);
    }
    setFileError(null);

    const activeLabelName =
      applyActiveLabel && selectedLabel ? selectedLabel.name : undefined;
    const activeLabelId =
      applyActiveLabel && selectedLabel ? selectedLabel.id : undefined;

    try {
      const response = await aiConvert.mutateAsync({
        file: currentFile,
        text: currentFile
          ? textValue || undefined
          : textValue,
        command: currentFile
          ? textValue || "Convert this file into clear, well-structured notes."
          : textValue,
        saveToDb: effectiveAutoSave,
        labelId: activeLabelId,
        labels: activeLabelName ? [activeLabelName] : undefined,
      });

      const rawNote = response.note;
      const isSavedRecord =
        effectiveAutoSave &&
        "id" in rawNote &&
        typeof rawNote.id === "string" &&
        rawNote.id.length > 0;

      if (isSavedRecord) {
        const mapped = mapBackendNoteToNoteItem(rawNote as BackendNoteItem);
        onNoteCreated(mapped);
      }

      const draft: AiGeneratedNoteDraft = {
        id: "id" in rawNote ? rawNote.id : undefined,
        title: rawNote.title || "AI Generated Note",
        plainText: rawNote.plainText || "",
        content: rawNote.content as AiGeneratedNoteDraft["content"],
        labels: Array.isArray(rawNote.labels) ? rawNote.labels : [],
      };

      const assistantMessage: AiChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        text: isSavedRecord
          ? "Created and saved your note."
          : isAtLimit
            ? "Generated a preview draft (5-note board limit reached)."
            : "Generated a draft preview.",
        createdAt: Date.now(),
        note: draft,
        savedNoteId: isSavedRecord ? draft.id : undefined,
        isSaved: isSavedRecord,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantError: AiChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: "assistant",
        text: "Unable to create note.",
        error: getErrorMessage(error),
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantError]);
    }
  };

  const handleSaveDraft = async (
    messageId: string,
    draft: AiGeneratedNoteDraft,
  ) => {
    if (isAtLimit) {
      onLimitReached?.();
      return;
    }
    setSavingMessageId(messageId);
    try {
      const activeLabelId =
        applyActiveLabel && selectedLabel ? selectedLabel.id : undefined;
      const saved = await saveAiNote.mutateAsync({
        title: draft.title,
        content: draft.content as string,
        plainText: draft.plainText,
        labels: draft.labels,
        labelId: activeLabelId,
      });
      const mapped = mapBackendNoteToNoteItem(saved);
      onNoteCreated(mapped);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                isSaved: true,
                savedNoteId: saved.id,
                text: "Saved to your notes.",
              }
            : msg,
        ),
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, error: getErrorMessage(error) }
            : msg,
        ),
      );
    } finally {
      setSavingMessageId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      handleFileSelect(dropped);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <motion.aside
            aria-label="AI Note Assistant"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="pointer-events-auto fixed top-21 bottom-6 right-6 z-40 flex w-[420px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-3xl border border-border/80 bg-popover/95 text-popover-foreground shadow-[0_24px_64px_-16px_rgba(0,0,0,0.28)] backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#BBDC12]/25 text-[#495a00] dark:text-[#BBDC12]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold leading-none text-foreground">
                    AI Note Assistant
                  </h2>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Prompt or drop a file to generate notes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setMessages([])}
                        aria-label="Clear chat"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>New chat</TooltipContent>
                  </Tooltip>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close AI assistant"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sidebar-scrollbar">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col justify-between gap-6 py-2">
                  <div className="flex flex-col items-center text-center px-3 pt-6">
                    <ThinkingOrb state="breathing" size={64} />
                    <h3 className="mt-4 text-sm font-semibold text-foreground">
                      What should we turn into a note?
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Paste rough thoughts, ask for structured study notes, or
                      attach a PDF, DOCX, image, or text file.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="px-1 text-[11px] font-semibold uppercase text-muted-foreground/80">
                      Try a prompt
                    </span>
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSend(prompt)}
                        className="flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-background/70 px-3.5 py-2.5 text-left text-xs font-medium text-foreground transition-colors hover:border-border hover:bg-secondary/70 cursor-pointer"
                      >
                        <span className="line-clamp-2">{prompt}</span>
                        <ArrowUp
                          size={14}
                          className="shrink-0 rotate-45 text-muted-foreground"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((msg) => {
                    if (msg.role === "user") {
                      return (
                        <div key={msg.id} className="flex justify-end">
                          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-secondary px-3.5 py-2.5 text-xs text-foreground shadow-2xs">
                            {msg.fileName && (
                              <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                <FileText size={11} />
                                <span className="max-w-[180px] truncate">
                                  {msg.fileName}
                                </span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {msg.text}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    const structured = msg.note
                      ? extractStructuredContent(msg.note.content)
                      : null;

                    return (
                      <div key={msg.id} className="flex flex-col gap-2">
                        {msg.error && !msg.note ? (
                          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
                            {msg.error}
                          </div>
                        ) : (
                          msg.note && (
                            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    msg.isSaved
                                      ? "bg-[#BBDC12]/25 text-[#495a00] dark:text-[#BBDC12]"
                                      : "bg-secondary text-muted-foreground"
                                  }`}
                                >
                                  {msg.isSaved && <Check size={10} />}
                                  <span>
                                    {msg.isSaved ? "Saved to board" : "Draft preview"}
                                  </span>
                                </span>

                                {msg.note.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {msg.note.labels.slice(0, 3).map((lbl) => (
                                      <span
                                        key={lbl}
                                        className="rounded-full border border-border/70 bg-secondary/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                                      >
                                        {lbl}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <h4 className="mt-2.5 text-sm font-semibold text-foreground">
                                {msg.note.title}
                              </h4>

                              {structured?.summary && (
                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                  {structured.summary}
                                </p>
                              )}

                              {structured?.notes && (
                                <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-foreground/85">
                                  {structured.notes}
                                </p>
                              )}

                              {!structured?.notes && msg.note.plainText && (
                                <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-foreground/85">
                                  {msg.note.plainText}
                                </p>
                              )}

                              {Array.isArray(structured?.keyTakeaways) &&
                                structured.keyTakeaways.length > 0 && (
                                  <ul className="mt-2.5 space-y-1 border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
                                    {structured.keyTakeaways
                                      .slice(0, 4)
                                      .map((point, index) => (
                                        <li
                                          key={index}
                                          className="flex items-start gap-1.5"
                                        >
                                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/50" />
                                          <span>{point}</span>
                                        </li>
                                      ))}
                                  </ul>
                                )}

                              {msg.error && (
                                <p className="mt-2 text-[11px] text-destructive">
                                  {msg.error}
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
                                {msg.savedNoteId ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onOpenNote(msg.savedNoteId!)
                                      }
                                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#BBDC12] px-3.5 text-xs font-semibold text-[#004030] transition-all hover:bg-[#BBDC12]/90 cursor-pointer"
                                    >
                                      <span>Open Note</span>
                                    </button>
                                    <Link
                                      href={`/notes/${msg.savedNoteId}`}
                                      className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-secondary/70 px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                                    >
                                      <span>Full Page</span>
                                      <ExternalLink size={12} />
                                    </Link>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={savingMessageId === msg.id}
                                    onClick={() =>
                                      handleSaveDraft(msg.id, msg.note!)
                                    }
                                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#BBDC12] px-3.5 text-xs font-semibold text-[#004030] transition-all hover:bg-[#BBDC12]/90 disabled:opacity-60 cursor-pointer"
                                  >
                                    {savingMessageId === msg.id ? (
                                      <Loader2
                                        size={13}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <BookmarkPlus size={13} />
                                    )}
                                    <span>Save to Notes</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}

                  {aiConvert.isPending && (
                    <div className="flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card/70 px-3.5 py-2.5 text-xs text-muted-foreground">
                      <ThinkingOrb state="composing" size={32} />
                      <span>Structuring your note...</span>
                    </div>
                  )}

                  <div ref={listEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-border/60 bg-background/60 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                <button
                  type="button"
                  onClick={() => setAutoSave((prev) => !prev)}
                  disabled={isAtLimit}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                    effectiveAutoSave
                      ? "border-[#BBDC12]/50 bg-[#BBDC12]/15 text-foreground"
                      : "border-border bg-secondary/70 text-muted-foreground"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      effectiveAutoSave ? "bg-[#7e9800] dark:bg-[#BBDC12]" : "bg-muted-foreground"
                    }`}
                  />
                  <span>
                    {isAtLimit
                      ? "Preview only (5/5 limit)"
                      : effectiveAutoSave
                        ? "Auto-save to board"
                        : "Preview before saving"}
                  </span>
                </button>

                {selectedLabel && (
                  <button
                    type="button"
                    onClick={() => setApplyActiveLabel((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      applyActiveLabel
                        ? "border-border bg-secondary text-foreground"
                        : "border-border/60 bg-transparent text-muted-foreground"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: selectedLabel.color || "currentColor",
                      }}
                    />
                    <span className="max-w-[110px] truncate">
                      {selectedLabel.name}
                    </span>
                  </button>
                )}
              </div>

              {attachedFile && (
                <div className="mb-2 flex items-center justify-between rounded-xl border border-border/80 bg-secondary/60 px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={13} className="shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium text-foreground">
                      {attachedFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    aria-label="Remove attachment"
                    className="ml-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {fileError && (
                <p className="mb-2 px-1 text-[11px] text-destructive">
                  {fileError}
                </p>
              )}

              <div className="flex items-end gap-2 rounded-2xl border border-border/80 bg-background px-3 py-2 shadow-2xs focus-within:border-foreground/30">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.csv,.docx,.pdf,image/*,audio/*"
                  className="hidden"
                  onChange={(e) => {
                    handleFileSelect(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Attach file"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
                    >
                      <Paperclip size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Attach file (PDF, DOCX, image, text)</TooltipContent>
                </Tooltip>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe the note or instructions..."
                  className="max-h-28 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none sidebar-scrollbar"
                />

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={
                    aiConvert.isPending || (!input.trim() && !attachedFile)
                  }
                  aria-label="Generate note"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#BBDC12] text-[#004030] transition-all hover:bg-[#BBDC12]/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {aiConvert.isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ArrowUp size={16} />
                  )}
                </button>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
