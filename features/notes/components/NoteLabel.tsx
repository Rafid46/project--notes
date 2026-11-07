import { NoteItem } from "@/features/home/types";

interface NoteLabelProps {
  note: NoteItem;
  variant?: "badge" | "inline";
  className?: string;
}

const NoteLabel = ({ note, variant = "badge", className }: NoteLabelProps) => {
  const labels = Array.from(
    new Set(
      [
        ...(note.labels || []),
        ...(note.category ? [note.category] : []),
      ].filter(Boolean),
    ),
  );

  if (labels.length === 0) return null;

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {labels.map((label) => (
          <span
            key={label}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-xs bg-[var(--sidebar-fg)] text-[var(--sidebar-bg)] dark:bg-[var(--sidebar-bg)] dark:text-[var(--sidebar-fg)]"
          >
            {label}
          </span>
        ))}
      </div>
    );
  }

  if (labels.length > 2) {
    return (
      <div
        className={`flex flex-wrap gap-1.5 justify-end max-w-[65%] z-20 pointer-events-none ${
          className ?? "absolute top-2.5 right-3"
        }`}
      >
        {labels.map((label) => (
          <span
            key={label}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold shadow-xs bg-[var(--sidebar-fg)] text-[var(--sidebar-bg)] dark:bg-[var(--sidebar-bg)] dark:text-[var(--sidebar-fg)]"
          >
            {label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-2 z-20 ${
        className ?? "absolute top-0 right-[20px]"
      }`}
    >
      {labels.map((label) => (
        <div
          key={label}
          className="w-fit px-2 py-1 pb-2 pt-0 rounded-none rounded-b-xl text-sm font-semibold shadow-xs bg-[var(--sidebar-fg)] text-[var(--sidebar-bg)] dark:bg-[var(--sidebar-bg)] dark:text-[var(--sidebar-fg)]"
        >
          <div className="rounded-b-md rounded-t-none border-t-0 border-dashed border border-black/30 px-4 py-2">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NoteLabel;
