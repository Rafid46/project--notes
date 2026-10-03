"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Download, Palette, X } from "lucide-react";
import CustomColorPicker from "@/components/ui/color-picker";
import NoteToolbar from "@/features/notes/components/note-toolbar";
import Whiteboard from "@/features/whiteboard/components/whiteboard";
import Sidebar from "./sidebar";
import Header from "./header";
import NotesGrid from "./notes-grid";
import CreateNotePopover from "./create-note-popover";
import type { NoteItem, ViewMode } from "../types";
import { getActiveNote, addNoteToState, updateNoteInState } from "@/features/notes/utils/utils";
import { getSavedDefaultView, SETTINGS_CHANGE_EVENT } from "./settings-modal";

const TEXT_COLORS: { label: string; value?: string; previewColor: string }[] = [
  { label: "Default", value: undefined, previewColor: "var(--card)" },
  { label: "Dark", value: "#09090b", previewColor: "#09090b" },
  { label: "Light", value: "#f8fafc", previewColor: "#f8fafc" },
  { label: "Blue", value: "#2563eb", previewColor: "#2563eb" },
  { label: "Purple", value: "#7c3aed", previewColor: "#7c3aed" },
  { label: "Emerald", value: "#059669", previewColor: "#059669" },
  { label: "Amber", value: "#d97706", previewColor: "#d97706" },
  { label: "Red", value: "#dc2626", previewColor: "#dc2626" },
];

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
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewMode(getSavedDefaultView());
    const handleSettingsChange = () => {
      setViewMode(getSavedDefaultView());
    };
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    return () => window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
  }, []);

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

  useEffect(() => {
    if (modalContentRef.current && isNoteModalOpen && activeNote) {
      if (
        modalContentRef.current.innerHTML !== (activeNote.content || "") &&
        document.activeElement !== modalContentRef.current
      ) {
        modalContentRef.current.innerHTML = activeNote.content || "";
      }
    }
  }, [activeNote?.content, activeNote?.id, isNoteModalOpen]);

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

      <AnimatePresence>
        {isNoteModalOpen && activeNote && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
              onClick={() => setIsNoteModalOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
              <motion.div
                layoutId={`note-${activeNote.id}`}
                className="w-full max-w-lg gap-4 border border-border bg-card p-6 shadow-2xl rounded-[26px] pointer-events-auto"
              >
                <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={activeNote.title}
                      onChange={(e) => handleUpdateNote(activeNote.id, { title: e.target.value })}
                      placeholder="Note title..."
                      style={activeNote.textColor ? { color: activeNote.textColor } : undefined}
                      className="w-full bg-transparent border-none outline-none text-lg font-semibold leading-none mr-2"
                    />
                    {activeNote.category && (
                      <span className="bg-blue-400 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase shrink-0">
                        {activeNote.category}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  ref={modalContentRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => handleUpdateNote(activeNote.id, { content: e.currentTarget.innerHTML })}
                  data-placeholder="Take a note..."
                  style={activeNote.textColor ? { color: activeNote.textColor } : undefined}
                  className="text-sm whitespace-pre-wrap mt-4 min-h-[6rem] outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic"
                />
                {activeNote.files && activeNote.files.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">
                      Attached Files ({activeNote.files.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeNote.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs transition-colors"
                        >
                          <Paperclip size={14} className="text-muted-foreground" />
                          <span className="font-medium">{file.name}</span>
                          <a
                            href={file.url}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-0.5 text-muted-foreground hover:text-foreground"
                            title="Download"
                          >
                            <Download size={12} />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (activeNote.files || []).filter((f) => f.id !== file.id);
                              handleUpdateNote(activeNote.id, { files: updated });
                            }}
                            className="p-0.5 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Remove"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                          <div
                            className="text-xs text-muted-foreground mt-1 line-clamp-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                            dangerouslySetInnerHTML={{ __html: sub.content }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-border">
                  <div className="flex items-center gap-3 flex-wrap">
                    <NoteToolbar
                      note={activeNote}
                      onUpdate={(updates) => handleUpdateNote(activeNote.id, updates)}
                      contentRef={modalContentRef}
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground mr-1">
                        Text Color:
                      </span>
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c.label}
                          type="button"
                          title={c.label}
                          onClick={() => handleUpdateNote(activeNote.id, { textColor: c.value })}
                          className={`w-6 h-6 rounded-full border transition-all hover:scale-110 flex items-center justify-center cursor-pointer ${
                            (activeNote.textColor || "") === (c.value || "")
                              ? "ring-2 ring-primary ring-offset-2 scale-105 border-primary"
                              : "border-border/80"
                          }`}
                          style={{ backgroundColor: c.previewColor }}
                        >
                          {!c.value && (
                            <span className="text-[10px] font-bold text-foreground">A</span>
                          )}
                        </button>
                      ))}
                      <CustomColorPicker
                        value={activeNote.textColor || "#000000"}
                        onChange={(color) => handleUpdateNote(activeNote.id, { textColor: color })}
                        placement="top"
                        align="start"
                      >
                        <button
                          type="button"
                          title="Custom text color"
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
                        >
                          <Palette size={15} />
                        </button>
                      </CustomColorPicker>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsNoteModalOpen(false)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 py-2 border border-transparent cursor-pointer shrink-0"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
