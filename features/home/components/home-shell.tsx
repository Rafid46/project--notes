"use client";

import { useEffect, useState } from "react";
import Whiteboard from "@/features/whiteboard/components/whiteboard";
import Sidebar from "./sidebar";
import Header from "./header";
import NotesGrid from "./notes-grid";
import CreateNotePopover from "./create-note-popover";
import type { NoteItem, ViewMode } from "../types";
import { getActiveNote, addNoteToState, updateNoteInState } from "@/features/notes/utils/utils";

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
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

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

  const handleUpdateNote = (noteId: string, updates: Partial<NoteItem>) => {
    setNotes((prev) => updateNoteInState(prev, noteId, updates));
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
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <div className="absolute inset-0 h-full w-full">
        {viewMode === "whiteboard" ? (
          <Whiteboard
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={(id) => {
              setSelectedNoteId(id);
              setIsNoteModalOpen(true);
            }}
            onUpdateNote={handleUpdateNote}
          />
        ) : (
          <NotesGrid
            notes={notes}
            viewMode={viewMode}
            onSelectNote={(id) => {
              setSelectedNoteId(id);
              setIsNoteModalOpen(true);
            }}
            onUpdateNote={handleUpdateNote}
          />
        )}
      </div>

      <Sidebar
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={(id) => {
          setSelectedNoteId(id);
          setIsNoteModalOpen(true);
        }}
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

      {isNoteModalOpen && activeNote && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsNoteModalOpen(false)}
          />
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-white/10 bg-background p-6 shadow-2xl duration-200 rounded-2xl">
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                  {activeNote.title}
                </h2>
                {activeNote.category && (
                  <span className="bg-blue-400 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                    {activeNote.category}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {activeNote.content}
            </div>
            {activeNote.subNotes && activeNote.subNotes.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium mb-2">
                  Subnotes ({activeNote.subNotes.length})
                </h4>
                <ul className="space-y-2">
                  {activeNote.subNotes.map((sub) => (
                    <li
                      key={sub.id}
                      className="text-sm bg-muted p-2 rounded-md"
                    >
                      <span className="font-medium">{sub.title}</span>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {sub.content}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-background text-white h-10 px-4 py-2 border border-transparent"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
