"use client";

import { motion } from "framer-motion";
import type { NoteItem } from "@/features/home/types";
import {
  ChevronRight,
  FileText,
  FileCode,
  Archive,
  Video,
  Music,
  File,
  Download,
} from "lucide-react";
import NoteToolbar from "./note-toolbar";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string, filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (mimeType.includes("pdf") || ext === "pdf") {
    return <FileText className="text-red-500 shrink-0" size={16} />;
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("rar") ||
    mimeType.includes("compressed") ||
    ["zip", "rar", "7z", "tar", "gz"].includes(ext)
  ) {
    return <Archive className="text-amber-500 shrink-0" size={16} />;
  }
  if (
    mimeType.includes("code") ||
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("html") ||
    [
      "js",
      "ts",
      "tsx",
      "jsx",
      "json",
      "html",
      "css",
      "py",
      "rs",
      "go",
      "cpp",
      "c",
    ].includes(ext)
  ) {
    return <FileCode className="text-emerald-500 shrink-0" size={16} />;
  }
  if (
    mimeType.startsWith("video/") ||
    ["mp4", "webm", "mkv", "mov"].includes(ext)
  ) {
    return <Video className="text-purple-500 shrink-0" size={16} />;
  }
  if (
    mimeType.startsWith("audio/") ||
    ["mp3", "wav", "ogg", "m4a", "flac"].includes(ext)
  ) {
    return <Music className="text-pink-500 shrink-0" size={16} />;
  }
  return <File className="text-blue-500 shrink-0" size={16} />;
}

function getCardTextColor(colorStr?: string): {
  title: string;
  body: string;
  subtext: string;
} {
  if (!colorStr) {
    return {
      title: "text-foreground group-hover:text-blue-600",
      body: "text-muted-foreground",
      subtext: "text-muted-foreground",
    };
  }

  let isDark = false;
  if (colorStr.startsWith("#")) {
    let hex = colorStr.slice(1);
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const num = parseInt(hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    isDark = luma < 140;
  } else if (colorStr.startsWith("hsl")) {
    const match = colorStr.match(/hsl[a]?\([^,]+,[^,]+,\s*([0-9.]+)%/);
    if (match) {
      const l = parseFloat(match[1]);
      isDark = l < 50;
    }
  }

  if (isDark) {
    return {
      title: "text-white font-semibold",
      body: "text-white/85",
      subtext: "text-white/70",
    };
  }

  return {
    title: "text-zinc-900 font-semibold group-hover:text-blue-600",
    body: "text-zinc-700",
    subtext: "text-zinc-600",
  };
}

interface NoteProps {
  note: NoteItem;
  isSelected?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onUpdate?: (updates: Partial<NoteItem>) => void;
  className?: string;
  style?: React.CSSProperties;
  disableLayoutAnimation?: boolean;
}

export default function Note({
  note,
  isSelected = false,
  onClick,
  onPointerDown,
  onUpdate,
  className = "",
  style,
  disableLayoutAnimation = false,
}: NoteProps) {
  const textColor = getCardTextColor(note.color);

  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={style}
      className={`relative group ${className} hover:z-40 z-10`}
    >
      <div
        className={`relative w-full h-full transition-all duration-200 hover:-translate-y-0.5 ${
          isSelected
            ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            : "hover:drop-shadow-md"
        }`}
      >
        <motion.div
          layout={!disableLayoutAnimation}
          layoutId={disableLayoutAnimation ? undefined : `note-${note.id}`}
          className={`relative rounded-2xl p-5 pb-14 z-0 transition-colors shadow-xs`}
          style={{
            backgroundColor: note.color || "var(--card)",
          }}
        >
          {note.category && (
            <div className="absolute top-0 right-[20px] px-6 py-4 rounded-none rounded-b-xl text-sm font-semibold z-20 shadow-xs bg-[var(--sidebar-fg)] text-[var(--sidebar-bg)] dark:bg-[var(--sidebar-bg)] dark:text-[var(--sidebar-fg)]">
              {note.category}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            {note.parentId && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Subnote
              </span>
            )}
          </div>

          <h3
            className={`text-base font-semibold transition-colors ${
              note.textColor ? "" : textColor.title
            }`}
            style={note.textColor ? { color: note.textColor } : undefined}
          >
            {note.title}
          </h3>

          <div
            className={`mt-2 text-sm leading-relaxed line-clamp-4 ${
              note.textColor ? "" : textColor.body
            } [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic`}
            style={note.textColor ? { color: note.textColor } : undefined}
            dangerouslySetInnerHTML={{ __html: note.content }}
          />

          {note.files && note.files.length > 0 && (
            <div
              className="mt-3 flex flex-col gap-1.5"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {note.files.some((f) => f.type.startsWith("image/")) && (
                <div className="grid grid-cols-2 gap-1.5 mb-1">
                  {note.files
                    .filter((f) => f.type.startsWith("image/"))
                    .map((file) => (
                      <div
                        key={file.id}
                        className="relative group/file rounded-lg overflow-hidden border border-border/80 bg-muted/30 aspect-video"
                      >
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-between p-1.5 text-white">
                          <span className="text-[10px] truncate max-w-[70%] font-medium">
                            {file.name}
                          </span>
                          <a
                            href={file.url}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-white/20 rounded cursor-pointer"
                            title="Download image"
                          >
                            <Download size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {note.files
                .filter((f) => !f.type.startsWith("image/"))
                .map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-border/70 bg-card/60 backdrop-blur-xs text-xs hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(file.type, file.name)}
                      <div className="flex flex-col min-w-0">
                        <span
                          className="font-medium text-foreground truncate max-w-[130px]"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      download={file.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                      title="Download file"
                    >
                      <Download size={13} />
                    </a>
                  </div>
                ))}
            </div>
          )}

          {note.subNotes && note.subNotes.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
              <ChevronRight size={12} />
              <span>
                {note.subNotes.length} subnote
                {note.subNotes.length > 1 ? "s" : ""}
              </span>
            </div>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute bottom-3 right-3 transition-opacity opacity-0 group-hover:opacity-100 z-40"
          >
            <NoteToolbar
              note={note}
              onUpdate={onUpdate}
              onActionClick={() => onClick?.()}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
