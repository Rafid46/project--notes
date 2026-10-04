"use client";

import { useEffect, useRef, useState } from "react";
import type { ViewMode } from "../types";

interface ViewDropdownProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
}

const VIEW_OPTIONS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    id: "whiteboard",
    label: "Whiteboard",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
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
  },
  {
    id: "masonry",
    label: "Masonry",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
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
  },
  {
    id: "grid-2",
    label: "Grid 2",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
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
  },
  {
    id: "grid-4",
    label: "Grid 4",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
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
        <rect width="4" height="20" x="20" y="3" rx="1" />
      </svg>
    ),
  },
];

export default function ViewDropdown({
  currentView,
  onSelectView,
}: ViewDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    VIEW_OPTIONS.find((opt) => opt.id === currentView) || VIEW_OPTIONS[0];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3.5 py-1.5 text-xs md:text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-muted-foreground">
          {selectedOption.icon}
        </span>
        <span>{selectedOption.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-48 origin-top-right rounded-lg border border-border bg-popover p-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
          <div className="px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground">
            View Layout
          </div>
          <div className="h-px bg-border my-1" />
          {VIEW_OPTIONS.map((option) => {
            const isSelected = option.id === currentView;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onSelectView(option.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                  isSelected
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {option.icon}
                  </span>
                  <span>{option.label}</span>
                </div>
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-foreground"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
