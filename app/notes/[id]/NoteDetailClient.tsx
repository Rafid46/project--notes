"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minimize2, FileText, Download, Loader2 } from "lucide-react";
import { useNoteById } from "@/features/notes/hooks/useNotes";
import NoteLabel from "@/features/notes/components/NoteLabel";
import LinkPreviewCard from "@/features/notes/components/LinkPreviewCard";
import type { NoteItem, NoteFile } from "@/features/home/types";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface NoteDetailClientProps {
  id: string;
}

interface ServerNoteResponse {
  id: string;
  title: string;
  content: unknown;
  plainText?: string;
  parentId?: string | null;
  labelId?: string | null;
  labels?: string[];
  color?: string;
  textColor?: string;
  category?: string | null;
  children?: NoteItem[];
  label?: { id: string; name: string };
  attachments?: NoteFile[];
  files?: NoteFile[];
  linkPreviews?: NoteItem["linkPreviews"];
  createdAt?: string;
  updatedAt?: string;
}

export default function NoteDetailClient({ id }: NoteDetailClientProps) {
  const router = useRouter();
  const { data: rawNote, isLoading, isError } = useNoteById(id);

  if (isLoading) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
          <p className="text-xs text-muted-foreground">Loading note...</p>
        </div>
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
    content:
      typeof serverData.content === "string"
        ? serverData.content
        : serverData.content
          ? JSON.stringify(serverData.content)
          : serverData.plainText || "",
    parentId: serverData.parentId ?? null,
    labelId: serverData.labelId ?? null,
    labels: Array.isArray(serverData.labels)
      ? serverData.labels
      : serverData.category
        ? [serverData.category]
        : [],
    color: serverData.color,
    textColor: serverData.textColor,
    category: serverData.label?.name || serverData.category,
    subNotes: serverData.children || [],
    files: serverData.files || serverData.attachments || [],
    linkPreviews: serverData.linkPreviews || [],
  };

  const images = (note.files || []).filter((f) => f.type?.startsWith("image/"));
  const nonImageFiles = (note.files || []).filter(
    (f) => !f.type?.startsWith("image/")
  );

  return (
    <main
      className="min-h-screen w-full flex flex-col bg-background text-foreground overflow-y-auto sidebar-scrollbar"
      style={{
        backgroundColor: note.color || undefined,
      }}
    >
      <header className="sticky top-0 z-40 w-full flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Back to notes"
              >
                <ArrowLeft size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Back to notes</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Exit fullscreen"
              >
                <Minimize2 size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Exit full screen</TooltipContent>
          </Tooltip>
        </div>

        <div className="relative flex items-center gap-3">
          <NoteLabel note={note} />
        </div>
      </header>

      <article className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 flex flex-col gap-6">
        <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
          <h1
            className="text-2xl md:text-4xl font-bold leading-tight"
            style={note.textColor ? { color: note.textColor } : undefined}
          >
            {note.title}
          </h1>
          {serverData.updatedAt && (
            <time
              dateTime={serverData.updatedAt}
              className="text-xs text-muted-foreground"
            >
              Last updated {new Date(serverData.updatedAt).toLocaleDateString()}
            </time>
          )}
        </div>

        {images.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative rounded-2xl overflow-hidden border border-border/60 bg-muted/20 aspect-video group"
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end p-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={img.url}
                        download={img.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                      >
                        <Download size={14} />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>Download image</TooltipContent>
                  </Tooltip>
                </div>
              </div>
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
          <section className="flex flex-col gap-2 pt-4 border-t border-border/40">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Attachments ({nonImageFiles.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {nonImageFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card shadow-xs"
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <FileText size={18} className="text-muted-foreground shrink-0" />
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
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
          <section className="flex flex-col gap-2 pt-4 border-t border-border/40">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Link Previews
            </h2>
            <div className="flex flex-col gap-2">
              {note.linkPreviews.map((preview) => (
                <LinkPreviewCard
                  key={preview.url}
                  preview={preview}
                />
              ))}
            </div>
          </section>
        )}

        {note.subNotes && note.subNotes.length > 0 && (
          <section className="flex flex-col gap-2 pt-4 border-t border-border/40">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Subnotes ({note.subNotes.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {note.subNotes.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/notes/${sub.id}`}
                  className="p-4 rounded-xl border border-border/60 bg-card hover:border-primary/50 transition-colors shadow-xs"
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
      </article>
    </main>
  );
}
