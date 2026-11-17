"use client";

import { useRef, useEffect } from "react";
import { Plus, Lightbulb, Archive, Trash2, Tag } from "lucide-react";
import type { NoteItem, Label } from "../types";
import { useInfiniteLabels } from "@/features/notes/hooks/useLabels";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface SidebarProps {
  notes?: NoteItem[];
  selectedNoteId?: string | null;
  onSelectNote?: (noteId: string) => void;
  onOpenAddSubnote?: (parentId: string, e: React.MouseEvent) => void;
  onOpenAddNoteWithLabel?: (
    labelId: string,
    labelName: string,
    e: React.MouseEvent,
  ) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  selectedLabel?: Label | null;
  onSelectLabel?: (label: Label | null) => void;
}

export default function Sidebar({
  onOpenAddNoteWithLabel,
  selectedLabel,
  onSelectLabel,
}: SidebarProps) {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteLabels({
      limit: 15,
    });

  const labels = data?.pages.flatMap((page) => page.labels) || [];
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <aside
      aria-label="Workspace sidebar"
      className="absolute top-21 bottom-6 left-6 z-30 hidden md:flex w-64 flex-col rounded-3xl border border-border/80 bg-background/85 backdrop-blur-md shadow-[0_8px_32px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_36px_-12px_rgba(0,0,0,0.5)] overflow-hidden p-3"
    >
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => onSelectLabel?.(null)}
          className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors cursor-pointer ${
            !selectedLabel
              ? "bg-secondary text-foreground font-semibold shadow-2xs"
              : "text-muted-foreground font-medium hover:bg-secondary/60 hover:text-foreground"
          }`}
        >
          <Lightbulb size={17} />
          <span>All Notes</span>
        </button>
      </div>

      <div className="mt-4 mb-1.5 px-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase text-muted-foreground/80">
          Labels
        </span>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scrollbar">
        {isLoading ? (
          <div className="flex flex-col gap-1 py-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex h-10 items-center gap-3 rounded-xl px-3 bg-muted/40 animate-pulse"
              >
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-muted-foreground/20" />
                <div
                  className="h-3 rounded-md bg-muted-foreground/20"
                  style={{ width: `${45 + ((i * 12) % 35)}%` }}
                />
              </div>
            ))}
          </div>
        ) : labels.length === 0 ? (
          <div className="my-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-secondary/30 px-4 py-5 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#BBDC12]/25 text-[#495a00] dark:text-[#BBDC12]">
              <Tag size={15} />
            </div>
            <p className="mt-2 text-xs font-semibold text-foreground">
              No labels yet
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Organize your notes by adding labels from the Labels menu above.
            </p>
          </div>
        ) : (
          <nav aria-label="Labels" className="flex flex-col gap-0.5">
            {labels.map((label: Label) => {
              const labelId = label.id;
              const isSelected = selectedLabel?.id === labelId;

              return (
                <div
                  key={labelId}
                  onClick={() => onSelectLabel?.(isSelected ? null : label)}
                  className={`group flex h-10 items-center justify-between rounded-xl pl-3 pr-1.5 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-secondary text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground font-medium hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <div className="flex flex-1 h-full items-center gap-3 overflow-hidden text-left text-sm">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                      style={{
                        backgroundColor: label.color || "currentColor",
                      }}
                    />
                    <span className="truncate">{label.name}</span>
                  </div>

                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAddNoteWithLabel?.(labelId, label.name, e);
                          }}
                          aria-label={`Add note to ${label.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#BBDC12] text-[#004030] shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Plus size={15} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Add Note</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
            <div ref={sentinelRef} className="h-4 w-full shrink-0" />
          </nav>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-border/70 flex flex-col gap-0.5">
        <div className="flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground cursor-pointer">
          <Archive size={16} />
          <span>Archive</span>
        </div>
        <div className="flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground cursor-pointer">
          <Trash2 size={16} />
          <span>Bin</span>
        </div>
      </div>
    </aside>
  );
}
