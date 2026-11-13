"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BoardFileItem } from "../types";
import { formatFileSize, getFileIcon } from "@/features/notes/utils/utils";

interface BoardFilePreviewModalProps {
  items: BoardFileItem[];
  activeItemId: string | null;
  onClose: () => void;
  onSelectItem: (id: string) => void;
}

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "json",
  "csv",
  "xml",
  "html",
  "css",
  "js",
  "ts",
  "tsx",
  "jsx",
  "svg",
  "yaml",
  "yml",
]);

export default function BoardFilePreviewModal({
  items,
  activeItemId,
  onClose,
  onSelectItem,
}: BoardFilePreviewModalProps) {
  const activeIndex = activeItemId
    ? items.findIndex((item) => item.id === activeItemId)
    : -1;
  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;

  const [dimensions, setDimensions] = useState<{
    id: string;
    width: number;
    height: number;
  } | null>(null);
  const [textPreview, setTextPreview] = useState<{
    id: string;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!activeItem) return;

    const isTextLike =
      activeItem.mimeType.startsWith("text/") ||
      TEXT_EXTENSIONS.has(activeItem.extension);

    if (activeItem.category === "file" && isTextLike) {
      let cancelled = false;
      activeItem.file
        .slice(0, 60000)
        .text()
        .then((text) => {
          if (!cancelled) setTextPreview({ id: activeItem.id, text });
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [activeItem]);

  const activeDimensions =
    activeItem && dimensions?.id === activeItem.id ? dimensions : null;
  const activeTextPreview =
    activeItem && textPreview?.id === activeItem.id ? textPreview.text : null;

  useEffect(() => {
    if (!activeItem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && activeIndex > 0) {
        e.preventDefault();
        onSelectItem(items[activeIndex - 1].id);
      } else if (e.key === "ArrowRight" && activeIndex < items.length - 1) {
        e.preventDefault();
        onSelectItem(items[activeIndex + 1].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeItem, activeIndex, items, onSelectItem]);

  return (
    <Dialog open={Boolean(activeItem)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col gap-3 p-5 overflow-hidden">
        {activeItem && (
          <>
            <DialogHeader className="pr-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {getFileIcon(activeItem.mimeType, activeItem.name)}
                  <DialogTitle className="truncate text-sm font-semibold">
                    {activeItem.name}
                  </DialogTitle>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(activeItem.size)}
                    {activeDimensions
                      ? ` · ${activeDimensions.width}×${activeDimensions.height}`
                      : ""}
                  </span>
                  <a
                    href={activeItem.url}
                    download={activeItem.name}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <Download size={13} />
                    <span>Save</span>
                  </a>
                </div>
              </div>
            </DialogHeader>

            <div className="relative flex min-h-[320px] max-h-[72vh] flex-1 items-center justify-center overflow-hidden rounded-xl bg-muted/40 border border-border/60">
              {activeItem.category === "image" && (
                <img
                  src={activeItem.url}
                  alt={activeItem.name}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setDimensions({
                      id: activeItem.id,
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                    });
                  }}
                  className="max-h-[70vh] max-w-full object-contain select-none"
                />
              )}

              {activeItem.category === "video" && (
                <video
                  src={activeItem.url}
                  controls
                  autoPlay
                  loop
                  className="max-h-[70vh] max-w-full rounded-lg bg-black"
                />
              )}

              {activeItem.category === "audio" && (
                <div className="flex w-full max-w-md flex-col items-center gap-4 p-8">
                  <p className="text-sm font-medium text-center truncate w-full">
                    {activeItem.name}
                  </p>
                  <audio src={activeItem.url} controls autoPlay className="w-full" />
                </div>
              )}

              {activeItem.category === "file" &&
                (activeItem.extension === "pdf" ||
                activeItem.mimeType === "application/pdf" ? (
                  <iframe
                    src={activeItem.url}
                    title={activeItem.name}
                    className="h-[68vh] w-full border-0"
                  />
                ) : activeTextPreview !== null ? (
                  <pre className="h-[68vh] w-full overflow-auto p-4 text-xs font-mono text-foreground whitespace-pre-wrap">
                    {activeTextPreview}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center gap-3 p-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background border border-border shadow-xs">
                      {getFileIcon(activeItem.mimeType, activeItem.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{activeItem.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeItem.relativePath} · {formatFileSize(activeItem.size)}
                      </p>
                    </div>
                  </div>
                ))}

              {activeIndex > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectItem(items[activeIndex - 1].id)}
                  aria-label="Previous file"
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform hover:scale-105 cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
              )}

              {activeIndex < items.length - 1 && (
                <button
                  type="button"
                  onClick={() => onSelectItem(items[activeIndex + 1].id)}
                  aria-label="Next file"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform hover:scale-105 cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">{activeItem.relativePath}</span>
              <span className="shrink-0">
                {activeIndex + 1} / {items.length}
              </span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
