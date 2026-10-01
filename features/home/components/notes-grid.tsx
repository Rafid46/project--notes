"use client";

import type { NoteItem, ViewMode } from "../types";

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
    <div className="flex-1 overflow-y-auto p-6">
      <div className={getContainerClassName()}>
        {allNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className="group cursor-pointer break-inside-avoid rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: note.color || "#3b82f6" }}
              />
              {note.parentId && (
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  Subnote
                </span>
              )}
            </div>

            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {note.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-4">
              {note.content}
            </p>

            {note.subNotes && note.subNotes.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 text-xs text-zinc-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
                <span>{note.subNotes.length} subnote{note.subNotes.length > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
