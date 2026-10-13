"use client";

import { useEffect, useState, useRef } from "react";
import type { NoteItem, ViewMode, Label } from "../types";
import Note from "@/features/notes/components/Note";
import { Tag } from "lucide-react";

interface NotesGridProps {
  notes: NoteItem[];
  viewMode: ViewMode;
  onSelectNote: (noteId: string) => void;
  onUpdateNote?: (noteId: string, updates: Partial<NoteItem>) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  selectedLabel?: Label | null;
}

export default function NotesGrid({
  notes,
  viewMode,
  onSelectNote,
  onUpdateNote,
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
      { threshold: 0.1 }
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
              <Note
                key={note.id}
                note={note}
                onClick={() => onSelectNote(note.id)}
                onUpdate={(updates) => onUpdateNote?.(note.id, updates)}
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
      className="h-full w-full overflow-y-auto pl-80 pt-24 pr-8 pb-8 sidebar-scrollbar"
      style={{
        backgroundImage:
          "radial-gradient(var(--dot-color) 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
      }}
    >
      {selectedLabel && (
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-border bg-card text-card-foreground shadow-sm">
            {selectedLabel.color ? (
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedLabel.color }}
              />
            ) : (
              <Tag size={15} className="text-muted-foreground shrink-0" />
            )}
            <span className="text-base font-semibold">{selectedLabel.name}</span>
          </div>
        </div>
      )}
      {selectedLabel ? (
        <div className="flex flex-col items-center gap-4 max-w-xl mx-auto w-full">
          {allNotes.map((note) => (
            <Note
              key={note.id}
              note={note}
              onClick={() => onSelectNote(note.id)}
              onUpdate={(updates) => onUpdateNote?.(note.id, updates)}
              className="cursor-pointer w-full"
            />
          ))}
        </div>
      ) : viewMode === "masonry" ? (
        renderMasonry()
      ) : (
        <div className={getGridClassName()}>
          {allNotes.map((note) => (
            <Note
              key={note.id}
              note={note}
              onClick={() => onSelectNote(note.id)}
              onUpdate={(updates) => onUpdateNote?.(note.id, updates)}
              className="cursor-pointer w-full"
            />
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="h-8 w-full" />
    </div>
  );
}
