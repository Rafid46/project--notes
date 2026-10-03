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
import CustomColorPicker from "@/components/ui/color-picker";

function getCardTextColor(colorStr?: string): {
  title: string;
  body: string;
  subtext: string;
} {
  if (!colorStr) {
    return {
      title: "text-foreground group-hover:text-blue-600",
      body: "text-muted-foreground",
      subtext: "text-muted-foreground",
    };
  }

  let isDark = false;
  if (colorStr.startsWith("#")) {
    let hex = colorStr.slice(1);
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const num = parseInt(hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    isDark = luma < 140;
  } else if (colorStr.startsWith("hsl")) {
    const match = colorStr.match(/hsl[a]?\([^,]+,[^,]+,\s*([0-9.]+)%/);
    if (match) {
      const l = parseFloat(match[1]);
      isDark = l < 50;
    }
  }

  if (isDark) {
    return {
      title: "text-white font-semibold",
      body: "text-white/85",
      subtext: "text-white/70",
    };
  }

  return {
    title: "text-zinc-900 font-semibold group-hover:text-blue-600",
    body: "text-zinc-700",
    subtext: "text-zinc-600",
  };
}

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
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [labels, setLabels] = useState(["Work", "Personal", "Design"]);
  const [newLabel, setNewLabel] = useState("");

  const textColor = getCardTextColor(note.color);

  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={style}
      className={`relative group ${className} ${
        isDropdownOpen || isLabelDropdownOpen || isColorPickerOpen
          ? "z-50"
          : "hover:z-40 z-10"
      }`}
    >
      <div
        className={`relative w-full h-full transition-all duration-200 hover:-translate-y-0.5 ${
          isSelected
            ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            : "hover:drop-shadow-md"
        }`}
      >
        <motion.div
          layout={!disableLayoutAnimation}
          layoutId={disableLayoutAnimation ? undefined : `note-${note.id}`}
          className={`relative border rounded-2xl p-5 z-0 transition-colors shadow-xs ${
            isSelected ? "border-blue-500 shadow-md" : "border-border/60"
          }`}
          style={{
            backgroundColor: note.color || "var(--card)",
          }}
        >
          {note.category && (
            <div className="absolute top-[-2px] right-[20px] bg-blue-500 text-white px-6 py-4 rounded-none rounded-b-xl text-sm font-semibold z-20 shadow-xs">
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

          <h3
            className={`text-base font-semibold transition-colors ${textColor.title}`}
          >
            {note.title}
          </h3>

          <p
            className={`mt-2 text-sm leading-relaxed line-clamp-4 ${textColor.body}`}
          >
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
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className={`absolute bottom-4 right-4 flex items-center gap-2 transition-opacity bg-card shadow-sm border border-border rounded-full p-1 z-40 ${
              isDropdownOpen || isLabelDropdownOpen || isColorPickerOpen
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
                onPointerDown={(e) => {
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
                side="bottom"
                align="start"
                className="w-56 p-0 flex flex-col overflow-hidden rounded-2xl"
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

            <CustomColorPicker
              value={note.color || "#ffffff"}
              onChange={(newColor) => onUpdate?.({ color: newColor })}
              onOpenChange={setIsColorPickerOpen}
              placement="bottom"
            >
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className={`p-1.5 rounded-full transition-colors cursor-pointer outline-none ${
                  isColorPickerOpen
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                aria-label="Change card color"
                title="Change color"
              >
                <Palette size={16} />
              </button>
            </CustomColorPicker>

            <DropdownMenu
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              <DropdownMenuTrigger
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors outline-none cursor-pointer"
                aria-label="More options"
              >
                <MoreVertical size={16} />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="bottom"
                align="start"
                className="w-36 py-1"
              >
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
