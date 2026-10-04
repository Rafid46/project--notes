"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Download, X, Loader2 } from "lucide-react";
import NoteToolbar from "@/features/notes/components/note-toolbar";
import Whiteboard from "@/features/whiteboard/components/whiteboard";
import Sidebar from "./sidebar";
import Header from "./header";
import NotesGrid from "./notes-grid";
import CreateNotePopover from "./create-note-popover";
import type { NoteItem, ViewMode } from "../types";

import { getSavedDefaultView, SETTINGS_CHANGE_EVENT } from "./settings-modal";
import LinkPreviewCard from "@/features/notes/components/link-preview-card";
import {
  addNoteToState,
  extractUrls,
  getActiveNote,
  getLinkPreview,
  updateNoteInState,
} from "@/features/notes/utils/link-preview";

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

export default function HomeShell() {
  const [notes, setNotes] = useState<NoteItem[]>(INITIAL_NOTES);
  const [selectedNoteId, setSelectedNoteId] = useState<string>("note-1");
  const [viewMode, setViewMode] = useState<ViewMode>("whiteboard");
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isLoadingModalPreview, setIsLoadingModalPreview] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const fetchingUrlsRef = useRef<Set<string>>(new Set());

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
  }>({ isOpen: false, parentId: null, anchorRect: null });

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
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

  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (
        popoverConfig.isOpen ||
        isNoteModalOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      const text = e.clipboardData?.getData("text");
      if (!text) return;
      const urls = extractUrls(text);
      if (urls.length === 0) return;

      e.preventDefault();
      const firstUrl = urls[0];
      const newNoteId = `note-${Date.now()}`;
      const newNote: NoteItem = {
        id: newNoteId,
        title: "Web Link",
        content: text,
        color: "#0284c7",
        parentId: null,
        subNotes: [],
      };
      setNotes((prev) => [...prev, newNote]);
      setSelectedNoteId(newNoteId);
      setIsNoteModalOpen(true);
      setIsLoadingModalPreview(true);
      fetchingUrlsRef.current.add(firstUrl);
      getLinkPreview(firstUrl)
        .then((preview) => {
          if (preview) {
            setNotes((prev) =>
              updateNoteInState(prev, newNoteId, {
                title: preview.title || "Web Link",
                linkPreviews: [preview],
              }),
            );
          }
        })
        .finally(() => {
          fetchingUrlsRef.current.delete(firstUrl);
          setIsLoadingModalPreview(false);
        });
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [popoverConfig.isOpen, isNoteModalOpen]);

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

  useEffect(() => {
    if (!activeNote || !isNoteModalOpen) return;
    const urls = [
      ...extractUrls(activeNote.content || ""),
      ...extractUrls(activeNote.title || ""),
    ];
    if (urls.length === 0) return;

    for (const url of urls) {
      const existing = activeNote.linkPreviews?.find((p) => p.url === url);
      if ((existing && existing.image) || fetchingUrlsRef.current.has(url)) {
        continue;
      }
      fetchingUrlsRef.current.add(url);
      setIsLoadingModalPreview(true);
      getLinkPreview(url)
        .then((preview) => {
          if (preview) {
            setNotes((prev) => {
              const currentNote = getActiveNote(prev, activeNote.id);
              const currentPreviews = currentNote?.linkPreviews || [];
              const updatedPreviews = currentPreviews.some(
                (p) => p.url === preview.url,
              )
                ? currentPreviews.map((p) =>
                    p.url === preview.url ? preview : p,
                  )
                : [...currentPreviews, preview];
              return updateNoteInState(prev, activeNote.id, {
                linkPreviews: updatedPreviews,
              });
            });
          }
        })
        .finally(() => {
          fetchingUrlsRef.current.delete(url);
          setIsLoadingModalPreview(false);
        });
    }
  }, [activeNote?.content, activeNote?.title, activeNote?.id, isNoteModalOpen]);

  const handleAddNote = (newNoteData: {
    title: string;
    content: string;
    color?: string;
    category?: string;
    parentId: string | null;
    linkPreviews?: NoteItem["linkPreviews"];
  }) => {
    setNotes((prev) => addNoteToState(prev, newNoteData));
  };

  const handleUpdateNote = (noteId: string, updates: Partial<NoteItem>) => {
    setNotes((prev) => updateNoteInState(prev, noteId, updates));
  };

  const handleModalPaste = async (
    e: React.ClipboardEvent<HTMLInputElement | HTMLDivElement>,
  ) => {
    const text = e.clipboardData.getData("text");
    if (!text || !activeNote) return;
    const urls = extractUrls(text);
    if (urls.length === 0) return;

    setIsLoadingModalPreview(true);
    try {
      for (const url of urls) {
        const existing = activeNote.linkPreviews?.find((p) => p.url === url);
        if ((existing && existing.image) || fetchingUrlsRef.current.has(url)) {
          continue;
        }
        fetchingUrlsRef.current.add(url);
        try {
          const preview = await getLinkPreview(url);
          if (preview) {
            setNotes((prev) => {
              const currentNote = getActiveNote(prev, activeNote.id);
              const currentPreviews = currentNote?.linkPreviews || [];
              const updatedPreviews = currentPreviews.some(
                (p) => p.url === preview.url,
              )
                ? currentPreviews.map((p) =>
                    p.url === preview.url ? preview : p,
                  )
                : [...currentPreviews, preview];
              return updateNoteInState(prev, activeNote.id, {
                linkPreviews: updatedPreviews,
              });
            });
          }
        } finally {
          fetchingUrlsRef.current.delete(url);
        }
      }
    } finally {
      setIsLoadingModalPreview(false);
    }
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
                      onChange={(e) =>
                        handleUpdateNote(activeNote.id, {
                          title: e.target.value,
                        })
                      }
                      onPaste={handleModalPaste}
                      placeholder="Note title..."
                      style={
                        activeNote.textColor
                          ? { color: activeNote.textColor }
                          : undefined
                      }
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
                  onPaste={handleModalPaste}
                  onInput={(e) =>
                    handleUpdateNote(activeNote.id, {
                      content: e.currentTarget.innerHTML,
                    })
                  }
                  data-placeholder="Take a note..."
                  style={
                    activeNote.textColor
                      ? { color: activeNote.textColor }
                      : undefined
                  }
                  className="text-sm whitespace-pre-wrap mt-4 min-h-[6rem] outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_img]:rounded-lg"
                />
                {isLoadingModalPreview && (
                  <div className="mt-3 p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center gap-2.5 animate-pulse">
                    <Loader2
                      size={16}
                      className="animate-spin text-muted-foreground shrink-0"
                    />
                    <span className="text-xs text-muted-foreground">
                      Loading link preview...
                    </span>
                  </div>
                )}
                {activeNote.linkPreviews &&
                  activeNote.linkPreviews.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                      {activeNote.linkPreviews.map((preview) => (
                        <LinkPreviewCard
                          key={preview.url}
                          preview={preview}
                          onRemove={() => {
                            const updated = (
                              activeNote.linkPreviews || []
                            ).filter((p) => p.url !== preview.url);
                            handleUpdateNote(activeNote.id, {
                              linkPreviews: updated,
                            });
                          }}
                        />
                      ))}
                    </div>
                  )}
                {activeNote.files && activeNote.files.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">
                      Attached Files ({activeNote.files.length})
                    </h4>
                    {activeNote.files.some((f) =>
                      f.type.startsWith("image/"),
                    ) && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {activeNote.files
                          .filter((f) => f.type.startsWith("image/"))
                          .map((file) => (
                            <div
                              key={file.id}
                              className="relative group/file rounded-lg overflow-hidden border border-border/80 bg-muted/30 aspect-video"
                            >
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-between p-1.5 text-white">
                                <span className="text-[10px] truncate max-w-[70%] font-medium">
                                  {file.name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <a
                                    href={file.url}
                                    download={file.name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 hover:bg-white/20 rounded cursor-pointer text-white"
                                    title="Download"
                                  >
                                    <Download size={12} />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = (
                                        activeNote.files || []
                                      ).filter((f) => f.id !== file.id);
                                      handleUpdateNote(activeNote.id, {
                                        files: updated,
                                      });
                                    }}
                                    className="p-1 hover:bg-white/20 rounded cursor-pointer text-white"
                                    title="Remove"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {activeNote.files
                        .filter((f) => !f.type.startsWith("image/"))
                        .map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs transition-colors"
                          >
                            <Paperclip
                              size={14}
                              className="text-muted-foreground"
                            />
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
                                const updated = (activeNote.files || []).filter(
                                  (f) => f.id !== file.id,
                                );
                                handleUpdateNote(activeNote.id, {
                                  files: updated,
                                });
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
                <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border">
                  <NoteToolbar
                    note={activeNote}
                    onUpdate={(updates) =>
                      handleUpdateNote(activeNote.id, updates)
                    }
                    contentRef={modalContentRef}
                    isModal
                  />

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
