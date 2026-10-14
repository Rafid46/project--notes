"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { NoteItem } from "@/features/home/types";
import {
  ChevronRight,
  Download,
  Fullscreen,
  Paperclip,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import NoteToolbar from "./NoteToolbar";
import LinkPreviewCard from "./LinkPreviewCard";
import NoteLabel from "./NoteLabel";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  extractUrls,
  getLinkPreview,
} from "@/features/notes/utils/link-preview";
import {
  formatFileSize,
  getFileIcon,
  getCardTextColor,
} from "@/features/notes/utils/utils";

export interface NoteCardProps {
  note: NoteItem;
  isSelected?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onUpdate?: (updates: Partial<NoteItem>) => void;
  className?: string;
  style?: React.CSSProperties;
  disableLayoutAnimation?: boolean;
  isModal?: boolean;
  onClose?: () => void;
}

export default function NoteCard({
  note,
  isSelected = false,
  onClick,
  onPointerDown,
  onUpdate,
  className = "",
  style,
  disableLayoutAnimation = false,
  isModal = false,
  onClose,
}: NoteCardProps) {
  const textColor = getCardTextColor(note.color);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const fetchingUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (contentRef.current && isModal && note) {
      if (
        contentRef.current.innerHTML !== (note.content || "") &&
        document.activeElement !== contentRef.current
      ) {
        contentRef.current.innerHTML = note.content || "";
      }
    }
  }, [note?.content, note?.id, isModal]);

  useEffect(() => {
    if (!note || !isModal) return;
    const urls = [
      ...extractUrls(note.content || ""),
      ...extractUrls(note.title || ""),
    ];
    if (urls.length === 0) return;

    for (const url of urls) {
      const existing = note.linkPreviews?.find((p) => p.url === url);
      if ((existing && existing.image) || fetchingUrlsRef.current.has(url)) {
        continue;
      }
      fetchingUrlsRef.current.add(url);
      setIsLoadingPreview(true);
      getLinkPreview(url)
        .then((preview) => {
          if (preview) {
            const currentPreviews = note.linkPreviews || [];
            const updatedPreviews = currentPreviews.some(
              (p) => p.url === preview.url,
            )
              ? currentPreviews.map((p) =>
                  p.url === preview.url ? preview : p,
                )
              : [...currentPreviews, preview];
            onUpdate?.({ linkPreviews: updatedPreviews });
          }
        })
        .finally(() => {
          fetchingUrlsRef.current.delete(url);
          setIsLoadingPreview(false);
        });
    }
  }, [
    note?.content,
    note?.title,
    note?.id,
    isModal,
    onUpdate,
    note?.linkPreviews,
  ]);

  const handleModalPaste = async (
    e: React.ClipboardEvent<HTMLInputElement | HTMLDivElement>,
  ) => {
    const text = e.clipboardData.getData("text");
    if (!text || !note) return;
    const urls = extractUrls(text);
    if (urls.length === 0) return;

    setIsLoadingPreview(true);
    try {
      for (const url of urls) {
        const existing = note.linkPreviews?.find((p) => p.url === url);
        if ((existing && existing.image) || fetchingUrlsRef.current.has(url)) {
          continue;
        }
        fetchingUrlsRef.current.add(url);
        try {
          const preview = await getLinkPreview(url);
          if (preview) {
            const currentPreviews = note.linkPreviews || [];
            const updatedPreviews = currentPreviews.some(
              (p) => p.url === preview.url,
            )
              ? currentPreviews.map((p) =>
                  p.url === preview.url ? preview : p,
                )
              : [...currentPreviews, preview];
            onUpdate?.({ linkPreviews: updatedPreviews });
          }
        } finally {
          fetchingUrlsRef.current.delete(url);
        }
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  if (isModal) {
    return (
      <motion.div
        layoutId={`note-${note.id}`}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={note.color ? { backgroundColor: note.color } : style}
        className={`relative w-full max-w-lg h-[580px] max-h-[90vh] flex flex-col p-6 shadow-2xl rounded-[26px] pointer-events-auto ${
          note.color ? "" : "bg-gray-200 dark:bg-[#171717]"
        } ${className}`}
      >
        <div className="flex flex-col space-y-1.5 text-center sm:text-left shrink-0">
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={note.title}
              onChange={(e) =>
                onUpdate?.({
                  title: e.target.value,
                })
              }
              onPaste={handleModalPaste}
              placeholder="Note title..."
              style={note.textColor ? { color: note.textColor } : undefined}
              className="w-full bg-transparent border-none outline-none text-lg font-semibold leading-none mr-2"
            />
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/notes/${note.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-lg transition-colors p-1.5 hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  >
                    <Fullscreen size={16} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Open full page</TooltipContent>
              </Tooltip>
              <NoteLabel note={note} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1 mt-4 custom-scrollbar">
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onPaste={handleModalPaste}
            onInput={(e) =>
              onUpdate?.({
                content: e.currentTarget.innerHTML,
              })
            }
            data-placeholder="Take a note..."
            style={note.textColor ? { color: note.textColor } : undefined}
            className="text-sm whitespace-pre-wrap min-h-[6rem] outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_img]:rounded-lg"
          />

          {isLoadingPreview && (
            <div className="mt-3 p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center gap-2.5 animate-pulse">
              <Loader2
                size={16}
                className="animate-spin text-muted-foreground shrink-0"
              />
              <span className="text-xs text-muted-foreground">
                Loading link preview...
              </span>
            </div>
          )}

          {note.linkPreviews && note.linkPreviews.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {note.linkPreviews.map((preview) => (
                <LinkPreviewCard
                  key={preview.url}
                  preview={preview}
                  isLink={false}
                  onRemove={
                    onUpdate
                      ? () => {
                          const updated = (note.linkPreviews || []).filter(
                            (p) => p.url !== preview.url,
                          );
                          onUpdate({ linkPreviews: updated });
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {note.files && note.files.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium mb-2">
                Attached Files ({note.files.length})
              </h4>
              {note.files.some((f) => f.type.startsWith("image/")) && (
                <div className="grid grid-cols-3 gap-2 mb-3">
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
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-between p-1.5 text-white">
                          <span className="text-[10px] truncate max-w-[70%] font-medium">
                            {file.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <a
                              href={file.url}
                              download={file.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-white/20 rounded cursor-pointer text-white"
                              title="Download"
                            >
                              <Download size={12} />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (note.files || []).filter(
                                  (f) => f.id !== file.id,
                                );
                                onUpdate?.({ files: updated });
                              }}
                              className="p-1 hover:bg-white/20 rounded cursor-pointer text-white"
                              title="Remove"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {note.files
                  .filter((f) => !f.type.startsWith("image/"))
                  .map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs transition-colors"
                    >
                      <Paperclip size={14} className="text-muted-foreground" />
                      <span className="font-medium">{file.name}</span>
                      <a
                        href={file.url}
                        download={file.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-0.5 text-muted-foreground hover:text-foreground"
                        title="Download"
                      >
                        <Download size={12} />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (note.files || []).filter(
                            (f) => f.id !== file.id,
                          );
                          onUpdate?.({ files: updated });
                        }}
                        className="p-0.5 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Remove"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {note.subNotes && note.subNotes.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium mb-2">
                Subnotes ({note.subNotes.length})
              </h4>
              <ul className="space-y-2">
                {note.subNotes.map((sub) => (
                  <li key={sub.id} className="text-sm bg-muted p-2 rounded-md">
                    <span className="font-medium">{sub.title}</span>
                    <div
                      className="text-xs text-muted-foreground mt-1 line-clamp-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                      dangerouslySetInnerHTML={{ __html: sub.content }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border shrink-0">
          <NoteToolbar
            note={note}
            onUpdate={onUpdate}
            contentRef={contentRef}
            isModal
          />

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 py-2 border border-transparent cursor-pointer shrink-0"
            >
              Close
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={style}
      className={`relative group ${className} hover:z-40 z-10`}
    >
      <div
        className={`relative w-full h-full transition-[filter] duration-200 ${
          disableLayoutAnimation ? "" : "hover:-translate-y-0.5"
        } ${
          isSelected
            ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            : "hover:drop-shadow-md"
        }`}
      >
        <motion.div
          layout={!disableLayoutAnimation}
          layoutId={disableLayoutAnimation ? undefined : `note-${note.id}`}
          className={`relative rounded-2xl p-5 min-h-40 z-0 transition-colors shadow-xs ${
            note.color ? "" : "bg-gray-200 dark:bg-[#171717]"
          }`}
          style={note.color ? { backgroundColor: note.color } : undefined}
        >
          <NoteLabel note={note} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/notes/${note.id}`}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-3 left-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/10 p-2 hover:bg-black/30 dark:hover:bg-white/10 z-30"
              >
                <Fullscreen size={18} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Open full page</TooltipContent>
          </Tooltip>

          <div className="mt-6">
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
              } [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_img]:rounded-lg [&_a]:pointer-events-none`}
              style={note.textColor ? { color: note.textColor } : undefined}
              dangerouslySetInnerHTML={{ __html: note.content }}
            />

            {note.linkPreviews && note.linkPreviews.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {note.linkPreviews.map((preview) => (
                  <LinkPreviewCard
                    key={preview.url}
                    preview={preview}
                    isLink={false}
                    onRemove={
                      onUpdate
                        ? () => {
                            const updated = (note.linkPreviews || []).filter(
                              (p) => p.url !== preview.url,
                            );
                            onUpdate({ linkPreviews: updated });
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            )}

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
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-between p-1 text-white">
                            <span className="text-[9px] truncate max-w-[65%] font-medium">
                              {file.name}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <a
                                href={file.url}
                                download={file.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-0.5 hover:bg-white/20 rounded cursor-pointer text-white"
                                title="Download"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download size={10} />
                              </a>
                            </div>
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
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-muted/40 text-xs"
                    >
                      {getFileIcon(file.type, file.name)}
                      <span className="truncate flex-1 font-medium text-[11px]">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatFileSize(file.size)}
                      </span>
                      <a
                        href={file.url}
                        download={file.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-0.5 text-muted-foreground hover:text-foreground"
                        title="Download"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download size={10} />
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
              className="absolute bottom-3 left-3 transition-opacity opacity-0 group-hover:opacity-100 z-40"
            >
              <NoteToolbar
                note={note}
                onUpdate={onUpdate}
                onActionClick={() => onClick?.()}
                isModal={false}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export { NoteCard as Note };
