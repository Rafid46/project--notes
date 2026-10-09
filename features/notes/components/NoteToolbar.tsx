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
  Plus,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CustomColorPicker from "@/components/common/ColorPicker";
import { useLabels, useCreateLabel } from "@/features/notes/hooks/useLabels";

const TEXT_COLORS: { label: string; value?: string; previewColor: string }[] = [
  { label: "Default", value: undefined, previewColor: "var(--card)" },
  { label: "Dark", value: "#09090b", previewColor: "#09090b" },
  { label: "Light", value: "#f8fafc", previewColor: "#f8fafc" },
  { label: "Blue", value: "#2563eb", previewColor: "#2563eb" },
  { label: "Purple", value: "#7c3aed", previewColor: "#7c3aed" },
  { label: "Emerald", value: "#059669", previewColor: "#059669" },
  { label: "Amber", value: "#d97706", previewColor: "#d97706" },
  { label: "Red", value: "#dc2626", previewColor: "#dc2626" },
];

interface ToolbarButtonConfig {
  label: string;
  icon: typeof Bold;
  format?: string;
}

const TOOLBAR_BUTTONS: {
  text: ToolbarButtonConfig[];
  lists: ToolbarButtonConfig[];
  actions: {
    attach: ToolbarButtonConfig;
    labels: ToolbarButtonConfig;
    color: ToolbarButtonConfig;
    more: ToolbarButtonConfig;
  };
  moreMenu: ToolbarButtonConfig[];
} = {
  text: [
    { label: "Bold", format: "bold", icon: Bold },
    { label: "Italic", format: "italic", icon: Italic },
  ],
  lists: [
    { label: "Bullet list", format: "insertUnorderedList", icon: List },
    { label: "Numbered list", format: "insertOrderedList", icon: ListOrdered },
  ],
  actions: {
    attach: { label: "Attach files", icon: Paperclip },
    labels: { label: "Labels", icon: Tag },
    color: { label: "Note color", icon: Palette },
    more: { label: "More options", icon: MoreVertical },
  },
  moreMenu: [
    { label: "Delete", icon: Trash },
    { label: "Copy", icon: Copy },
    { label: "Export", icon: Download },
  ],
};

export interface NoteToolbarProps {
  note: NoteItem;
  onUpdate?: (updates: Partial<NoteItem>) => void;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  onActionClick?: (action: string) => void;
  className?: string;
  isModal?: boolean;
}

