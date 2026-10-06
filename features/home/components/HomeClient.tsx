"use client";

import { useEffect, useState, useRef } from "react";
import { FileUp } from "lucide-react";
import NoteModal from "@/features/notes/components/NoteModal";

import NotesGrid from "./NotesGrid";
import CreateNotePopover from "../../notes/components/CreateNotePopover";
import type { NoteItem, ViewMode } from "../types";

import { getSavedDefaultView, SETTINGS_CHANGE_EVENT } from "./SettingsModal";
import {
  addNoteToState,
  extractUrls,
  getActiveNote,
  getLinkPreview,
  updateNoteInState,
} from "@/features/notes/utils/link-preview";
import { processDroppedFiles } from "@/features/notes/utils/file-handler";

import Sidebar from "./Sidebar";

import { useNoteModalStore } from "@/store/useNoteModalStore";
import Header from "./Header";
import Whiteboard from "@/features/whiteboard/components/Whiteboard";

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
  {
    id: "note-4",
    title: "YouTube Video & Resources",
    content:
      "Watch the video report on online scam awareness:\nhttps://www.youtube.com/watch?v=Pm9_6zbtvM4",
    parentId: null,
    color: "#0284c7",
    linkPreviews: [
      {
        url: "https://www.youtube.com/watch?v=Pm9_6zbtvM4",
        title:
          "ক্যাশ অন ডেলিভারির নামে ভয়াবহ প্রতারণা, সতর্ক করল পুলিশ | Cash On Delivery | Online Scam | Jugantor",
        description: "Daily Jugantor · YouTube",
        image: "https://i.ytimg.com/vi/Pm9_6zbtvM4/hqdefault.jpg",
        favicon: "https://www.youtube.com/s/desktop/f17255be/img/favicon.ico",
        siteName: "YouTube",
      },
    ],
  },
];

export default function HomeClient() {
  const [notes, setNotes] = useState<NoteItem[]>(INITIAL_NOTES);
  const [selectedNoteId, setSelectedNoteId] = useState<string>("note-1");
  const [viewMode, setViewMode] = useState<ViewMode>("whiteboard");
  const {
    isOpen: isNoteModalOpen,
    openNoteModal,
    closeNoteModal,
  } = useNoteModalStore();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef<number>(0);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
        dragCounterRef.current += 1;
        setIsDraggingOver(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current <= 0) {
          dragCounterRef.current = 0;
          setIsDraggingOver(false);
        }
      }
    };

    const handleDrop = async (e: DragEvent) => {
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        e.preventDefault();
        dragCounterRef.current = 0;
        setIsDraggingOver(false);

        if (isNoteModalOpen) {
          closeNoteModal();
        }

        const { title, content, files } = await processDroppedFiles(
          e.dataTransfer.files,
        );
        setPopoverConfig({
          isOpen: true,
          parentId: null,
          anchorRect: null,
          initialTitle: title || "",
          initialContent: content || "",
          initialFiles: files,
        });
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [isNoteModalOpen, closeNoteModal]);

  useEffect(() => {
    setViewMode(getSavedDefaultView());
    const handleSettingsChange = () => {
      setViewMode(getSavedDefaultView());
    };
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    return () =>
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
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
    initialContent?: string;
    initialFiles?: NoteItem["files"];
  }>({ isOpen: false, parentId: null, anchorRect: null });

  useEffect(() => {
    if (isNoteModalOpen && popoverConfig.isOpen) {
      setPopoverConfig((prev) => ({ ...prev, isOpen: false }));
    }
  }, [isNoteModalOpen, popoverConfig.isOpen]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        popoverConfig.isOpen ||
        isNoteModalOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable) ||
        (e.target instanceof HTMLElement &&
          e.target.closest('[role="dialog"]')) ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

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
  }, [popoverConfig.isOpen, isNoteModalOpen]);

  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (
        popoverConfig.isOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        e.preventDefault();
        if (isNoteModalOpen) {
          closeNoteModal();
        }
        const { title, content, files } = await processDroppedFiles(
          e.clipboardData.files,
        );
        setPopoverConfig({
          isOpen: true,
          parentId: null,
          anchorRect: null,
          initialTitle: title || "",
          initialContent: content || "",
          initialFiles: files,
        });
        return;
      }

      const text = e.clipboardData?.getData("text");
      if (!text) return;
      const urls = extractUrls(text);
      if (urls.length === 0) return;

      e.preventDefault();
      if (isNoteModalOpen) {
        closeNoteModal();
      }
      setPopoverConfig({
        isOpen: true,
        parentId: null,
        anchorRect: null,
        initialTitle: "Web Link",
        initialContent: text,
        initialFiles: [],
      });
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [popoverConfig.isOpen, isNoteModalOpen, closeNoteModal]);

  const activeNote = getActiveNote(notes, selectedNoteId);

  const handleAddNote = (newNoteData: {
    title: string;
    content: string;
    color?: string;
    category?: string;
    parentId: string | null;
    linkPreviews?: NoteItem["linkPreviews"];
    files?: NoteItem["files"];
  }) => {
    setNotes((prev) => addNoteToState(prev, newNoteData));
  };

  const handleUpdateNote = (noteId: string, updates: Partial<NoteItem>) => {
    setNotes((prev) => updateNoteInState(prev, noteId, updates));
  };

  const openPopover = (parentId: string | null, e: React.MouseEvent) => {
    if (isNoteModalOpen) return;
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
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none p-6">
          <div className="flex flex-col items-center justify-center w-full max-w-lg h-64 rounded-3xl border-2 border-dashed border-primary/60 bg-card/60 shadow-2xl p-6 text-center">
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-3">
              <FileUp size={36} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Drop files here
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your note will be created automatically with the file content
            </p>
          </div>
        </div>
      )}
      <div className="absolute inset-0 h-full w-full">
        {viewMode === "whiteboard" ? (
          <Whiteboard
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={(id) => {
              setSelectedNoteId(id);
              openNoteModal(id);
            }}
            onUpdateNote={handleUpdateNote}
          />
        ) : (
          <NotesGrid
            notes={notes}
            viewMode={viewMode}
            onSelectNote={(id) => {
              setSelectedNoteId(id);
              openNoteModal(id);
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
          openNoteModal(id);
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
        initialContent={popoverConfig.initialContent}
        initialFiles={popoverConfig.initialFiles}
      />

      <NoteModal
        note={activeNote}
        isOpen={isNoteModalOpen}
        onClose={() => closeNoteModal()}
        onUpdateNote={handleUpdateNote}
      />
    </main>
  );
}
