"use client";

import { Plus } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import type { NoteItem, Label } from "../types";
import { useLabels } from "@/features/notes/hooks/useLabels";

interface SidebarProps {
  notes: NoteItem[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onOpenAddSubnote?: (parentId: string, e: React.MouseEvent) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({
  selectedNoteId,
  onSelectNote,
  onOpenAddSubnote,
}: SidebarProps) {
  const { userId } = useAuth();

  const { data: labels = [], isLoading } = useLabels(userId);

  return (
    <aside className="absolute top-20 bottom-6 left-6 z-30 flex w-64 flex-col bg-secondary rounded-2xl overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Loading labels...
          </div>
        ) : (
          <nav className="flex flex-col gap-1">
            {labels.map((label: Label) => {
              const labelId = label.id;

              return (
                <div key={labelId} className="flex flex-col">
                  <div className="group flex h-[52px] items-center justify-between rounded-[10px] pl-4 pr-2 transition-colors text-muted-foreground hover:bg-muted">
                    <div className="flex flex-1 h-full items-center gap-2 overflow-hidden text-left text-sm">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: label.color || "currentColor",
                        }}
                      />
                      <span className="truncate">{label.name}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddSubnote?.(labelId, e);
                        }}
                        className="bg-primary rounded-xl text-primary-foreground flex h-10 w-10 items-center justify-center cursor-pointer"
                        aria-label="Add Note"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {labels.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No labels found.
              </div>
            )}
          </nav>
        )}
      </div>
    </aside>
  );
}
