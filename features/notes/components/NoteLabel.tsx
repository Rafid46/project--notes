import { NoteItem } from "@/features/home/types";

const NoteLabel = ({ note }: { note: NoteItem }) => {
  const labels = Array.from(
    new Set([
      ...(note.labels || []),
      ...(note.category ? [note.category] : []),
    ].filter(Boolean))
  );

  if (labels.length === 0) return null;

  if (labels.length > 1) {
    return (
      <div className="absolute top-2.5 right-3 flex flex-wrap gap-1.5 justify-end max-w-[65%] z-20 pointer-events-none">
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
    <div className="absolute top-0 right-[20px] px-6 py-4 rounded-none rounded-b-xl text-sm font-semibold z-20 shadow-xs bg-[var(--sidebar-fg)] text-[var(--sidebar-bg)] dark:bg-[var(--sidebar-bg)] dark:text-[var(--sidebar-fg)]">
      {labels[0]}
    </div>
  );
};

export default NoteLabel;
