"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { NoteItem } from "@/features/home/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  Tag,
  Palette,
  MoreVertical,
  Trash,
  Copy,
  Download,
} from "lucide-react";

interface NoteProps {
  note: NoteItem;
  isSelected?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onUpdate?: (updates: Partial<NoteItem>) => void;
  className?: string;
  style?: React.CSSProperties;
  disableLayoutAnimation?: boolean;
}

export default function Note({
  note,
  isSelected = false,
  onClick,
  onPointerDown,
  onUpdate,
  className = "",
  style,
  disableLayoutAnimation = false,
}: NoteProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
  const [labels, setLabels] = useState(["Work", "Personal", "Design"]);
  const [newLabel, setNewLabel] = useState("");

  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={style}
      className={`relative group ${className} ${
        isDropdownOpen || isLabelDropdownOpen ? "z-50" : "hover:z-40 z-10"
      }`}
    >
      <div
        className={`relative w-full h-full transition-all duration-200 hover:-translate-y-0.5 ${
          isSelected
            ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            : "hover:drop-shadow-md"
        }`}
      >
        {/* Main Body */}
        <motion.div
          layout={!disableLayoutAnimation}
          layoutId={disableLayoutAnimation ? undefined : `note-${note.id}`}
          className={`relative bg-card border rounded-[26px] p-5 z-0 transition-colors ${
            isSelected ? "border-blue-500" : "border-border"
          }`}
        >
          {/* Category Pill */}
          {note.category && (
            <div className="absolute top-[-2px] right-[-2px] bg-blue-400 text-white px-6 py-4 rounded-[26px] rounded-tr-[24px] text-sm font-semibold z-20">
              {note.category}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            {note.parentId && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Subnote
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-foreground group-hover:text-blue-600 transition-colors">
            {note.title}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-4">
            {note.content}
          </p>

          {note.subNotes && note.subNotes.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
              <ChevronRight size={12} />
              <span>
                {note.subNotes.length} subnote
                {note.subNotes.length > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Hover Toolbar */}
          <div
            className={`absolute bottom-4 right-4 flex items-center gap-2 transition-opacity bg-card shadow-sm border border-border rounded-full p-1 z-40 ${
              isDropdownOpen || isLabelDropdownOpen
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <DropdownMenu
              open={isLabelDropdownOpen}
              onOpenChange={setIsLabelDropdownOpen}
            >
              <DropdownMenuTrigger
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={`p-1.5 rounded-full transition-colors cursor-pointer outline-none ${
                  isLabelDropdownOpen
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                aria-label="Add label"
              >
                <Tag size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-56 p-0 flex flex-col overflow-hidden"
              >
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border shrink-0">
                  Labels
                </div>
                <div className="max-h-40 overflow-y-auto py-1">
                  {labels.map((label) => (
                    <DropdownMenuItem
                      key={label}
                      className="cursor-pointer w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-none border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (note.category === label) {
                          onUpdate?.({ category: undefined });
                        } else {
                          onUpdate?.({ category: label });
                        }
                        setIsLabelDropdownOpen(false);
                      }}
                    >
                      {label}
                      {note.category === label && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
                <div className="p-2 border-t border-border flex items-center gap-2 shrink-0 bg-muted/30">
                  <input
                    type="text"
                    placeholder="New label..."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter" && newLabel.trim()) {
                        e.preventDefault();
                        if (!labels.includes(newLabel.trim())) {
                          setLabels([...labels, newLabel.trim()]);
                        }
                        setNewLabel("");
                      }
                    }}
                    className="flex-1 min-w-0 text-xs px-2 py-1.5 bg-background rounded outline-none text-foreground border border-border focus:border-blue-500 transition-colors"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (newLabel.trim()) {
                        if (!labels.includes(newLabel.trim())) {
                          setLabels([...labels, newLabel.trim()]);
                        }
                        onUpdate?.({ category: newLabel.trim() });
                        setNewLabel("");
                        setIsLabelDropdownOpen(false);
                      }
                    }}
                    className="cursor-pointer text-xs font-medium bg-blue-500 text-white px-2.5 py-1.5 rounded hover:bg-blue-600 transition-colors shrink-0 outline-none"
                  >
                    Add
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="cursor-pointer p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors outline-none"
              aria-label="Change color"
            >
              <Palette size={16} />
            </button>

            <DropdownMenu
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              <DropdownMenuTrigger
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors outline-none cursor-pointer"
                aria-label="More options"
              >
                <MoreVertical size={16} />
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" align="end" className="w-36 py-1">
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                  }}
                >
                  <Trash size={14} />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                  }}
                >
                  <Copy size={14} />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                  }}
                >
                  <Download size={14} />
                  Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
