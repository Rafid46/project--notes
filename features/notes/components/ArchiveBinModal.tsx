"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  RotateCcw,
  Trash2,
  X,
  AlertTriangle,
  Fullscreen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useArchivedNotes,
  useBinNotes,
  useArchiveNote,
  useDeleteNote,
  useRestoreNote,
  usePermanentDeleteNote,
  useEmptyBin,
} from "@/features/notes/hooks/useNotes";
import { getCardTextColor } from "@/features/notes/utils/utils";
import type { NoteItem } from "@/features/home/types";

interface ArchiveBinModalProps {
  mode: "archive" | "bin";
  isOpen: boolean;
  onClose: () => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function ArchiveBinModal({
  mode,
  isOpen,
  onClose,
}: ArchiveBinModalProps) {
  const isBin = mode === "bin";
  const [confirmEmptyOpen, setConfirmEmptyOpen] = useState(false);
  const [noteToPermanentDelete, setNoteToPermanentDelete] =
    useState<NoteItem | null>(null);

  const { data: archivedNotes = [], isLoading: isArchivedLoading } =
    useArchivedNotes(isOpen && !isBin);
  const { data: binNotes = [], isLoading: isBinLoading } = useBinNotes(
    isOpen && isBin,
  );

  const archiveMutation = useArchiveNote();
  const moveToBinMutation = useDeleteNote();
  const restoreMutation = useRestoreNote();
  const permanentDeleteMutation = usePermanentDeleteNote();
  const emptyBinMutation = useEmptyBin();

  const notes = isBin ? binNotes : archivedNotes;
  const isLoading = isBin ? isBinLoading : isArchivedLoading;

  const handleUnarchive = (noteId: string) => {
    archiveMutation.mutate({ id: noteId, isArchived: false });
  };

  const handleMoveToBin = (noteId: string) => {
    moveToBinMutation.mutate(noteId);
  };

  const handleRestore = (noteId: string) => {
    restoreMutation.mutate(noteId);
  };

  const handleConfirmSingleDelete = () => {
    if (!noteToPermanentDelete) return;
    permanentDeleteMutation.mutate(noteToPermanentDelete.id, {
      onSuccess: () => {
        setNoteToPermanentDelete(null);
      },
    });
  };

  const handleConfirmEmptyBin = () => {
    emptyBinMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmEmptyOpen(false);
      },
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-2xl max-h-[82vh] flex flex-col p-6 !rounded-3xl border border-border/80 bg-popover/95 backdrop-blur-md shadow-2xl overflow-hidden"
          overlayClassName="bg-black/35 !backdrop-blur-xs"
        >
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  isBin
                    ? "bg-destructive/15 text-destructive"
                    : "bg-[#BBDC12]/25 text-[#495a00] dark:text-[#BBDC12]"
                }`}
              >
                {isBin ? <Trash2 size={17} /> : <Archive size={17} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-semibold">
                    {isBin ? "Bin" : "Archive"}
                  </DialogTitle>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {notes.length}
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {isBin
                    ? "Restore deleted notes or permanently remove them."
                    : "Notes stored out of your main workspace."}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isBin && notes.length > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmEmptyOpen(true)}
                  disabled={emptyBinMutation.isPending}
                  className="rounded-full text-xs font-semibold px-3.5 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete All</span>
                </Button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </DialogHeader>

          <section className="flex-1 overflow-y-auto pr-1 py-2 sidebar-scrollbar min-h-[220px]">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-32 rounded-2xl border border-border/60 bg-muted/40 animate-pulse p-4"
                  />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center rounded-2xl border border-dashed border-border/80 bg-secondary/20">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-3 ${
                    isBin
                      ? "bg-destructive/10 text-destructive"
                      : "bg-[#BBDC12]/20 text-[#495a00] dark:text-[#BBDC12]"
                  }`}
                >
                  {isBin ? <Trash2 size={22} /> : <Archive size={22} />}
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {isBin ? "Bin is empty" : "No archived notes"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
                  {isBin
                    ? "Deleted notes will appear here so you can restore or permanently delete them."
                    : "Archived notes will show up here whenever you archive a note."}
                </p>
              </div>
            ) : (
              <TooltipProvider delay={200}>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {notes.map((note) => {
                    const previewText = stripHtml(note.content || "");
                    const textColor = getCardTextColor(note.color);
                    return (
                      <li key={note.id}>
                        <article
                          style={
                            note.color
                              ? { backgroundColor: note.color }
                              : undefined
                          }
                          className={`group flex flex-col justify-between rounded-2xl border p-4 min-h-36 transition-all ${
                            note.color
                              ? "border-black/10 dark:border-white/15"
                              : "border-border/80 bg-card hover:border-border"
                          }`}
                        >
                          {isBin ? (
                            <div>
                              <h3
                                className={`text-sm font-semibold leading-snug line-clamp-1 ${
                                  note.textColor ? "" : textColor.title
                                }`}
                                style={
                                  note.textColor
                                    ? { color: note.textColor }
                                    : undefined
                                }
                              >
                                {note.title || "Untitled"}
                              </h3>
                              {previewText && (
                                <p
                                  className={`mt-1.5 text-xs leading-relaxed line-clamp-3 ${
                                    note.textColor ? "" : textColor.body
                                  }`}
                                  style={
                                    note.textColor
                                      ? { color: note.textColor }
                                      : undefined
                                  }
                                >
                                  {previewText}
                                </p>
                              )}
                              {note.labels && note.labels.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1">
                                  {note.labels.slice(0, 3).map((label) => (
                                    <span
                                      key={label}
                                      className="rounded-full bg-background/70 border border-border/60 px-2 py-0.5 text-[10px] font-medium text-foreground"
                                    >
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Link
                              href={`/notes/${note.id}`}
                              onClick={onClose}
                              className="block flex-1 cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h3
                                  className={`text-sm font-semibold leading-snug line-clamp-1 ${
                                    note.textColor ? "" : textColor.title
                                  }`}
                                  style={
                                    note.textColor
                                      ? { color: note.textColor }
                                      : undefined
                                  }
                                >
                                  {note.title || "Untitled"}
                                </h3>
                                <span
                                  aria-hidden="true"
                                  className="shrink-0 rounded-lg p-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Fullscreen size={14} />
                                </span>
                              </div>
                              {previewText && (
                                <p
                                  className={`mt-1.5 text-xs leading-relaxed line-clamp-3 ${
                                    note.textColor ? "" : textColor.body
                                  }`}
                                  style={
                                    note.textColor
                                      ? { color: note.textColor }
                                      : undefined
                                  }
                                >
                                  {previewText}
                                </p>
                              )}
                              {note.labels && note.labels.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1">
                                  {note.labels.slice(0, 3).map((label) => (
                                    <span
                                      key={label}
                                      className="rounded-full bg-background/70 border border-border/60 px-2 py-0.5 text-[10px] font-medium text-foreground"
                                    >
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </Link>
                          )}

                          <div className="mt-4 pt-2.5 border-t border-border/50 flex items-center justify-between gap-2">
                            {isBin && note.deletedAt ? (
                              <time
                                dateTime={note.deletedAt}
                                className="text-[11px] text-muted-foreground"
                              >
                                {new Date(note.deletedAt).toLocaleDateString()}
                              </time>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                {isBin ? "In Bin" : "Archived"}
                              </span>
                            )}

                            <div className="flex items-center gap-1.5">
                              {isBin ? (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="xs"
                                        onClick={() => handleRestore(note.id)}
                                        disabled={restoreMutation.isPending}
                                        className="rounded-full px-2.5 cursor-pointer"
                                      >
                                        <RotateCcw size={12} />
                                        <span>Restore</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Restore note</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="xs"
                                        onClick={() =>
                                          setNoteToPermanentDelete(note)
                                        }
                                        disabled={
                                          permanentDeleteMutation.isPending
                                        }
                                        className="rounded-full px-2.5 cursor-pointer"
                                      >
                                        <Trash2 size={12} />
                                        <span>Delete</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Delete permanently
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              ) : (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="xs"
                                        onClick={() => handleUnarchive(note.id)}
                                        disabled={archiveMutation.isPending}
                                        className="rounded-full px-2.5 cursor-pointer"
                                      >
                                        <ArchiveRestore size={12} />
                                        <span>Unarchive</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Move back to notes
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() => handleMoveToBin(note.id)}
                                        disabled={moveToBinMutation.isPending}
                                        aria-label="Move to bin"
                                        className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                      >
                                        <Trash2 size={13} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Move to bin</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </TooltipProvider>
            )}
          </section>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(noteToPermanentDelete)}
        onOpenChange={(open) => !open && setNoteToPermanentDelete(null)}
      >
        <DialogContent className="sm:max-w-[400px] !rounded-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={18} />
              <DialogTitle>Delete permanently?</DialogTitle>
            </div>
            <DialogDescription>
              &ldquo;{noteToPermanentDelete?.title || "Untitled"}&rdquo; will be
              permanently removed and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNoteToPermanentDelete(null)}
              disabled={permanentDeleteMutation.isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmSingleDelete}
              disabled={permanentDeleteMutation.isPending}
              className="cursor-pointer"
            >
              {permanentDeleteMutation.isPending
                ? "Deleting..."
                : "Delete Forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmEmptyOpen} onOpenChange={setConfirmEmptyOpen}>
        <DialogContent className="sm:max-w-[400px] !rounded-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={18} />
              <DialogTitle>Delete all notes in Bin?</DialogTitle>
            </div>
            <DialogDescription>
              All {notes.length} note{notes.length === 1 ? "" : "s"} in the Bin
              will be permanently deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmEmptyOpen(false)}
              disabled={emptyBinMutation.isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmEmptyBin}
              disabled={emptyBinMutation.isPending}
              className="cursor-pointer"
            >
              {emptyBinMutation.isPending ? "Deleting..." : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