export default function NoteToolbar({
  note,
  onUpdate,
  contentRef,
  onActionClick,
  className = "",
  isModal = false,
}: NoteToolbarProps) {
  const showFormatting = isModal || Boolean(contentRef);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isTextColorOpen, setIsTextColorOpen] = useState(false);
  const { data: serverLabels = [] } = useLabels();
  const createLabelMutation = useCreateLabel();
  const [newLabel, setNewLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextColorChange = (color?: string) => {
    if (contentRef?.current) {
      const selection = window.getSelection();
      if (
        selection &&
        !selection.isCollapsed &&
        contentRef.current.contains(selection.anchorNode)
      ) {
        document.execCommand("foreColor", false, color || "inherit");
        onUpdate?.({ content: contentRef.current.innerHTML });
        return;
      }
    }
    onUpdate?.({ textColor: color });
  };

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

  const renderFormatButton = (btn: ToolbarButtonConfig) => {
    const Icon = btn.icon;
    return (
      <Tooltip key={btn.format}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={btn.label}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (btn.format) applyFormat(btn.format);
            }}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors outline-none cursor-pointer"
          >
            <Icon size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{btn.label}</TooltipContent>
      </Tooltip>
    );
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
          url:
            typeof reader.result === "string"
              ? reader.result
              : URL.createObjectURL(file),
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
    <TooltipProvider delay={200}>
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

        {showFormatting && (
          <>
            {TOOLBAR_BUTTONS.text.map(renderFormatButton)}

            <DropdownMenu
              open={isTextColorOpen}
              onOpenChange={setIsTextColorOpen}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`p-2 rounded-full transition-colors cursor-pointer outline-none ${
                      isTextColorOpen
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    aria-label="Text color"
                  >
                    <div className="relative flex flex-col items-center justify-center w-3.5 h-3.5">
                      <span className="text-xs font-bold leading-none">A</span>
                      <span
                        className="w-3 h-[2px] rounded-full mt-0.5"
                        style={{
                          backgroundColor: note.textColor || "currentColor",
                        }}
                      />
                    </div>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">Text color</TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                side="bottom"
                align="start"
                className="p-2.5 flex flex-col gap-2 rounded-2xl shadow-xl w-auto min-w-[200px]"
              >
                <div className="text-[11px] font-semibold text-muted-foreground px-0.5">
                  Text Color
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {TEXT_COLORS.map((c) => (
                    <Tooltip key={c.label}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTextColorChange(c.value);
                            setIsTextColorOpen(false);
                          }}
                          className={`w-6 h-6 rounded-full border transition-all hover:scale-110 flex items-center justify-center cursor-pointer ${
                            (note.textColor || "") === (c.value || "")
                              ? "border border-primary"
                              : "border-border/80"
                          }`}
                          style={{ backgroundColor: c.previewColor }}
                        >
                          {!c.value && (
                            <span className="text-[10px] font-bold text-foreground">
                              A
                            </span>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{c.label}</TooltipContent>
                    </Tooltip>
                  ))}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-6 h-6 rounded-full border border-border/80 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform overflow-hidden hover:bg-muted"
                      >
                        <Palette
                          size={13}
                          className="text-muted-foreground pointer-events-none"
                        />
                        <input
                          type="color"
                          value={note.textColor || "#000000"}
                          onChange={(e) => {
                            handleTextColorChange(e.target.value);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>Custom color</TooltipContent>
                  </Tooltip>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {TOOLBAR_BUTTONS.lists.map(renderFormatButton)}

            <div className="w-[1px] h-3.5 bg-border mx-0.5" />
          </>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Attach files"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors outline-none cursor-pointer"
            >
              <Paperclip size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Attach files</TooltipContent>
        </Tooltip>

        <div className="w-[1px] h-3.5 bg-border mx-0.5" />

        <DropdownMenu
          open={isLabelDropdownOpen}
          onOpenChange={setIsLabelDropdownOpen}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className={`p-2 rounded-full transition-colors cursor-pointer outline-none ${
                  isLabelDropdownOpen
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                aria-label="Labels"
              >
                <Tag size={14} />
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Labels</TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            side="bottom"
            align="start"
            className="w-76 p-0 flex flex-col overflow-hidden rounded-2xl"
          >
            <div className="px-4 py-2 pt-4 text-xs font-semibold text-muted-foreground border-b border-border shrink-0">
              Labels
            </div>
            <div className="max-h-40 overflow-y-auto py-1">
              {serverLabels.map((label) => (
                <DropdownMenuItem
                  key={label.id}
                  className="cursor-pointer w-full flex items-center justify-between px-4 py-1.5 text-sm rounded-none border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (note.category === label.name) {
                      onUpdate?.({
                        category: null as any,
                        labelId: null as any,
                      });
                    } else {
                      onUpdate?.({ category: label.name, labelId: label.id });
                    }
                    setIsLabelDropdownOpen(false);
                  }}
                >
                  {label.name}
                  {note.category === label.name && (
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
                    if (!serverLabels.find((l) => l.name === newLabel.trim())) {
                      createLabelMutation.mutate(
                        { name: newLabel.trim() },
                        {
                          onSuccess: (data) => {
                            const createdLabel = data.label || data;
                            onUpdate?.({
                              category: newLabel.trim(),
                              labelId: createdLabel.id,
                            });
                          },
                        },
                      );
                    } else {
                      const existingLabel = serverLabels.find(
                        (l) => l.name === newLabel.trim(),
                      );
                      if (existingLabel) {
                        onUpdate?.({
                          category: existingLabel.name,
                          labelId: existingLabel.id,
                        });
                      }
                    }
                    setNewLabel("");
                  }
                }}
                className="flex-1 min-w-0 text-sm px-4 py-2 bg-background rounded-lg outline-none text-foreground border border-border focus:border-blue-500 transition-colors"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (newLabel.trim()) {
                    if (!serverLabels.find((l) => l.name === newLabel.trim())) {
                      createLabelMutation.mutate(
                        { name: newLabel.trim() },
                        {
                          onSuccess: (data) => {
                            const createdLabel = data.label || data;
                            onUpdate?.({
                              category: newLabel.trim(),
                              labelId: createdLabel.id,
                            });
                          },
                        },
                      );
                    } else {
                      const existingLabel = serverLabels.find(
                        (l) => l.name === newLabel.trim(),
                      );
                      if (existingLabel) {
                        onUpdate?.({
                          category: existingLabel.name,
                          labelId: existingLabel.id,
                        });
                      }
                    }
                    setNewLabel("");
                    setIsLabelDropdownOpen(false);
                  }
                }}
                className="flex items-center gap-2 cursor-pointer text-sm font-medium bg-primary/60 text-white px-4 py-2 rounded-lg hover:bg-primary/55  transition-colors shrink-0 outline-none"
              >
                <Plus size={14} />
                Create
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <CustomColorPicker
              value={note.color || "#ffffff"}
              onChange={(newColor) => onUpdate?.({ color: newColor })}
              onOpenChange={setIsColorPickerOpen}
              placement="top"
              className="flex items-center justify-center"
            >
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className={`p-2 rounded-full transition-colors cursor-pointer outline-none ${
                  isColorPickerOpen
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                aria-label="Change card color"
              >
                <Palette size={14} />
              </button>
            </CustomColorPicker>
          </TooltipTrigger>
          <TooltipContent side="top">Note color</TooltipContent>
        </Tooltip>

        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors outline-none cursor-pointer"
                aria-label="More options"
              >
                <MoreVertical size={14} />
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">More options</TooltipContent>
          </Tooltip>

          <DropdownMenuContent
            side="bottom"
            align="start"
            className="w-36 py-1"
          >
            {TOOLBAR_BUTTONS.moreMenu.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.label}
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                  }}
                >
                  <Icon size={14} />
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
