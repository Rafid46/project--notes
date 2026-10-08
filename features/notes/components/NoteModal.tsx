"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Download, X, Loader2 } from "lucide-react";
import type { NoteItem } from "@/features/home/types";
import LinkPreviewCard from "@/features/notes/components/LinkPreviewCard";
import NoteToolbar from "@/features/notes/components/NoteToolbar";
import {
  extractUrls,
  getLinkPreview,
} from "@/features/notes/utils/link-preview";

export interface NoteModalProps {
  note?: NoteItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNote: (noteId: string, updates: Partial<NoteItem>) => void;
}

export default function NoteModal({
  note,
  isOpen,
  onClose,
  onUpdateNote,
}: NoteModalProps) {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const fetchingUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (contentRef.current && isOpen && note) {
      if (
        contentRef.current.innerHTML !== (note.content || "") &&
        document.activeElement !== contentRef.current
      ) {
        contentRef.current.innerHTML = note.content || "";
      }
    }
  }, [note?.content, note?.id, isOpen]);

  useEffect(() => {
    if (!note || !isOpen) return;
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
            onUpdateNote(note.id, { linkPreviews: updatedPreviews });
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
    isOpen,
    onUpdateNote,
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
            onUpdateNote(note.id, { linkPreviews: updatedPreviews });
          }
        } finally {
          fetchingUrlsRef.current.delete(url);
        }
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && note && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
            <motion.div
              layoutId={`note-${note.id}`}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{
                backgroundColor: note.color || "#171717",
              }}
              className="relative w-full max-w-lg h-[580px] max-h-[90vh] flex flex-col bg-card p-6 shadow-2xl rounded-[26px] pointer-events-auto"
            >
              <div className="flex flex-col space-y-1.5 text-center sm:text-left shrink-0">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={note.title}
                    onChange={(e) =>
                      onUpdateNote(note.id, {
                        title: e.target.value,
                      })
                    }
                    onPaste={handleModalPaste}
                    placeholder="Note title..."
                    style={
                      note.textColor ? { color: note.textColor } : undefined
                    }
                    className="w-full bg-transparent border-none outline-none text-lg font-semibold leading-none mr-2"
                  />
                  {note.category && (
                    <div className="absolute top-0 right-[20px] px-6 py-4 rounded-none rounded-b-xl text-sm font-semibold z-20 shadow-xs bg-[var(--sidebar-fg)] text-[var(--sidebar-bg)] dark:bg-[var(--sidebar-bg)] dark:text-[var(--sidebar-fg)]">
                      {note.category}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 pr-1 mt-4 custom-scrollbar">
                <div
                  ref={contentRef}
                  contentEditable
                  suppressContentEditableWarning
                  onPaste={handleModalPaste}
                  onInput={(e) =>
                    onUpdateNote(note.id, {
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
                        onRemove={() => {
                          const updated = (note.linkPreviews || []).filter(
                            (p) => p.url !== preview.url,
                          );
                          onUpdateNote(note.id, {
                            linkPreviews: updated,
                          });
                        }}
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
                                      onUpdateNote(note.id, {
                                        files: updated,
                                      });
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
                            <Paperclip
                              size={14}
                              className="text-muted-foreground"
                            />
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
                                onUpdateNote(note.id, {
                                  files: updated,
                                });
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
                        <li
                          key={sub.id}
                          className="text-sm bg-muted p-2 rounded-md"
                        >
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
                  onUpdate={(updates) => onUpdateNote(note.id, updates)}
                  contentRef={contentRef}
                  isModal
                />

                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 py-2 border border-transparent cursor-pointer shrink-0"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

