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
  anchorRect: { top: number; left: number; right: number; bottom: number } | null;
}

const COLORS = ["#a1a1aa", "#f59e0b", "#0284c7", "#9333ea", "#10b981", "#ef4444"];

export default function CreateNotePopover({
  isOpen,
  onClose,
  onSave,
  parentId,
  anchorRect,
}: CreateNotePopoverProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState("");

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setContent("");
      setColor(COLORS[0]);
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError("");
    onSave({ title, content, color, parentId });
    onClose();
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        ref={popoverRef}
        onClick={(e) => e.stopPropagation()}
        className="flex w-[600px] h-[300px] flex-col gap-3 rounded-2xl bg-white p-4 shadow-2xl border border-zinc-200"
      >
        <div className="flex items-center justify-between shrink-0">
          <h3 className="text-sm font-semibold text-zinc-900">
            {parentId ? "Add Subnote" : "Add Note"}
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3 flex-1 overflow-hidden">
          <div className="shrink-0">
            <input
              type="text"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <textarea
              placeholder="Note content (Ctrl+Enter to save)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleContentKeyDown}
              className="w-full h-full flex-1 resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 placeholder-zinc-400 outline-none focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all"
            />
          </div>

          {error && <span className="text-xs text-red-500 shrink-0">{error}</span>}

          <div className="flex items-center justify-between mt-1 shrink-0">
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                    color === c ? "border-zinc-400 scale-110" : "border-transparent hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-zinc-400 mr-2">
                <button className="rounded p-1.5 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
                  <ImageIcon size={16} />
                </button>
                <button className="rounded p-1.5 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
                  <Tag size={16} />
                </button>
              </div>
              <button
                onClick={handleSave}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Add note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
