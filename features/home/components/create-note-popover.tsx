"use client";

import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Tag, X } from "lucide-react";

interface CreateNotePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: {
    title: string;
    content: string;
    color?: string;
    category?: string;
    parentId: string | null;
  }) => void;
  parentId: string | null;
  anchorRect: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  } | null;
  initialTitle?: string;
}

const COLORS = [
  "#a1a1aa",
  "#f59e0b",
  "#0284c7",
  "#9333ea",
  "#10b981",
  "#ef4444",
];

export default function CreateNotePopover({
  isOpen,
  onClose,
  onSave,
  parentId,
  anchorRect,
  initialTitle = "",
}: CreateNotePopoverProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [category, setCategory] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [labels, setLabels] = useState(["Work", "Personal", "Design"]);
  const [error, setError] = useState("");

  const popoverRef = useRef<HTMLDivElement>(null);

  // Keep refs for the latest values so the click-outside listener can access them
  const stateRef = useRef({ title, content, color, category });
  useEffect(() => {
    stateRef.current = { title, content, color, category };
  }, [title, content, color, category]);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setContent("");
      setColor(COLORS[0]);
      setCategory("");
      setIsCategoryOpen(false);
      setError("");
    }
  }, [isOpen, initialTitle]);

  useEffect(() => {
    if (!isOpen) return;

    const saveAndClose = () => {
      const {
        title: currentTitle,
        content: currentContent,
        color: currentColor,
        category: currentCategory,
      } = stateRef.current;

      if (currentTitle.trim() || currentContent.trim()) {
        onSave({
          title: currentTitle.trim() || "Untitled Note",
          content: currentContent,
          color: currentColor,
          category: currentCategory.trim() || undefined,
          parentId,
        });
      }
      onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        saveAndClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") saveAndClose();
    };

    // Delay attaching the mousedown listener so the click that opens the popover doesn't instantly close it
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, onSave, parentId]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      onClose();
      return;
    }

    setError("");
    onSave({
      title: title.trim() || "Untitled Note",
      content,
      color,
      category: category.trim() || undefined,
      parentId,
    });
    onClose();
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute top-[96px] left-1/2 z-50 -translate-x-1/2 flex w-[600px] flex-col rounded-2xl bg-popover p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10"
    >
      {category && (
        <div className="absolute -top-3 right-6 bg-blue-500 px-4 py-1.5 rounded-2xl text-xs font-bold text-white flex items-center gap-2 z-20 shadow-md">
          {category}
          <button
            onClick={() => setCategory("")}
            className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
            aria-label="Remove category"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0 transition-colors"
          style={{ backgroundColor: color }}
        />
        {parentId && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Subnote
          </span>
        )}
      </div>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleTitleKeyDown}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        className="w-full text-base font-semibold text-foreground placeholder-muted-foreground outline-none bg-transparent"
      />

      <textarea
        placeholder="Take a note... (Enter to save, Shift+Enter for newline)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleContentKeyDown}
        rows={4}
        className="mt-2 w-full text-sm leading-relaxed text-muted-foreground placeholder-muted-foreground outline-none resize-none bg-transparent"
      />

      {error && (
        <span className="mt-2 text-xs text-red-500 shrink-0">{error}</span>
      )}

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
                color === c
                  ? "border-zinc-400 scale-110"
                  : "border-transparent hover:scale-110"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <button
            className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Add image"
          >
            <ImageIcon size={22} />
          </button>
          {/* add label */}
          <button
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className={`rounded p-1 transition-colors cursor-pointer ${
              isCategoryOpen ? "bg-muted text-foreground" : "hover:bg-muted hover:text-foreground"
            }`}
            aria-label="Add label"
          >
            <Tag size={22} />
          </button>
        </div>
      </div>

      {/* Label Section */}
      {isCategoryOpen && (
        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
          <h4 className="text-sm font-medium text-foreground px-1">Labels</h4>
          
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {labels.map(label => (
              <label key={label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={category === label}
                  onChange={() => setCategory(category === label ? "" : label)}
                  className="rounded border-zinc-500 text-blue-500 focus:ring-blue-500 bg-transparent cursor-pointer"
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              placeholder="Create new label..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newLabel.trim()) {
                  e.preventDefault();
                  if (!labels.includes(newLabel.trim())) {
                    setLabels([...labels, newLabel.trim()]);
                  }
                  setCategory(newLabel.trim());
                  setNewLabel("");
                }
              }}
              className="flex-1 text-sm px-3 py-2 bg-muted rounded-lg outline-none text-foreground border border-transparent focus:border-border transition-colors"
            />
            <button
              onClick={() => {
                if (newLabel.trim()) {
                  if (!labels.includes(newLabel.trim())) {
                    setLabels([...labels, newLabel.trim()]);
                  }
                  setCategory(newLabel.trim());
                  setNewLabel("");
                }
              }}
              className="text-sm font-medium bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
