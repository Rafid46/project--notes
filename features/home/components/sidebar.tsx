"use client";

import { useState } from "react";
import { ChevronRight, Plus, Circle } from "lucide-react";
import type { NoteItem } from "../types";

interface SidebarProps {
  notes: NoteItem[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onOpenAddSubnote?: (parentId: string, e: React.MouseEvent) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({
  notes,
  selectedNoteId,
  onSelectNote,
  onOpenAddSubnote,
}: SidebarProps) {
  const [expandedNoteIds, setExpandedNoteIds] = useState<
    Record<string, boolean>
  >({
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
    <aside className="absolute top-20 bottom-6 left-6 z-30 flex w-64 flex-col bg-secondary rounded-2xl overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <nav className="flex flex-col gap-1">
          {notes.map((note) => {
            const isExpanded = !!expandedNoteIds[note.id];
            const hasSubNotes = !!note.subNotes && note.subNotes.length > 0;
            const isSelected = selectedNoteId === note.id;

            return (
              <div key={note.id} className="flex flex-col">
                <div
                  className={`group flex h-[52px] items-center justify-between rounded-[10px] pl-4 pr-2 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-background font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectNote(note.id)}
                    className="flex flex-1 h-full items-center gap-2 overflow-hidden text-left text-sm cursor-pointer"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-400" />
                    <span className="truncate">{note.title}</span>
                  </button>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddSubnote?.(note.id, e);
                      }}
                      className="bg-primary rounded-xl text-primary-foreground flex h-10 w-10 items-center justify-center cursor-pointer"
                      aria-label="Add Subnote"
                    >
                      <Plus size={18} />
                    </button>
                    {hasSubNotes && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(note.id);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label="Toggle Subnotes"
                      >
                        <ChevronRight
                          size={16}
                          className={`transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {hasSubNotes && isExpanded && (
                  <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
                    {note.subNotes?.map((sub) => {
                      const isSubSelected = selectedNoteId === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => onSelectNote(sub.id)}
                          className={`flex h-[52px] items-center gap-2 rounded-xl pl-4 pr-2 text-left text-sm cursor-pointer transition-colors ${
                            isSubSelected
                              ? "bg-background font-medium text-foreground shadow-xs"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Circle size={10} className="shrink-0 text-zinc-400" />
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
