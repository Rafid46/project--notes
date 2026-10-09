"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { FileUp } from "lucide-react";
import NoteModal from "@/features/notes/components/NoteModal";
import { useAutosave } from "@/features/notes/hooks/useAutosave";
import { useNotes } from "@/features/notes/hooks/useNotes";

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

export default function HomeClient() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>("note-1");
  const [viewMode, setViewMode] = useState<ViewMode>("whiteboard");
  const {
    isOpen: isNoteModalOpen,
    openNoteModal,
    closeNoteModal,
  } = useNoteModalStore();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef<number>(0);

  const { data: fetchedNotes } = useNotes();

  useEffect(() => {
    if (fetchedNotes && fetchedNotes.length > 0) {
      // Map children to subNotes if needed based on backend
      const mappedNotes = fetchedNotes.map((note: any) => ({
        ...note,
        subNotes: note.children || [],
        content:
          typeof note.content === "string"
            ? note.content
            : note.content
              ? JSON.stringify(note.content)
              : "",
        category: note.label?.name || note.category,
      }));
      setNotes(mappedNotes);
    }
  }, [fetchedNotes]);

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
    initialLabelId?: string;
    initialCategory?: string;
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

  const prevIsNoteModalOpen = useRef(isNoteModalOpen);
  useEffect(() => {
    if (prevIsNoteModalOpen.current && !isNoteModalOpen) {
      const note = getActiveNote(notes, selectedNoteId);
      if (
        note &&
        note.id.startsWith("temp-") &&
        !note.title.trim() &&
        !note.content.trim()
      ) {
        setNotes((prev) => {
          // Remove from parent subNotes if needed, or from main list
          const filterEmpty = (items: NoteItem[]): NoteItem[] => {
            return items
              .filter((n) => n.id !== note.id)
              .map((n) => ({
                ...n,
                subNotes: n.subNotes ? filterEmpty(n.subNotes) : undefined,
              }));
          };
          return filterEmpty(prev);
        });
      }
    }
    prevIsNoteModalOpen.current = isNoteModalOpen;
  }, [isNoteModalOpen, notes, selectedNoteId]);

  const handleUpdateNoteState = useCallback(
    (noteId: string, updates: Partial<NoteItem>) => {
      if (updates.id && noteId !== updates.id) {
        setSelectedNoteId((prev) => (prev === noteId ? updates.id! : prev));
        const modalState = useNoteModalStore.getState();
        if (modalState.selectedNoteId === noteId) {
          modalState.setSelectedNoteId(updates.id);
        }
      }
      setNotes((prev) => updateNoteInState(prev, noteId, updates));
    },
    [],
  );

  const { registerChange, restoreBackups } = useAutosave({
    onUpdateNoteState: handleUpdateNoteState,
  });

  useEffect(() => {
    restoreBackups();
  }, [restoreBackups]);

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
    const tempId = `temp-${Date.now()}`;
    const newNote: NoteItem = {
      id: tempId,
      ...newNoteData,
    };
    setNotes((prev) => addNoteToState(prev, newNote));
    registerChange(
      tempId,
      {
        title: newNoteData.title,
        content: newNoteData.content,
        category: newNoteData.category,
        labelId: (newNoteData as any).labelId,
      },
      { isCreating: true, parentId: newNoteData.parentId },
    );
  };

  const handleUpdateNote = (noteId: string, updates: Partial<NoteItem>) => {
    if (
      updates.title !== undefined ||
      updates.content !== undefined ||
      updates.labelId !== undefined ||
      updates.category !== undefined
    ) {
      registerChange(noteId, updates);
    }
    handleUpdateNoteState(noteId, updates);
  };

  const openPopover = (
    parentId: string | null,
    e: React.MouseEvent,
    labelId?: string,
    category?: string,
  ) => {
    if (isNoteModalOpen) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setPopoverConfig({
      isOpen: true,
      parentId,
      anchorRect: rect,
      initialLabelId: labelId,
      initialCategory: category,
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
        onOpenAddNoteWithLabel={(labelId, labelName, e) =>
          openPopover(null, e, labelId, labelName)
        }
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
        initialLabelId={popoverConfig.initialLabelId}
        initialCategory={popoverConfig.initialCategory}
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
