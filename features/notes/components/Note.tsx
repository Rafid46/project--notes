import type { NoteItem } from "@/features/home/types";
import { ChevronRight } from "lucide-react";

interface NoteProps {
  note: NoteItem;
  isSelected?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function Note({
  note,
  isSelected = false,
  onClick,
  onPointerDown,
  className = "",
  style,
}: NoteProps) {
  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={style}
      className={`group rounded-2xl border bg-[#f8f8f8] p-5 transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/20"
          : "border-zinc-200/80"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: note.color || "#3b82f6" }}
        />
        {note.parentId && (
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
            Subnote
          </span>
        )}
      </div>

      <h3 className="text-base font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors">
        {note.title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-zinc-600 line-clamp-4">
        {note.content}
      </p>

      {note.subNotes && note.subNotes.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-1.5 text-xs text-zinc-500">
          <ChevronRight size={12} />
          <span>
            {note.subNotes.length} subnote
            {note.subNotes.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

export { Note };
