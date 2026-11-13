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

      {!folderName ? (
        <div className="flex h-[50px] items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-2.5 shadow-lg backdrop-blur-md text-xs font-medium text-zinc-700">
          <button
            type="button"
            onClick={handleOpenClick}
            disabled={isLoading}
            className="flex h-9 items-center gap-2 rounded-full bg-zinc-900 px-3.5 text-white transition-transform hover:bg-zinc-800 active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FolderOpen size={15} />
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
                  className="flex h-9 items-center gap-1.5 rounded-full px-3 text-zinc-700 hover:bg-zinc-100 active:scale-95 transition-colors cursor-pointer"
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
          <div className="flex h-[50px] items-center gap-1 rounded-full border border-black/10 bg-white/90 px-2.5 shadow-lg backdrop-blur-md text-xs font-medium text-zinc-700">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleOpenClick}
                  className="flex h-8 items-center gap-1.5 rounded-full px-2.5 font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <FolderOpen size={15} className="text-blue-600 shrink-0" />
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
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
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
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Unload folder</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex h-[50px] items-center gap-1 rounded-full border border-black/10 bg-white/90 px-2 shadow-lg backdrop-blur-md text-xs font-medium text-zinc-700">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onFilterChange(tab.id)}
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3 transition-colors cursor-pointer ${
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-zinc-200/80 text-zinc-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex h-[50px] items-center gap-1 rounded-full border border-black/10 bg-white/90 px-2 shadow-lg backdrop-blur-md text-xs font-medium text-zinc-700">
            <div ref={sortRef} className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen((prev) => !prev)}
                className="flex h-8 items-center gap-1.5 rounded-full px-3 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <ArrowUpDown size={13} />
                <span>Sort: {activeSortLabel}</span>
              </button>

              {isSortOpen && (
                <div className="absolute bottom-12 left-0 z-50 w-36 rounded-2xl border border-black/10 bg-white/95 p-1.5 shadow-xl backdrop-blur-md">
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
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.id && <Check size={13} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onArrangeVisible}
                  className="flex h-8 items-center gap-1.5 rounded-full px-3 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  <LayoutGrid size={13} />
                  <span>Arrange</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Arrange visible files neatly</TooltipContent>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
}

