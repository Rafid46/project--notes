"use client";

import { useRef, useState } from "react";
import { Download, RotateCcw, X } from "lucide-react";
import type { NoteFile } from "@/features/home/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResizableNoteImageProps {
  file: NoteFile;
  onRemove?: () => void;
  showDownload?: boolean;
}

export default function ResizableNoteImage({
  file,
  onRemove,
  showDownload = true,
}: ResizableNoteImageProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [widthPx, setWidthPx] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const handleResizePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    mode: "corner" | "right",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const el = containerRef.current;
    if (!el) return;

    const parentWidth = el.parentElement?.clientWidth || el.offsetWidth;
    const startWidth = el.offsetWidth;
    const startHeight = el.offsetHeight || 1;
    const startX = e.clientX;
    const startY = e.clientY;
    const minWidth = Math.min(140, parentWidth);

    setIsResizing(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let delta = dx;
      if (mode === "corner" && Math.abs(dy) > Math.abs(dx)) {
        delta = dy * (startWidth / startHeight);
      }

      const nextWidth = Math.max(
        minWidth,
        Math.min(parentWidth, Math.round(startWidth + delta)),
      );
      setWidthPx(nextWidth >= parentWidth - 2 ? null : nextWidth);
    };

    const onPointerUp = () => {
      setIsResizing(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <figure
      ref={containerRef}
      style={widthPx ? { width: `${widthPx}px` } : undefined}
      className="relative group/file w-full max-w-full rounded-xl overflow-hidden border border-border/70 bg-muted/20 select-none"
    >
      <img
        src={file.url}
        alt={file.name}
        draggable={false}
        className="w-full h-auto block rounded-xl object-contain"
      />

      {(showDownload || onRemove || widthPx !== null) && (
        <div
          className={`absolute top-2 right-2 flex items-center gap-1 transition-opacity ${
            isResizing
              ? "opacity-100"
              : "opacity-0 group-hover/file:opacity-100"
          }`}
        >
          {widthPx !== null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWidthPx(null);
                  }}
                  className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                  aria-label="Reset image size"
                >
                  <RotateCcw size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Reset full width</TooltipContent>
            </Tooltip>
          )}

          {showDownload && (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={file.url}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                  aria-label="Download image"
                >
                  <Download size={14} />
                </a>
              </TooltipTrigger>
              <TooltipContent>Download image</TooltipContent>
            </Tooltip>
          )}

          {onRemove && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Remove image</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize image width"
        onPointerDown={(e) => handleResizePointerDown(e, "right")}
        className="absolute top-3 bottom-6 right-0 w-2 cursor-ew-resize opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center"
      >
        <span className="h-8 w-1 rounded-full bg-white/80 shadow-sm" />
      </div>

      <div
        role="separator"
        aria-label="Resize image"
        onPointerDown={(e) => handleResizePointerDown(e, "corner")}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setWidthPx(null);
        }}
        title="Drag to resize, double-click to reset"
        className={`absolute bottom-1.5 right-1.5 w-5 h-5 rounded-md bg-black/60 text-white flex items-center justify-center cursor-nwse-resize transition-opacity ${
          isResizing
            ? "opacity-100"
            : "opacity-0 group-hover/file:opacity-100"
        }`}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 1L1 9M9 5L5 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </figure>
  );
}

