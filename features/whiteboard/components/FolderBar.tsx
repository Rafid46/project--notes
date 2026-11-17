"use client";

import { useEffect, useRef, useState } from "react";
import {
  FolderOpen,
  RefreshCw,
  X,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  Layers,
  ArrowUpDown,
  LayoutGrid,
  Check,
  Loader2,
  RotateCw,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { BoardFileFilter, BoardFileSort } from "../types";

interface FolderCounts {
  all: number;
  image: number;
  video: number;
  audio: number;
  file: number;
}

interface FolderBarProps {
  folderName: string | null;
  savedFolderName: string | null;
  isLoading: boolean;
  canRefresh: boolean;
  activeFilter: BoardFileFilter;
  sortBy: BoardFileSort;
  counts: FolderCounts;
  onPickFolder: () => void;
  onFallbackFilesSelected: (files: FileList) => void;
  onReconnectSaved: () => void;
  onRefreshFolder: () => void;
  onClearFolder: () => void;
  onFilterChange: (filter: BoardFileFilter) => void;
  onSortChange: (sort: BoardFileSort) => void;
  onArrangeVisible: () => void;
  className?: string;
}

const SORT_OPTIONS: { id: BoardFileSort; label: string }[] = [
  { id: "type", label: "Type" },
  { id: "name", label: "Name" },
  { id: "newest", label: "Newest" },
  { id: "size", label: "Size" },
];

export default function FolderBar({
  folderName,
  savedFolderName,
  isLoading,
  canRefresh,
  activeFilter,
  sortBy,
  counts,
  onPickFolder,
  onFallbackFilesSelected,
  onReconnectSaved,
  onRefreshFolder,
  onClearFolder,
  onFilterChange,
  onSortChange,
  onArrangeVisible,
  className,
}: FolderBarProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fallbackInputRef.current) {
      fallbackInputRef.current.setAttribute("webkitdirectory", "");
      fallbackInputRef.current.setAttribute("directory", "");
    }
  }, []);

  useEffect(() => {
    if (!isSortOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isSortOpen]);

  const handleOpenClick = () => {
    if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
      onPickFolder();
    } else {
      fallbackInputRef.current?.click();
    }
  };

  const filterTabs: {
    id: BoardFileFilter;
    label: string;
    count: number;
    icon: React.ReactNode;
  }[] = [
    { id: "all", label: "All", count: counts.all, icon: <Layers size={14} /> },
    {
      id: "image",
      label: "Images",
      count: counts.image,
      icon: <ImageIcon size={14} />,
    },
    {
      id: "video",
      label: "Videos",
      count: counts.video,
      icon: <Film size={14} />,
    },
    ...(counts.audio > 0
      ? [
          {
            id: "audio" as const,
            label: "Audio",
            count: counts.audio,
            icon: <Music size={14} />,
          },
        ]
      : []),
    {
      id: "file",
      label: "Files",
      count: counts.file,
      icon: <FileText size={14} />,
    },
  ];

  const activeSortLabel =
    SORT_OPTIONS.find((opt) => opt.id === sortBy)?.label || "Type";

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className={
        className ||
        "fixed bottom-5 left-6 z-40 flex flex-wrap items-center gap-2 max-w-[calc(100vw-380px)]"
      }
    >
      <input
        ref={fallbackInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFallbackFilesSelected(e.target.files);
          }
          e.target.value = "";
        }}
      />

      {/* {!folderName ? (
        <div className="flex h-11 items-center gap-1.5 rounded-full border border-border/80 bg-background/85 px-1.5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md text-xs font-medium text-foreground dark:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.45)]">
          <button
            type="button"
            onClick={handleOpenClick}
            disabled={isLoading}
            className="flex h-8 items-center gap-2 rounded-full bg-[#BBDC12] px-3.5 font-semibold text-[#004030] transition-all hover:bg-[#BBDC12]/90 active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FolderOpen size={14} />
            )}
            <span>Open Folder</span>
          </button>

          {savedFolderName && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onReconnectSaved}
                  disabled={isLoading}
                  className="flex h-8 items-center gap-1.5 rounded-full px-3 text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-colors cursor-pointer"
                >
                  <RotateCw size={13} />
                  <span className="max-w-[140px] truncate">{savedFolderName}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Reconnect last folder</TooltipContent>
            </Tooltip>
          )}
        </div>
      ) : (
        <>
          <div className="flex h-11 items-center gap-1 rounded-full border border-border/80 bg-background/85 px-1.5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md text-xs font-medium text-foreground dark:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.45)]">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleOpenClick}
                  className="flex h-8 items-center gap-1.5 rounded-full px-3 font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  <FolderOpen size={14} className="text-[#7e9800] dark:text-[#BBDC12] shrink-0" />
                  <span className="max-w-[130px] truncate">{folderName}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Switch folder</TooltipContent>
            </Tooltip>

            {canRefresh && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onRefreshFolder}
                    disabled={isLoading}
                    aria-label="Refresh folder"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                  >
                    <RefreshCw
                      size={14}
                      className={isLoading ? "animate-spin" : ""}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Refresh folder</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onClearFolder}
                  aria-label="Close folder"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Unload folder</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex h-11 items-center gap-0.5 rounded-full border border-border/80 bg-background/85 px-1.5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md text-xs font-medium dark:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.45)]">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onFilterChange(tab.id)}
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3 transition-colors cursor-pointer ${
                    isActive
                      ? "bg-secondary text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                      isActive
                        ? "bg-foreground text-background font-semibold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex h-11 items-center gap-1 rounded-full border border-border/80 bg-background/85 px-1.5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md text-xs font-medium dark:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.45)]">
            <div ref={sortRef} className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen((prev) => !prev)}
                className="flex h-8 items-center gap-1.5 rounded-full px-3 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowUpDown size={13} />
                <span>Sort: {activeSortLabel}</span>
              </button>

              {isSortOpen && (
                <div className="absolute bottom-12 left-0 z-50 w-36 rounded-2xl border border-border bg-popover/95 p-1.5 shadow-xl backdrop-blur-md">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onSortChange(opt.id);
                        setIsSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        sortBy === opt.id
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.id && <Check size={13} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span aria-hidden="true" className="h-4 w-px bg-border" />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onArrangeVisible}
                  className="flex h-8 items-center gap-1.5 rounded-full px-3 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                >
                  <LayoutGrid size={13} />
                  <span>Arrange</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Arrange visible files neatly</TooltipContent>
            </Tooltip>
          </div>
        </>
      )} */}
    </div>
  );
}
