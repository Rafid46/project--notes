"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Presentation,
  LayoutGrid,
  Columns2,
  Columns3,
  Columns4,
  Check,
  ChevronDown,
  User,
  Search,
  Plus,
  Settings,
} from "lucide-react";
import Dock from "./dock";
import type { ViewMode, GridViewMode, DockItemData } from "../types";
import ThemeToggle from "./ThemeToggle";
import SettingsModal from "./settings-modal";

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  activeNoteTitle?: string;
  onOpenAddNote?: (e: React.MouseEvent) => void;
}

const GRID_OPTIONS: {
  id: GridViewMode;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "grid-2",
    label: "Grid 2",
    icon: <Columns2 size={15} />,
  },
  {
    id: "grid-3",
    label: "Grid 3",
    icon: <Columns3 size={15} />,
  },
  {
    id: "grid-4",
    label: "Grid 4",
    icon: <Columns4 size={15} />,
  },
  {
    id: "grid-5",
    label: "Grid 5",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="3" height="18" x="2" y="3" rx="1" />
        <rect width="3" height="18" x="6.5" y="3" rx="1" />
        <rect width="3" height="18" x="11" y="3" rx="1" />
        <rect width="3" height="18" x="15.5" y="3" rx="1" />
        <rect width="3" height="18" x="20" y="3" rx="1" />
      </svg>
    ),
  },
  {
    id: "grid-6",
    label: "Grid 6",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="2.2" height="18" x="2" y="3" rx="0.5" />
        <rect width="2.2" height="18" x="5.8" y="3" rx="0.5" />
        <rect width="2.2" height="18" x="9.6" y="3" rx="0.5" />
        <rect width="2.2" height="18" x="13.4" y="3" rx="0.5" />
        <rect width="2.2" height="18" x="17.2" y="3" rx="0.5" />
        <rect width="2.2" height="18" x="21" y="3" rx="0.5" />
      </svg>
    ),
  },
];

export default function Header({
  currentView,
  onSelectView,
  activeNoteTitle = "All Notes",
  onOpenAddNote,
}: HeaderProps) {
  const [isGridDropdownOpen, setIsGridDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastSelectedGrid, setLastSelectedGrid] = useState<GridViewMode>("grid-4");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isGridActive = currentView.startsWith("grid-");

  useEffect(() => {
    if (isGridActive) {
      setLastSelectedGrid(currentView as GridViewMode);
    }
  }, [currentView, isGridActive]);

  useEffect(() => {
    if (!isGridDropdownOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        !target.closest("[data-grid-menu]") &&
        !target.closest("[data-grid-trigger]")
      ) {
        setIsGridDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsGridDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isGridDropdownOpen]);

  const handleGridDockItemClick = (e?: React.MouseEvent<Element> | React.KeyboardEvent<Element>) => {
    if (e && "currentTarget" in e && e.currentTarget) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }

    if (!isGridActive) {
      onSelectView(lastSelectedGrid);
    }
    setIsGridDropdownOpen((prev) => !prev);
  };

  const handleSelectGridOption = (gridId: GridViewMode) => {
    setLastSelectedGrid(gridId);
    onSelectView(gridId);
    setIsGridDropdownOpen(false);
  };

  const currentGridLabel = isGridActive
    ? currentView.replace("grid-", "Grid ")
    : "Grid";

  const dockItems: DockItemData[] = [
    {
      icon: <Presentation size={16} />,
      label: "Whiteboard",
      onClick: () => {
        setIsGridDropdownOpen(false);
        onSelectView("whiteboard");
      },
      isActive: currentView === "whiteboard",
    },
    {
      icon: <LayoutGrid size={16} />,
      label: "Masonry",
      onClick: () => {
        setIsGridDropdownOpen(false);
        onSelectView("masonry");
      },
      isActive: currentView === "masonry",
    },
    {
      icon: <Columns3 size={16} />,
      label: (
        <span
          data-grid-trigger="true"
          className="inline-flex items-center gap-1.5"
        >
          <span>{currentGridLabel}</span>
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 ${
              isGridDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      ),
      onClick: handleGridDockItemClick,
      isActive: isGridActive,
      className: "relative",
    },
  ];

  return (
    <>
      <header className="absolute top-6 inset-x-0 z-30 flex items-center justify-between px-6">
        <div className="flex items-center">
          <div className="flex h-10 items-center gap-2.5 pb-4 px-4">
            <Image
              src="/assets/hane.png"
              alt="Logo"
              width={104}
              height={44}
              className="object-contain"
            />
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
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus:outline-none cursor-pointer"
          >
            <Settings size={18} />
          </button>
          <button
            type="button"
            aria-label="User Profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
          >
            <User size={18} />
          </button>
        </div>
      </header>

      {isMounted &&
        isGridDropdownOpen &&
        dropdownPosition &&
        createPortal(
          <div
            data-grid-menu="true"
            style={{
              position: "fixed",
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              transform: "translateX(-50%)",
            }}
            className="z-50 w-44 rounded-2xl border border-border bg-popover/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-100"
          >
            <div className="px-2.5 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
              Select Columns
            </div>
            <div className="h-px bg-border my-1" />
            <div className="flex flex-col gap-0.5">
              {GRID_OPTIONS.map((option) => {
                const isSelected = currentView === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectGridOption(option.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {option.icon}
                      </span>
                      <span>{option.label}</span>
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDefaultViewChange={onSelectView}
      />
    </>
  );
}
