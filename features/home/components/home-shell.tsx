"use client";

import { useEffect, useState } from "react";
import Whiteboard from "@/features/whiteboard/components/whiteboard";
import Sidebar from "./sidebar";
import Header from "./header";
import NotesGrid from "./notes-grid";
import CreateNotePopover from "./create-note-popover";
import type { NoteItem, ViewMode } from "../types";
import { getActiveNote, addNoteToState } from "@/features/notes/utils/utils";

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
    anchorRect: {
      top: number;
      left: number;
      right: number;
      bottom: number;
    } | null;
    initialTitle?: string;
  }>({ isOpen: false, parentId: null, anchorRect: null });

  // Global keydown listener for fast note creation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if already typing in an input/textarea or if popover is already open
      if (
        popoverConfig.isOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      // Check if key is a single alphanumeric character (a-z, 0-9)
      if (/^[a-zA-Z0-9]$/.test(e.key)) {
        setPopoverConfig({
          isOpen: true,
          parentId: null,
          anchorRect: null,
          initialTitle: e.key,
        });
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [popoverConfig.isOpen]);

  const activeNote = getActiveNote(notes, selectedNoteId);

  const handleAddNote = (newNoteData: {
    title: string;
    content: string;
    color?: string;
    parentId: string | null;
  }) => {
    setNotes((prev) => addNoteToState(prev, newNoteData));
  };

  const openPopover = (parentId: string | null, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverConfig({
      isOpen: true,
      parentId,
      anchorRect: {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
      },
      initialTitle: "",
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
        initialTitle={popoverConfig.initialTitle}
      />
    </main>
  );
}
