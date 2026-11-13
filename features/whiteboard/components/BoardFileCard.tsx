"use client";

import { Maximize2, Download, GripHorizontal, Film, Music } from "lucide-react";
import type { BoardFileItem } from "../types";
import { formatFileSize, getFileIcon } from "@/features/notes/utils/utils";

interface BoardFileCardProps {
  item: BoardFileItem;
  isSelected?: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onResizePointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPreview: () => void;
}

export default function BoardFileCard({
  item,
  isSelected = false,
  onPointerDown,
  onResizePointerDown,
  onPreview,
}: BoardFileCardProps) {
  const extLabel = (item.extension || item.category).toUpperCase();

  return (
    <div
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onPreview();
      }}
      className={`group relative w-full pointer-events-auto rounded-2xl border bg-card/95 text-card-foreground shadow-md backdrop-blur-sm transition-shadow hover:shadow-xl cursor-grab active:cursor-grabbing select-none overflow-hidden ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/30"
          : "border-black/10 dark:border-white/10"
      }`}
    >
      {item.category === "image" && (
        <div className="relative bg-muted/40">
          <img
            src={item.url}
            alt={item.name}
            draggable={false}
            loading="lazy"
            decoding="async"
            className="block w-full h-auto max-h-[520px] object-cover select-none"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <span className="rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {extLabel}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              aria-label={`Preview ${item.name}`}
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm transition-transform hover:scale-105 cursor-pointer"
            >
              <Maximize2 size={13} />
            </button>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pb-2.5 pt-6 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <p className="truncate text-xs font-medium text-white">{item.name}</p>
            <p className="text-[10px] text-white/75">{formatFileSize(item.size)}</p>
          </div>
        </div>
      )}

      {item.category === "video" && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2 bg-muted/30">
            <div className="flex items-center gap-1.5 min-w-0">
              <GripHorizontal size={14} className="shrink-0 text-muted-foreground" />
              <Film size={13} className="shrink-0 text-purple-500" />
              <span className="truncate text-xs font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-muted-foreground">
                {formatFileSize(item.size)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                aria-label={`Preview ${item.name}`}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <Maximize2 size={12} />
              </button>
            </div>
          </div>
          <video
            src={item.url}
            controls
            preload="metadata"
            loop
            className="w-full max-h-[340px] bg-black"
          />
        </div>
      )}

      {item.category === "audio" && (
        <div className="flex flex-col gap-2.5 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
                <Music size={16} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {extLabel} · {formatFileSize(item.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              aria-label={`Preview ${item.name}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <Maximize2 size={13} />
            </button>
          </div>
          <audio src={item.url} controls preload="metadata" className="w-full h-8" />
        </div>
      )}

      {item.category === "file" && (
        <div className="flex flex-col gap-2 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                {getFileIcon(item.mimeType, item.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {item.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {extLabel} · {formatFileSize(item.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                aria-label={`Preview ${item.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <Maximize2 size={13} />
              </button>
              <a
                href={item.url}
                download={item.name}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Download ${item.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Download size={13} />
              </a>
            </div>
          </div>
          {item.relativePath !== item.name && (
            <p className="truncate rounded-md bg-muted/60 px-2 py-1 text-[10px] text-muted-foreground">
              {item.relativePath}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        data-resize-handle="true"
        onPointerDown={onResizePointerDown}
        aria-label={`Resize ${item.name}`}
        className="absolute bottom-1 right-1 z-20 flex h-5 w-5 items-end justify-end rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 cursor-nwse-resize"
      >
        <span className="h-2.5 w-2.5 rounded-br-sm border-b-2 border-r-2 border-foreground/50 dark:border-white/70" />
      </button>
    </div>
  );
}
