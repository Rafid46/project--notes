"use client";

import { Plus, Lightbulb, Pencil, Archive, Trash2 } from "lucide-react";
import type { NoteItem, Label } from "../types";
import { useLabels } from "@/features/notes/hooks/useLabels";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface SidebarProps {
  notes: NoteItem[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onOpenAddSubnote?: (parentId: string, e: React.MouseEvent) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ onOpenAddSubnote }: SidebarProps) {
  const { data: labels = [], isLoading } = useLabels();

  return (
    <aside className="absolute top-20 bottom-6 left-6 z-30 flex w-64 flex-col bg-secondary rounded-2xl overflow-hidden py-3">
      {/* Top Section - Notes */}
      <div className="px-3 mb-2 flex flex-col gap-1">
        <div className="flex h-[52px] items-center gap-4 rounded-[10px] pl-4 pr-2 transition-colors cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary font-medium">
          <Lightbulb size={20} />
          <span className="text-sm">Notes</span>
        </div>
      </div>

      {/* Middle Section - Labels */}
      <div className="flex-1 overflow-y-auto px-3">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            {/* Loading labels... */}
          </div>
        ) : (
          <nav className="flex flex-col gap-1">
            {labels.map((label: Label) => {
              const labelId = label.id;

              return (
                <div key={labelId} className="flex flex-col">
                  <div className="group flex h-[52px] items-center justify-between rounded-[10px] pl-4 pr-2 transition-colors text-muted-foreground hover:bg-muted cursor-pointer">
                    <div className="flex flex-1 h-full items-center gap-4 overflow-hidden text-left text-sm">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: label.color || "currentColor",
                        }}
                      />
                      <span className="truncate">{label.name}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddSubnote?.(labelId, e);
                            }}
                            className="transition-all duration-200 ease-in-out hover:scale-105 hover:bg-primary/90 active:scale-95 bg-primary rounded-xl text-primary-foreground flex h-10 w-10 items-center justify-center cursor-pointer shadow-sm"
                          >
                            <Plus size={18} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Add Note</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* {labels.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No labels found.
              </div>
            )} */}
          </nav>
        )}
      </div>

      {/* Bottom Section - Edit labels, Archive, Bin */}
      <div className="mx-3 mt-2 mb-1 p-2 flex flex-col gap-1 bg-background/50 rounded-2xl">
        <div className="flex h-[48px] items-center gap-4 rounded-[10px] pl-4 pr-2 transition-colors text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer font-medium">
          <Archive size={20} />
          <span className="text-sm">Archive</span>
        </div>
        <div className="flex h-[48px] items-center gap-4 rounded-[10px] pl-4 pr-2 transition-colors text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer font-medium">
          <Trash2 size={20} />
          <span className="text-sm">Bin</span>
        </div>
      </div>
    </aside>
  );
}
