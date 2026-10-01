"use client";

import Dock from "./dock";
import ViewDropdown from "./view-dropdown";
import type { ViewMode, DockItemData } from "../types";

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  activeNoteTitle?: string;
}

export default function Header({
  currentView,
  onSelectView,
  activeNoteTitle = "All Notes",
}: HeaderProps) {
  const dockItems: DockItemData[] = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 3h20" />
          <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
          <path d="m7 21 5-5 5 5" />
        </svg>
      ),
      label: "Whiteboard",
      onClick: () => onSelectView("whiteboard"),
      className: currentView === "whiteboard" ? "ring-2 ring-white" : "",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="7" height="13" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
          <rect width="7" height="13" x="14" y="8" rx="1" />
        </svg>
      ),
      label: "Masonry Grid",
      onClick: () => onSelectView("masonry"),
      className: currentView === "masonry" ? "ring-2 ring-white" : "",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="7" height="18" x="3" y="3" rx="1" />
          <rect width="7" height="18" x="14" y="3" rx="1" />
        </svg>
      ),
      label: "Grid 2",
      onClick: () => onSelectView("grid-2"),
      className: currentView === "grid-2" ? "ring-2 ring-white" : "",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="4" height="18" x="2" y="3" rx="1" />
          <rect width="4" height="18" x="8" y="3" rx="1" />
          <rect width="4" height="18" x="14" y="3" rx="1" />
          <rect width="4" height="18" x="20" y="3" rx="1" />
        </svg>
      ),
      label: "Grid 4",
      onClick: () => onSelectView("grid-4"),
      className: currentView === "grid-4" ? "ring-2 ring-white" : "",
    },
  ];

  return (
    <header className="relative flex h-20 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {activeNoteTitle}
        </h1>
      </div>

      <div className="flex items-center justify-center">
        <Dock
          items={dockItems}
          panelHeight={68}
          baseItemSize={50}
          magnification={70}
        />
      </div>

      <div className="flex items-center gap-3">
        <ViewDropdown currentView={currentView} onSelectView={onSelectView} />
      </div>
    </header>
  );
}
