"use client";

import {
  FileText,
  Presentation,
  LayoutGrid,
  Columns2,
  Columns4,
  User,
  Search,
  Plus,
} from "lucide-react";
import Dock from "./dock";
import type { ViewMode, DockItemData } from "../types";
import ProfileMenuButton from "./ProfileMenuButton";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  activeNoteTitle?: string;
  onOpenAddNote?: (e: React.MouseEvent) => void;
}

export default function Header({
  currentView,
  onSelectView,
  activeNoteTitle = "All Notes",
  onOpenAddNote,
}: HeaderProps) {
  const dockItems: DockItemData[] = [
    {
      icon: <Presentation size={16} />,
      label: "Whiteboard",
      onClick: () => onSelectView("whiteboard"),
      isActive: currentView === "whiteboard",
    },
    {
      icon: <LayoutGrid size={16} />,
      label: "Masonry Grid",
      onClick: () => onSelectView("masonry"),
      isActive: currentView === "masonry",
    },
    {
      icon: <Columns2 size={16} />,
      label: "Grid 2",
      onClick: () => onSelectView("grid-2"),
      isActive: currentView === "grid-2",
    },
    {
      icon: <Columns4 size={16} />,
      label: "Grid 4",
      onClick: () => onSelectView("grid-4"),
      isActive: currentView === "grid-4",
    },
  ];

  return (
    <header className="absolute top-6 inset-x-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center">
        <div className="flex h-10 items-center gap-2.5 rounded-full bg-secondary px-4 shadow-xs">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background">
            <FileText size={13} />
          </div>
          <span className="text-sm font-semibold text-secondary-foreground">
            Notes
          </span>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="group relative flex h-[52px] items-center justify-start rounded-full bg-secondary shadow-xs transition-all duration-300 hover:w-64 focus-within:w-64 w-[52px] overflow-hidden">
          <button
            type="button"
            aria-label="Search"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search size={18} />
          </button>
          <input
            type="text"
            placeholder="Search notes..."
            className="h-full w-full bg-transparent px-2 text-sm text-foreground placeholder-muted-foreground outline-none opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
          />
        </div>

        <Dock items={dockItems} />

        <button
          type="button"
          onClick={onOpenAddNote}
          aria-label="Add Note"
          className="flex w-fit h-[52px] items-center justify-center gap-2 px-6 rounded-full bg-primary text-primary-foreground shadow-xs transition-colors hover:opacity-80 focus:outline-none cursor-pointer"
        >
          <Plus size={18} />
          <span className="text-sm font-semibold">Note</span>
        </button>
      </div>

      <div className="flex items-center gap-2 pointer-events-auto">
        <ThemeToggle />
        <button
          type="button"
          aria-label="User Profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
        >
          <User size={18} />
        </button>
        {/* <ProfileMenuButton /> */}
      </div>
    </header>
  );
}
