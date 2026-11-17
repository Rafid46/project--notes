"use client";

import { ArrowRight, FileImage, Layers, Sparkles, StickyNote } from "lucide-react";
import type { Label } from "../types";

interface EmptyNotesStateProps {
  selectedLabel?: Label | null;
  onGetStarted?: (e: React.MouseEvent) => void;
}

export default function EmptyNotesState({
  selectedLabel,
  onGetStarted,
}: EmptyNotesStateProps) {
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto relative flex w-full max-w-md flex-col items-center overflow-hidden rounded-3xl border border-border/80 bg-background/90 px-7 py-8 text-center shadow-[0_24px_64px_-16px_rgba(0,0,0,0.18)] backdrop-blur-md dark:shadow-[0_28px_72px_-16px_rgba(0,0,0,0.6)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 h-36 w-56 rounded-full bg-[#BBDC12]/20 blur-3xl"
      />

      <span className="relative inline-flex items-center gap-1.5 rounded-full border border-[#BBDC12]/40 bg-[#BBDC12]/15 px-3 py-1 text-[11px] font-semibold uppercase text-[#4d6100] dark:text-[#BBDC12]">
        <Sparkles size={12} />
        <span>{selectedLabel ? selectedLabel.name : "Spatial Workspace"}</span>
      </span>

      <div
        aria-hidden="true"
        className="relative mt-5 mb-5 flex h-24 w-full items-center justify-center"
      >
        <div className="absolute -translate-x-16 translate-y-1.5 -rotate-6 rounded-2xl border border-border/80 bg-card p-3 shadow-md transition-transform duration-300">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileImage size={13} />
            <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="mt-2 h-6 w-16 rounded-lg bg-secondary" />
        </div>

        <div className="relative z-10 flex h-20 w-28 flex-col justify-between rounded-2xl border border-[#BBDC12]/50 bg-[#BBDC12] p-3 text-left text-[#004030] shadow-lg">
          <StickyNote size={16} />
          <div className="space-y-1">
            <div className="h-1.5 w-14 rounded-full bg-[#004030]/40" />
            <div className="h-1.5 w-9 rounded-full bg-[#004030]/25" />
          </div>
        </div>

        <div className="absolute translate-x-16 translate-y-1.5 rotate-6 rounded-2xl border border-border/80 bg-card p-3 shadow-md transition-transform duration-300">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Layers size={13} />
            <span className="h-1.5 w-8 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-14 rounded-full bg-muted" />
            <div className="h-1.5 w-10 rounded-full bg-muted" />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold leading-snug text-foreground">
        {selectedLabel ? (
          <>No notes in &ldquo;{selectedLabel.name}&rdquo; yet</>
        ) : (
          <>
            Capture ideas.{" "}
            <span className="inline-block rounded-lg bg-[#BBDC12] px-2 py-0.5 text-[#004030]">
              Shape your space.
            </span>
          </>
        )}
      </h2>

      <p className="mt-2.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
        {selectedLabel
          ? "Start a note under this label or drag files directly onto the canvas."
          : "Drop files anywhere, start typing to jot a thought, or launch your first note on the board."}
      </p>

      {onGetStarted && (
        <button
          type="button"
          onClick={onGetStarted}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#BBDC12] px-6 text-sm font-semibold text-[#004030] shadow-[0_10px_28px_-10px_rgba(187,220,18,0.8)] transition-all hover:bg-[#BBDC12]/90 hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight size={16} />
        </button>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-border/60 pt-4 text-[11px] font-medium text-muted-foreground">
        <span>Type anywhere</span>
        <span aria-hidden="true">·</span>
        <span>Drop files</span>
        <span aria-hidden="true">·</span>
        <span>Drag to arrange</span>
      </div>
    </div>
  );
}
