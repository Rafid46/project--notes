"use client";

import { useState } from "react";
import type { NoteItem } from "../types";

interface SidebarProps {
  notes: NoteItem[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  notes,
  selectedNoteId,
  onSelectNote,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [expandedNoteIds, setExpandedNoteIds] = useState<Record<string, boolean>>({
    "note-1": true,
    "note-2": true,
  });

  const toggleExpand = (noteId: string) => {
    setExpandedNoteIds((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }));
  };

  return (
    <aside
      className={`relative flex flex-col border-r border-zinc-200 bg-zinc-50 transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <span className="text-xs font-bold text-white dark:text-zinc-900">N</span>
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Project Notes
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Toggle Sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {isOpen && (
          <div className="mb-2 px-2 text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
            Notes & Subnotes
          </div>
        )}

        <nav className="flex flex-col gap-1">
          {notes.map((note) => {
            const isExpanded = !!expandedNoteIds[note.id];
            const hasSubNotes = !!note.subNotes && note.subNotes.length > 0;
            const isSelected = selectedNoteId === note.id;

            return (
              <div key={note.id} className="flex flex-col">
                <div
                  className={`group flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${
                    isSelected
                      ? "bg-zinc-200/70 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-700 hover:bg-zinc-200/40 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectNote(note.id)}
                    className="flex flex-1 items-center gap-2 overflow-hidden text-left text-sm"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: note.color || "#a1a1aa" }}
                    />
                    {isOpen && (
                      <span className="truncate">{note.title}</span>
                    )}
                  </button>

                  {isOpen && hasSubNotes && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(note.id)}
                      className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      aria-label="Toggle Subnotes"
                    >
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
                        className={`transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  )}
                </div>

                {isOpen && hasSubNotes && isExpanded && (
                  <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                    {note.subNotes?.map((sub) => {
                      const isSubSelected = selectedNoteId === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => onSelectNote(sub.id)}
                          className={`flex items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors ${
                            isSubSelected
                              ? "bg-zinc-200/70 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                              : "text-zinc-600 hover:bg-zinc-200/40 dark:text-zinc-400 dark:hover:bg-zinc-900"
                          }`}
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: sub.color || "#a1a1aa" }}
                          />
                          <span className="truncate">{sub.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
