"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Minimize2,
  FileText,
  Download,
} from "lucide-react";
import { ThinkingOrb } from "thinking-orbs";
import { useNoteById } from "@/features/notes/hooks/useNotes";
import NoteLabel from "@/features/notes/components/NoteLabel";
import LinkPreviewCard from "@/features/notes/components/LinkPreviewCard";
import ResizableNoteImage from "@/features/notes/components/ResizableNoteImage";
import { formatNoteContentToText } from "@/features/notes/utils/note-content";
import type { NoteItem, NoteFile } from "@/features/home/types";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useAppUser } from "@/providers/UserProvider";
import LoginModal from "@/features/auth/components/LoginModal";

interface NoteDetailClientProps {
  id: string;
}

interface BackendAttachment {
  id?: string;
  fileName?: string;
  mimeType?: string;
  storageKey?: string;
  name?: string;
  type?: string;
  url?: string;
  size?: number;
}

interface ServerNoteResponse {
  id: string;
  title: string;
  content: unknown;
  plainText?: string;
  parentId?: string | null;
  labelId?: string | null;
  labels?: string[];
  background?: string;
  color?: string;
  textColor?: string;
  category?: string | null;
  children?: NoteItem[];
  label?: { id: string; name: string };
  attachments?: BackendAttachment[];
  files?: BackendAttachment[];
  linkPreviews?: NoteItem["linkPreviews"];
  createdAt?: string;
  updatedAt?: string;
}

export default function NoteDetailClient({ id }: NoteDetailClientProps) {
  const router = useRouter();
  const { isSignedIn } = useAppUser();
  const { data: rawNote, isLoading, isError } = useNoteById(id);

  if (!isSignedIn) {
    return <LoginModal />;
  }

  if (isLoading) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
        <ThinkingOrb state="searching" size={64} />
      </main>
    );
  }

  if (isError || !rawNote) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6">
        <h1 className="text-xl font-semibold mb-2">Note not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The requested note could not be loaded or may have been deleted.
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <ArrowLeft size={16} />
              <span>Back to all notes</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent>Return to notes dashboard</TooltipContent>
        </Tooltip>
      </main>
    );
  }

  const serverData = rawNote as unknown as ServerNoteResponse;
  const note: NoteItem = {
    id: serverData.id,
    title: serverData.title || "Untitled",
    content: formatNoteContentToText(serverData.content, serverData.plainText),
    parentId: serverData.parentId ?? null,
    labelId: serverData.labelId ?? null,
    labels: Array.isArray(serverData.labels)
      ? serverData.labels
      : serverData.category
        ? [serverData.category]
        : [],
    color: serverData.background || serverData.color,
    background: serverData.background || serverData.color,
    textColor: serverData.textColor,
    category: serverData.label?.name || serverData.category,
    subNotes: serverData.children || [],
    files: (serverData.attachments || serverData.files || []).map((att) => ({
      id: att.id || `file-${Math.random().toString(36).slice(2, 9)}`,
      name: att.fileName || att.name || "attachment",
      type: att.mimeType || att.type || "application/octet-stream",
      url: att.storageKey || att.url || "",
      size: att.size || 0,
    })),
    linkPreviews: serverData.linkPreviews || [],
  };

  const images = (note.files || []).filter((f) => f.type?.startsWith("image/"));
  const nonImageFiles = (note.files || []).filter(
    (f) => !f.type?.startsWith("image/"),
  );

  return (
    <main
      className="min-h-screen w-full flex flex-col bg-background text-foreground overflow-y-auto sidebar-scrollbar"
      style={{
        backgroundColor: note.color || undefined,
      }}
    >
      <header className="pointer-events-none sticky top-0 z-40 w-full flex items-center justify-between px-6 py-5">
        <div className="pointer-events-auto flex h-11 items-center gap-1 rounded-full border border-border/80 bg-background/85 px-1.5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                aria-label="Back to notes"
              >
                <ArrowLeft size={15} />
                <span>Back to notes</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Back to notes</TooltipContent>
          </Tooltip>

          <span aria-hidden="true" className="h-4 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                aria-label="Exit fullscreen"
              >
                <Minimize2 size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Exit full screen</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <article className="flex-1 max-w-3xl w-full mx-auto px-6 pb-16 pt-2 flex flex-col gap-6">
        <div className="rounded-3xl border border-border/70 bg-background/75 backdrop-blur-sm p-6 sm:p-10 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)] flex flex-col gap-6">
          <div className="flex flex-col gap-4 border-b border-border/50 pb-6">
            <div className="flex flex-col gap-2">
              <h1
                className="text-2xl md:text-3xl font-bold leading-snug break-words"
                style={note.textColor ? { color: note.textColor } : undefined}
              >
                {note.title}
              </h1>
              {(serverData.updatedAt || serverData.createdAt) && (
                <time
                  dateTime={serverData.updatedAt || serverData.createdAt}
                  className="text-xs text-muted-foreground"
                >
                  Last updated{" "}
                  {new Date(
                    serverData.updatedAt || serverData.createdAt!,
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              )}
            </div>
            <NoteLabel note={note} variant="inline" />
          </div>

          {images.length > 0 && (
            <section className="flex flex-col gap-4">
              {images.map((img) => (
                <ResizableNoteImage key={img.id} file={img} />
              ))}
            </section>
          )}

          <section
            className="text-base leading-relaxed whitespace-pre-wrap min-h-32"
            style={note.textColor ? { color: note.textColor } : undefined}
          >
            {note.content}
          </section>

          {nonImageFiles.length > 0 && (
            <section className="flex flex-col gap-2 pt-4 border-t border-border/50">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Attachments ({nonImageFiles.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nonImageFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border/70 bg-card shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <FileText
                        size={18}
                        className="text-muted-foreground shrink-0"
                      />
                      <span className="text-xs font-medium truncate">
                        {file.name}
                      </span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={file.url}
                          download={file.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <Download size={15} />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>Download file</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </section>
          )}

          {note.linkPreviews && note.linkPreviews.length > 0 && (
            <section className="flex flex-col gap-2 pt-4 border-t border-border/50">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Link Previews
              </h2>
              <div className="flex flex-col gap-2">
                {note.linkPreviews.map((preview) => (
                  <LinkPreviewCard key={preview.url} preview={preview} />
                ))}
              </div>
            </section>
          )}

          {note.subNotes && note.subNotes.length > 0 && (
            <section className="flex flex-col gap-2 pt-4 border-t border-border/50">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Subnotes ({note.subNotes.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {note.subNotes.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/notes/${sub.id}`}
                    className="p-4 rounded-2xl border border-border/70 bg-card hover:border-foreground/30 transition-colors shadow-2xs"
                  >
                    <h3 className="text-sm font-semibold mb-1">{sub.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {sub.content}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </main>
  );
}
