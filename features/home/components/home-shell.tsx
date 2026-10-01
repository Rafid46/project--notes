"use client";

import { useState } from "react";
import Whiteboard from "@/features/whiteboard/components/whiteboard";
import Sidebar from "./sidebar";
import Header from "./header";
import NotesGrid from "./notes-grid";
import CreateNotePopover from "./create-note-popover";
import type { NoteItem, ViewMode } from "../types";

const INITIAL_NOTES: NoteItem[] = [
  {
    id: "note-1",
    title: "Designs",
    content:
      "Design systems, branding guidelines, and component mockups for web and mobile.",
    parentId: null,
    color: "#f59e0b",
    subNotes: [
      {
        id: "note-1-1",
        title: "Website Design",
        content:
          "Landing page wireframes, hero banner layout, and mobile navigation drawer.",
        parentId: "note-1",
        color: "#0284c7",
      },
      {
        id: "note-1-2",
        title: "Logo Design",
        content:
          "Minimalist vector logo variants, typography exploration, and app icons.",
        parentId: "note-1",
        color: "#9333ea",
      },
    ],
  },
  {
    id: "note-2",
    title: "Project Notes",
    content:
      "Architecture choices, PostgreSQL schema design, and session sync workflows.",
    parentId: null,
    color: "#10b981",
    subNotes: [
      {
        id: "note-2-1",
        title: "Database Architecture",
        content:
          "Prisma data models, tree structure with parentId, and user ownership isolation.",
        parentId: "note-2",
        color: "#eab308",
      },
    ],
  },
  {
    id: "note-3",
    title: "Ideas & Research",
    content:
      "Brainstorming canvas interactions, whiteboard tools, and real-time syncing.",
    parentId: null,
    color: "#ef4444",
  },
];

export default function HomeShell() {
  const [notes, setNotes] = useState<NoteItem[]>(INITIAL_NOTES);
  const [selectedNoteId, setSelectedNoteId] = useState<string>("note-1");
  const [viewMode, setViewMode] = useState<ViewMode>("whiteboard");
  
  const [popoverConfig, setPopoverConfig] = useState<{
    isOpen: boolean;
    parentId: string | null;
    anchorRect: { top: number; left: number; right: number; bottom: number } | null;
  }>({ isOpen: false, parentId: null, anchorRect: null });

  const activeNote =
    notes.find((n) => n.id === selectedNoteId) ||
    notes
      .flatMap((n) => n.subNotes || [])
      .find((s) => s.id === selectedNoteId) ||
    notes[0];

  const handleAddNote = (newNoteData: { title: string; content: string; color?: string; parentId: string | null }) => {
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: newNoteData.title,
      content: newNoteData.content,
      color: newNoteData.color,
      parentId: newNoteData.parentId,
      subNotes: [],
    };

    setNotes((prev) => {
      if (newNote.parentId) {
        return prev.map((note) => {
          if (note.id === newNote.parentId) {
            return {
              ...note,
              subNotes: [...(note.subNotes || []), newNote],
            };
          }
          return note;
        });
      } else {
        return [...prev, newNote];
      }
    });
  };

  const openPopover = (parentId: string | null, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverConfig({
      isOpen: true,
      parentId,
      anchorRect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
    });
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-white text-zinc-900">
      <div className="absolute inset-0 h-full w-full">
        {viewMode === "whiteboard" ? (
          <Whiteboard
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={(id) => setSelectedNoteId(id)}
          />
        ) : (
          <NotesGrid
            notes={notes}
            viewMode={viewMode}
            onSelectNote={(id) => setSelectedNoteId(id)}
          />
        )}
      </div>

      <Sidebar
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={(id) => setSelectedNoteId(id)}
        onOpenAddSubnote={openPopover}
      />

      <Header
        currentView={viewMode}
        onSelectView={(mode) => setViewMode(mode)}
        activeNoteTitle={activeNote?.title}
        onOpenAddNote={(e) => openPopover(null, e)}
      />

      <CreateNotePopover
        isOpen={popoverConfig.isOpen}
        onClose={() => setPopoverConfig((p) => ({ ...p, isOpen: false }))}
        onSave={handleAddNote}
        parentId={popoverConfig.parentId}
        anchorRect={popoverConfig.anchorRect}
      />
    </main>
  );
}
