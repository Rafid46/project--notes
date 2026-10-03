"use client";

import { useState, useRef } from "react";
import type { NoteItem, NoteFile } from "@/features/home/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tag,
  Palette,
  MoreVertical,
  Trash,
  Copy,
  Download,
  Bold,
  Italic,
  List,
  ListOrdered,
  Paperclip,
} from "lucide-react";
import CustomColorPicker from "@/components/ui/color-picker";

export interface NoteToolbarProps {
  note: NoteItem;
  onUpdate?: (updates: Partial<NoteItem>) => void;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  onActionClick?: (action: string) => void;
  className?: string;
}

export default function NoteToolbar({
  note,
  onUpdate,
  contentRef,
  onActionClick,
  className = "",
}: NoteToolbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [labels, setLabels] = useState(["Work", "Personal", "Design"]);
  const [newLabel, setNewLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyFormat = (command: string) => {
    if (contentRef?.current) {
      if (
        document.activeElement !== contentRef.current &&
        !contentRef.current.contains(document.activeElement)
      ) {
        contentRef.current.focus();
      }
      document.execCommand(command, false);
      onUpdate?.({ content: contentRef.current.innerHTML });
    }
    onActionClick?.(command);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filesArray = Array.from(selectedFiles);
    const newFiles: NoteFile[] = [];
    let processedCount = 0;

    filesArray.forEach((file) => {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const reader = new FileReader();

      reader.onload = () => {
        newFiles.push({
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          url: typeof reader.result === "string" ? reader.result : URL.createObjectURL(file),
        });
        processedCount++;
        if (processedCount === filesArray.length) {
          onUpdate?.({
            files: [...(note.files || []), ...newFiles],
          });
        }
      };

      reader.onerror = () => {
        newFiles.push({
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          url: URL.createObjectURL(file),
        });
        processedCount++;
        if (processedCount === filesArray.length) {
          onUpdate?.({
            files: [...(note.files || []), ...newFiles],
          });
        }
      };

      if (file.size < 10 * 1024 * 1024) {
        reader.readAsDataURL(file);
      } else {
        newFiles.push({
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          url: URL.createObjectURL(file),
        });
        processedCount++;
        if (processedCount === filesArray.length) {
          onUpdate?.({
            files: [...(note.files || []), ...newFiles],
          });
        }
      }
    });

    e.target.value = "";
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={`flex items-center gap-0.5 bg-card/95 backdrop-blur-md shadow-md border border-border rounded-full p-1 z-40 ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      <button
        type="button"
        title="Bold"
        aria-label="Bold"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          applyFormat("bold");
        }}
        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors outline-none cursor-pointer"
      >
        <Bold size={14} />
      </button>
      <button
        type="button"
        title="Italic"
        aria-label="Italic"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          applyFormat("italic");
        }}
        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors outline-none cursor-pointer"
      >
        <Italic size={14} />
      </button>
      <button
        type="button"
        title="Bullet list"
        aria-label="Bullet list"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          applyFormat("insertUnorderedList");
        }}
        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors outline-none cursor-pointer"
      >
        <List size={14} />
      </button>
      <button
        type="button"
        title="Numbered list"
        aria-label="Numbered list"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          applyFormat("insertOrderedList");
        }}
        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors outline-none cursor-pointer"
      >
        <ListOrdered size={14} />
      </button>

      <div className="w-[1px] h-3.5 bg-border mx-0.5" />

      <button
        type="button"
        title="Attach files"
        aria-label="Attach files"
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors outline-none cursor-pointer"
      >
        <Paperclip size={14} />
      </button>

      <div className="w-[1px] h-3.5 bg-border mx-0.5" />

      <DropdownMenu
        open={isLabelDropdownOpen}
        onOpenChange={setIsLabelDropdownOpen}
      >
        <DropdownMenuTrigger
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={`p-1.5 rounded-full transition-colors cursor-pointer outline-none ${
            isLabelDropdownOpen
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          aria-label="Add label"
        >
          <Tag size={14} />
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
          <Palette size={14} />
        </button>
      </CustomColorPicker>

      <DropdownMenu
        open={isDropdownOpen}
        onOpenChange={setIsDropdownOpen}
      >
        <DropdownMenuTrigger
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors outline-none cursor-pointer"
          aria-label="More options"
        >
          <MoreVertical size={14} />
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
  );
}
