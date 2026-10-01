"use client";

import { useState } from "react";
import Whiteboard from "@/features/whiteboard/components/whiteboard";
import Sidebar from "./sidebar";
import Header from "./header";
import NotesGrid from "./notes-grid";
import type { NoteItem, ViewMode } from "../types";

const INITIAL_NOTES: NoteItem[] = [
  {
    id: "note-1",
    title: "Designs",
    content: "Design systems, branding guidelines, and component mockups for web and mobile.",
    parentId: null,
    color: "#f59e0b",
    subNotes: [
      {
        id: "note-1-1",
        title: "Website Design",
        content: "Landing page wireframes, hero banner layout, and mobile navigation drawer.",
        parentId: "note-1",
        color: "#0284c7",
      },
      {
        id: "note-1-2",
        title: "Logo Design",
        content: "Minimalist vector logo variants, typography exploration, and app icons.",
        parentId: "note-1",
        color: "#9333ea",
      },
    ],
  },
  {
    id: "note-2",
    title: "Project Notes",
    content: "Architecture choices, PostgreSQL schema design, and session sync workflows.",
    parentId: null,
    color: "#10b981",
    subNotes: [
      {
        id: "note-2-1",
        title: "Database Architecture",
        content: "Prisma data models, tree structure with parentId, and user ownership isolation.",
        parentId: "note-2",
        color: "#eab308",
      },
    ],
  },
  {
    id: "note-3",
    title: "Ideas & Research",
    content: "Brainstorming canvas interactions, whiteboard tools, and real-time syncing.",
    parentId: null,
    color: "#ef4444",
  },
];

export default function HomeShell() {
  const [notes] = useState<NoteItem[]>(INITIAL_NOTES);
  const [selectedNoteId, setSelectedNoteId] = useState<string>("note-1");
  const [viewMode, setViewMode] = useState<ViewMode>("whiteboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activeNote =
    notes.find((n) => n.id === selectedNoteId) ||
    notes.flatMap((n) => n.subNotes || []).find((s) => s.id === selectedNoteId) ||
    notes[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
      <Sidebar
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={(id) => setSelectedNoteId(id)}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          currentView={viewMode}
          onSelectView={(mode) => setViewMode(mode)}
          activeNoteTitle={activeNote?.title}
        />

        <main className="relative flex-1 overflow-hidden">
          {viewMode === "whiteboard" ? (
            <div className="h-full w-full">
              <Whiteboard
                notes={notes}
                selectedNoteId={selectedNoteId}
              />
            </div>
          ) : (
            <NotesGrid
              notes={notes}
              viewMode={viewMode}
              onSelectNote={(id) => setSelectedNoteId(id)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
