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
  const [error, setError] = useState("");

  const popoverRef = useRef<HTMLDivElement>(null);

  // Keep refs for the latest values so the click-outside listener can access them
  const stateRef = useRef({ title, content, color });
  useEffect(() => {
    stateRef.current = { title, content, color };
  }, [title, content, color]);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setContent("");
      setColor(COLORS[0]);
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
      } = stateRef.current;

      if (currentTitle.trim() || currentContent.trim()) {
        onSave({
          title: currentTitle.trim() || "Untitled Note",
          content: currentContent,
          color: currentColor,
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
      className="absolute top-[96px] left-1/2 z-50 -translate-x-1/2 flex w-[600px] flex-col rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-200"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0 transition-colors"
          style={{ backgroundColor: color }}
        />
        {parentId && (
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
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
        className="w-full text-base font-semibold text-zinc-900 placeholder-zinc-400 outline-none bg-transparent"
      />

      <textarea
        placeholder="Take a note... (Enter to save, Shift+Enter for newline)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleContentKeyDown}
        rows={4}
        className="mt-2 w-full text-sm leading-relaxed text-zinc-600 placeholder-zinc-400 outline-none resize-none bg-transparent"
      />

      {error && (
        <span className="mt-2 text-xs text-red-500 shrink-0">{error}</span>
      )}

      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between shrink-0">
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
            className="rounded p-1 hover:bg-zinc-100 hover:text-zinc-600 transition-colors cursor-pointer"
            aria-label="Add image"
          >
            <ImageIcon size={22} />
          </button>
          <button
            className="rounded p-1 hover:bg-zinc-100 hover:text-zinc-600 transition-colors cursor-pointer"
            aria-label="Add label"
          >
            <Tag size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
