"use client";

import Image from "next/image";
import Link from "next/link";
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
  Search,
  Settings,
  Tag,
  PenLine,
  FolderOpen,
  X,
} from "lucide-react";

import { motion } from "framer-motion";
import type { ViewMode, GridViewMode } from "../types";
import ThemeToggle from "./ThemeToggle";
import SettingsModal from "./SettingsModal";
import AuthButton from "../../auth/components/AuthButton";
import LabelManagerModal from "../../notes/components/LabelManagerModal";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  activeNoteTitle?: string;
  onOpenAddNote?: (e: React.MouseEvent) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  notesCount?: number;
}

const GRID_OPTIONS: {
  id: GridViewMode;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "grid-2",
    label: "2 Columns",
    icon: <Columns2 size={15} />,
  },
  {
    id: "grid-3",
    label: "3 Columns",
    icon: <Columns3 size={15} />,
  },
  {
    id: "grid-4",
    label: "4 Columns",
    icon: <Columns4 size={15} />,
  },
  {
    id: "grid-5",
    label: "5 Columns",
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
        <rect width="3" height="20" x="20" y="3" rx="1" />
      </svg>
    ),
  },
  {
    id: "grid-6",
    label: "6 Columns",
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
  onOpenAddNote,
  searchQuery = "",
  onSearchChange,
  notesCount,
}: HeaderProps) {
  const [isGridDropdownOpen, setIsGridDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
  const [lastSelectedGrid, setLastSelectedGrid] =
    useState<GridViewMode>("grid-4");
  const [isMounted, setIsMounted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
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

  const handleGridTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 10,
      left: rect.left + rect.width / 2,
    });

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
    ? currentView.replace("grid-", "List ")
    : "List";

  const primaryViews: {
    id: "whiteboard" | "masonry";
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
  }[] = [
    {
      id: "whiteboard",
      label: "Whiteboard",
      icon: <Presentation size={15} />,
      isActive: currentView === "whiteboard",
    },
    {
      id: "masonry",
      label: "Gallery",
      icon: <LayoutGrid size={15} />,
      isActive: currentView === "masonry",
    },
  ];

  return (
    <>
      <header className="pointer-events-none absolute top-5 inset-x-0 z-30 flex items-center justify-between gap-3 px-6">
        <div className="pointer-events-auto flex shrink-0 items-center">
          <Link
            href="/"
            aria-label="Hane Notes Home"
            className="flex h-12 items-center rounded-full border border-border/80 bg-background/85 px-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md transition-opacity hover:opacity-80 dark:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.45)]"
          >
            <Image
              src="/assets/hane.png"
              alt="Logo"
              width={92}
              height={36}
              priority
              className="h-7 w-auto object-contain rounded-md"
            />
          </Link>
        </div>

        <nav
          aria-label="Workspace navigation"
          className="pointer-events-auto flex h-12 min-w-0 items-center gap-1 rounded-full border border-border/80 bg-background/85 p-1.5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md dark:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.45)]"
        >
          <div
            className={`group relative flex h-9 items-center rounded-full bg-secondary/75 transition-[width] duration-200 ${
              searchQuery
                ? "w-48 sm:w-56"
                : "w-9 sm:w-40 focus-within:w-52"
            } overflow-hidden`}
          >
            <button
              type="button"
              onClick={() => searchInputRef.current?.focus()}
              aria-label="Search notes"
              className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors group-focus-within:text-foreground hover:text-foreground cursor-pointer"
            >
              <Search size={15} />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search notes..."
              className={`h-full w-full min-w-0 bg-transparent pr-8 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-opacity duration-200 ${
                searchQuery
                  ? "opacity-100"
                  : "opacity-0 sm:opacity-100 group-focus-within:opacity-100"
              }`}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange?.("")}
                aria-label="Clear search"
                className="absolute right-2.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2.5 hidden rounded border border-border/80 bg-background/80 px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground group-focus-within:hidden lg:inline-flex">
                ⌘K
              </kbd>
            )}
          </div>

          <span
            aria-hidden="true"
            className="mx-1 h-4 w-px shrink-0 bg-border"
          />

          <div className="flex items-center gap-0.5">
            {primaryViews.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setIsGridDropdownOpen(false);
                  onSelectView(item.id);
                }}
                aria-pressed={item.isActive}
                className={`relative flex h-9 items-center gap-1.5 rounded-full px-3 text-xs whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  item.isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground font-medium hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {item.isActive && (
                  <motion.span
                    layoutId="header-active-view"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-secondary shadow-xs"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {item.icon}
                  <span className="hidden md:inline">{item.label}</span>
                </span>
              </button>
            ))}

            <button
              type="button"
              data-grid-trigger="true"
              onClick={handleGridTriggerClick}
              aria-expanded={isGridDropdownOpen}
              aria-haspopup="menu"
              className={`relative flex h-9 items-center gap-1.5 rounded-full px-3 text-xs whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isGridActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground font-medium hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {isGridActive && (
                <motion.span
                  layoutId="header-active-view"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-secondary shadow-xs"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Columns3 size={15} />
                <span className="hidden md:inline">{currentGridLabel}</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${
                    isGridDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>
          </div>

          <span
            aria-hidden="true"
            className="mx-1 h-4 w-px shrink-0 bg-border"
          />

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsLabelManagerOpen(true)}
                  aria-label="Manage Labels"
                  className="flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground whitespace-nowrap transition-colors hover:bg-secondary/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  <Tag size={15} />
                  <span className="hidden lg:inline">Labels</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Manage labels</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/board"
                  aria-label="Open Folder Whiteboard"
                  className="flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground whitespace-nowrap transition-colors hover:bg-secondary/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <FolderOpen size={15} />
                  <span className="hidden lg:inline">Folder Board</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Folder Board</TooltipContent>
            </Tooltip>

            <Button
              type="button"
              onClick={onOpenAddNote}
              aria-label="Add Note"
              className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#BBDC12] px-4 text-xs font-semibold text-[#004030] shadow-xs transition-all duration-200 hover:bg-[#BBDC12]/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <PenLine size={15} />
              <span>Note</span>
              {typeof notesCount === "number" && notesCount >= 5 && (
                <span className="rounded-full bg-[#004030]/15 px-1.5 py-0.5 text-[10px] font-semibold">
                  {notesCount}/5
                </span>
              )}
            </Button>
          </div>
        </nav>

        <div className="pointer-events-auto flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-background/85 px-1.5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md dark:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.45)]">
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Settings"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus:outline-none cursor-pointer"
              >
                <Settings size={18} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
          <AuthButton />
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
          document.body,
        )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDefaultViewChange={onSelectView}
      />

      <LabelManagerModal
        isOpen={isLabelManagerOpen}
        onClose={() => setIsLabelManagerOpen(false)}
      />
    </>
  );
}
