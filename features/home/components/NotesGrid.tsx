"use client";

import { useEffect, useState, useRef } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { StickyNote } from "lucide-react";
import type { NoteItem, ViewMode, Label } from "../types";
import NoteCard from "@/features/notes/components/NoteCard";

interface NotesGridProps {
  notes: NoteItem[];
  viewMode: ViewMode;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  onSelectNote: (noteId: string) => void;
  onUpdateNote?: (noteId: string, updates: Partial<NoteItem>) => void;
  onDeleteNote?: (noteId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  selectedLabel?: Label | null;
}

export default function NotesGrid({
  notes,
  viewMode,
  isLoading = false,
  isFetchingNextPage = false,
  onSelectNote,
  onUpdateNote,
  onDeleteNote,
  onLoadMore,
  hasMore = false,
  selectedLabel,
}: NotesGridProps) {
  const [cols, setCols] = useState(4);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth >= 1280) setCols(4);
      else if (window.innerWidth >= 1024) setCols(3);
      else if (window.innerWidth >= 640) setCols(2);
      else setCols(1);
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !onLoadMore || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  const allNotes: NoteItem[] = [];
  notes.forEach((parent) => {
    allNotes.push(parent);
    if (parent.subNotes) {
      allNotes.push(...parent.subNotes);
    }
  });

  const renderMasonry = () => {
    const columns: NoteItem[][] = Array.from({ length: cols }, () => []);
    allNotes.forEach((note, i) => {
      columns[i % cols].push(note);
    });

    return (
      <div className="flex w-full gap-4 items-start">
        {columns.map((col, i) => (
          <div key={i} className="flex-1 flex flex-col gap-4 min-w-0">
            {col.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onSelectNote(note.id)}
                onUpdate={(updates) => onUpdateNote?.(note.id, updates)}
                onDelete={onDeleteNote}
                className="cursor-pointer w-full"
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const getGridClassName = () => {
    switch (viewMode) {
      case "grid-2":
        return "grid grid-cols-1 sm:grid-cols-2 gap-4";
      case "grid-3":
        return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4";
      case "grid-4":
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4";
      case "grid-5":
        return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4";
      case "grid-6":
        return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4";
      default:
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4";
    }
  };

  return (
    <div
      className="h-full w-full overflow-y-auto px-6 md:pl-76 pt-24 pb-10 sidebar-scrollbar"
      style={{
        backgroundImage:
          "radial-gradient(var(--dot-color) 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="mx-auto w-full max-w-[1600px]">
        {isLoading ? (
          <div className="flex h-full min-h-[55vh] w-full items-center justify-center">
            <ThinkingOrb state="searching" size={64} />
          </div>
        ) : allNotes.length === 0 ? (
          <div className="flex min-h-[55vh] w-full items-center justify-center">
            <div className="flex max-w-sm flex-col items-center rounded-3xl border border-border/80 bg-background/85 px-8 py-10 text-center shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <StickyNote size={22} />
              </div>
              <h2 className="mt-4 text-base font-semibold text-foreground">
                {selectedLabel
                  ? `No notes in "${selectedLabel.name}"`
                  : "No notes yet"}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Use the Note button in the top bar or drop files onto the
                canvas to create your first note.
              </p>
            </div>
          </div>
        ) : viewMode === "masonry" ? (
          renderMasonry()
        ) : (
          <div className={getGridClassName()}>
            {allNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onSelectNote(note.id)}
                onUpdate={(updates) => onUpdateNote?.(note.id, updates)}
                onDelete={onDeleteNote}
                className="cursor-pointer w-full"
              />
            ))}
          </div>
        )}
        {isFetchingNextPage && (
          <div className="flex w-full items-center justify-center py-6">
            <ThinkingOrb state="searching" size={64} />
          </div>
        )}
        <div ref={sentinelRef} className="h-8 w-full" />
      </div>
    </div>
  );
}
