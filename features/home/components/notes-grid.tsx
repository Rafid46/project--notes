"use client";

import { useEffect, useState } from "react";
import type { NoteItem, ViewMode } from "../types";
import Note from "@/features/notes/components/Note";

interface NotesGridProps {
  notes: NoteItem[];
  viewMode: ViewMode;
  onSelectNote: (noteId: string) => void;
  onUpdateNote?: (noteId: string, updates: Partial<NoteItem>) => void;
}

export default function NotesGrid({
  notes,
  viewMode,
  onSelectNote,
  onUpdateNote,
}: NotesGridProps) {
  const [cols, setCols] = useState(4);

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
    <div className="h-full w-full overflow-y-auto pl-80 pt-24 pr-8 pb-8">
      {viewMode === "masonry" ? (
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
    </div>
  );
}
