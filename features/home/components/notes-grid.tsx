"use client";

import type { NoteItem, ViewMode } from "../types";
import Note from "@/features/notes/components/Note";

interface NotesGridProps {
  notes: NoteItem[];
  viewMode: ViewMode;
  onSelectNote: (noteId: string) => void;
}

export default function NotesGrid({
  notes,
  viewMode,
  onSelectNote,
}: NotesGridProps) {
  const allNotes: NoteItem[] = [];
  notes.forEach((parent) => {
    allNotes.push(parent);
    if (parent.subNotes) {
      allNotes.push(...parent.subNotes);
    }
  });

  const getContainerClassName = () => {
    switch (viewMode) {
      case "grid-2":
        return "grid grid-cols-1 md:grid-cols-2 gap-4";
      case "grid-4":
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4";
      case "masonry":
      default:
        return "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4";
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto pl-80 pt-24 pr-8 pb-8">
      <div className={getContainerClassName()}>
        {allNotes.map((note) => (
          <Note
            key={note.id}
            note={note}
            onClick={() => onSelectNote(note.id)}
            className="cursor-pointer break-inside-avoid"
          />
        ))}
      </div>
    </div>
  );
}
