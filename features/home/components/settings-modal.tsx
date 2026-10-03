"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sliders,
  Monitor,
  MousePointer,
  ZoomIn,
  ChevronDown,
} from "lucide-react";
import type { ViewMode } from "../types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export interface WhiteboardControlSettings {
  panTrigger: "space" | "middle" | "right" | "alt" | "shift";
  wheelZoomMode: "ctrl" | "alt" | "direct";
  zoomStep: number;
  invertZoom: boolean;
}

export const DEFAULT_WHITEBOARD_SETTINGS: WhiteboardControlSettings = {
  panTrigger: "space",
  wheelZoomMode: "ctrl",
  zoomStep: 1.2,
  invertZoom: false,
};

const STORAGE_DEFAULT_VIEW_KEY = "project_notes_default_view";
const STORAGE_WHITEBOARD_SETTINGS_KEY = "project_notes_whiteboard_settings";
export const SETTINGS_CHANGE_EVENT = "project_notes_settings_changed";

export function getSavedDefaultView(): ViewMode {
  if (typeof window === "undefined") return "whiteboard";
  const saved = localStorage.getItem(STORAGE_DEFAULT_VIEW_KEY);
  if (
    saved === "whiteboard" ||
    saved === "masonry" ||
    saved === "grid-2" ||
    saved === "grid-3" ||
    saved === "grid-4" ||
    saved === "grid-5" ||
    saved === "grid-6"
  ) {
    return saved;
  }
  return "whiteboard";
}

export function getSavedWhiteboardSettings(): WhiteboardControlSettings {
  if (typeof window === "undefined") return DEFAULT_WHITEBOARD_SETTINGS;
  const saved = localStorage.getItem(STORAGE_WHITEBOARD_SETTINGS_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_WHITEBOARD_SETTINGS, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_WHITEBOARD_SETTINGS;
    }
  }
  return DEFAULT_WHITEBOARD_SETTINGS;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDefaultViewChange?: (view: ViewMode) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onDefaultViewChange,
}: SettingsModalProps) {
  const [defaultView, setDefaultView] = useState<ViewMode>("whiteboard");
  const [whiteboardSettings, setWhiteboardSettings] =
    useState<WhiteboardControlSettings>(DEFAULT_WHITEBOARD_SETTINGS);
  const [activeTab, setActiveTab] = useState<"general" | "whiteboard">("general");

  useEffect(() => {
    if (isOpen) {
      setDefaultView(getSavedDefaultView());
      setWhiteboardSettings(getSavedWhiteboardSettings());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleDefaultViewChange = (view: ViewMode) => {
    setDefaultView(view);
    localStorage.setItem(STORAGE_DEFAULT_VIEW_KEY, view);
    onDefaultViewChange?.(view);
    window.dispatchEvent(new Event(SETTINGS_CHANGE_EVENT));
  };

  const handleWhiteboardSettingChange = <K extends keyof WhiteboardControlSettings>(
    key: K,
    value: WhiteboardControlSettings[K]
  ) => {
    setWhiteboardSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(
        STORAGE_WHITEBOARD_SETTINGS_KEY,
        JSON.stringify(updated)
      );
      window.dispatchEvent(new Event(SETTINGS_CHANGE_EVENT));
      return updated;
    });
  };

  const viewOptions: { id: ViewMode; label: string }[] = [
    { id: "whiteboard", label: "Whiteboard" },
    { id: "masonry", label: "Masonry" },
    { id: "grid-2", label: "Grid 2" },
    { id: "grid-3", label: "Grid 3" },
    { id: "grid-4", label: "Grid 4" },
    { id: "grid-5", label: "Grid 5" },
    { id: "grid-6", label: "Grid 6" },
  ];

  const panOptions: {
    id: WhiteboardControlSettings["panTrigger"];
    label: string;
  }[] = [
    { id: "space", label: "Spacebar + Left Click Drag (Standard)" },
    { id: "middle", label: "Middle Mouse Button Drag" },
    { id: "right", label: "Right Mouse Button Drag" },
    { id: "alt", label: "Alt / Option + Left Click Drag" },
    { id: "shift", label: "Shift + Left Click Drag" },
  ];

  const wheelZoomOptions: {
    id: WhiteboardControlSettings["wheelZoomMode"];
    label: string;
  }[] = [
    { id: "ctrl", label: "Hold Ctrl / Cmd + Scroll to Zoom (Default)" },
    { id: "alt", label: "Hold Alt / Option + Scroll to Zoom" },
    { id: "direct", label: "Direct Scroll to Zoom (No Modifier)" },
  ];

  const zoomStepOptions = [
    { value: "1.1", label: "1.1x (Smooth)" },
    { value: "1.2", label: "1.2x (Normal)" },
    { value: "1.3", label: "1.3x (Fast)" },
    { value: "1.5", label: "1.5x (Large)" },
  ];

  const selectedViewLabel =
    viewOptions.find((opt) => opt.id === defaultView)?.label || "Whiteboard";

  const selectedPanLabel =
    panOptions.find((opt) => opt.id === whiteboardSettings.panTrigger)?.label ||
    "Spacebar + Left Click Drag";

  const selectedWheelZoomLabel =
    wheelZoomOptions.find((opt) => opt.id === whiteboardSettings.wheelZoomMode)
      ?.label || "Hold Ctrl / Cmd + Scroll to Zoom (Default)";

  const selectedZoomStepLabel =
    zoomStepOptions.find(
      (opt) => opt.value === String(whiteboardSettings.zoomStep)
    )?.label || `${whiteboardSettings.zoomStep}x`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-6 right-6 z-50 h-[calc(100vh-48px)] w-[400px] max-w-[calc(100vw-48px)] rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Sliders size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold leading-none text-foreground">settings</h2>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Preferences & controls
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <span>close</span>
                <div className="bg-muted text-foreground hover:bg-muted/80 p-1.5 rounded-full flex items-center justify-center transition-colors">
                  <X size={14} strokeWidth={2.5} />
                </div>
              </button>
            </div>

            <div className="flex rounded-xl bg-muted/60 p-1 mt-4 shrink-0 border border-border/40">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "general"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Monitor size={14} />
                <span>General View</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("whiteboard")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "whiteboard"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MousePointer size={14} />
                <span>Whiteboard & Keys</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-4">
              {activeTab === "general" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <Monitor size={14} className="text-blue-500" />
                      <span>Default View Layout</span>
                    </label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Select which layout opens automatically when loading notes.
                    </p>

                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-10 w-full items-center justify-between rounded-xl border border-border/70 bg-card hover:bg-accent/40 px-3.5 text-xs font-medium text-foreground transition-colors cursor-pointer outline-none shadow-xs">
                        <span>{selectedViewLabel}</span>
                        <ChevronDown size={14} className="text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-(--anchor-width) min-w-[200px]">
                        <DropdownMenuRadioGroup
                          value={defaultView}
                          onValueChange={(val) =>
                            handleDefaultViewChange(val as ViewMode)
                          }
                        >
                          {viewOptions.map((opt) => (
                            <DropdownMenuRadioItem
                              key={opt.id}
                              value={opt.id}
                              className="cursor-pointer text-xs"
                            >
                              {opt.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/40 p-4 flex flex-col gap-2.5 mt-2">
                    <span className="text-xs font-semibold text-foreground">
                      Layout Overview
                    </span>
                    <ul className="text-xs text-muted-foreground flex flex-col gap-2">
                      <li className="flex items-start gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">
                          <strong className="text-foreground font-medium">Whiteboard:</strong> Infinite drag & zoom visual space
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">
                          <strong className="text-foreground font-medium">Masonry:</strong> Cascading multi-column note layout
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">
                          <strong className="text-foreground font-medium">Grid 2 to 6:</strong> Fixed responsive column grid views
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "whiteboard" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <MousePointer size={14} className="text-blue-500" />
                      <span>Mouse Dragging Keybinding (Canvas Pan)</span>
                    </label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Modifier key or mouse button to drag the canvas.
                    </p>

                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-10 w-full items-center justify-between rounded-xl border border-border/70 bg-card hover:bg-accent/40 px-3.5 text-xs font-medium text-foreground transition-colors cursor-pointer outline-none shadow-xs">
                        <span>{selectedPanLabel}</span>
                        <ChevronDown size={14} className="text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-(--anchor-width) min-w-[260px]">
                        <DropdownMenuRadioGroup
                          value={whiteboardSettings.panTrigger}
                          onValueChange={(val) =>
                            handleWhiteboardSettingChange(
                              "panTrigger",
                              val as WhiteboardControlSettings["panTrigger"]
                            )
                          }
                        >
                          {panOptions.map((opt) => (
                            <DropdownMenuRadioItem
                              key={opt.id}
                              value={opt.id}
                              className="cursor-pointer text-xs"
                            >
                              {opt.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="h-px bg-border/60" />

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <ZoomIn size={14} className="text-blue-500" />
                      <span>Mouse Wheel Zoom Trigger</span>
                    </label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Modifier key behavior for wheel zooming.
                    </p>

                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-10 w-full items-center justify-between rounded-xl border border-border/70 bg-card hover:bg-accent/40 px-3.5 text-xs font-medium text-foreground transition-colors cursor-pointer outline-none shadow-xs">
                        <span>{selectedWheelZoomLabel}</span>
                        <ChevronDown size={14} className="text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-(--anchor-width) min-w-[260px]">
                        <DropdownMenuRadioGroup
                          value={whiteboardSettings.wheelZoomMode}
                          onValueChange={(val) =>
                            handleWhiteboardSettingChange(
                              "wheelZoomMode",
                              val as WhiteboardControlSettings["wheelZoomMode"]
                            )
                          }
                        >
                          {wheelZoomOptions.map((opt) => (
                            <DropdownMenuRadioItem
                              key={opt.id}
                              value={opt.id}
                              className="cursor-pointer text-xs"
                            >
                              {opt.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Zoom Step Factor
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Speed factor for incremental zoom
                      </span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-9 w-32 items-center justify-between rounded-xl border border-border/70 bg-card hover:bg-accent/40 px-3 text-xs font-medium text-foreground transition-colors cursor-pointer outline-none shadow-xs">
                        <span>{selectedZoomStepLabel}</span>
                        <ChevronDown size={12} className="text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[130px]">
                        <DropdownMenuRadioGroup
                          value={String(whiteboardSettings.zoomStep)}
                          onValueChange={(val) =>
                            handleWhiteboardSettingChange(
                              "zoomStep",
                              parseFloat(val)
                            )
                          }
                        >
                          {zoomStepOptions.map((opt) => (
                            <DropdownMenuRadioItem
                              key={opt.value}
                              value={opt.value}
                              className="cursor-pointer text-xs"
                            >
                              {opt.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Invert Zoom Direction
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Reverse wheel zoom direction
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={whiteboardSettings.invertZoom}
                      onChange={(e) =>
                        handleWhiteboardSettingChange(
                          "invertZoom",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-border accent-blue-500 cursor-pointer"
                    />
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/40 p-4 flex flex-col gap-2.5 mt-1">
                    <span className="text-xs font-semibold text-foreground">
                      Keyboard Shortcuts
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between bg-card p-2 px-2.5 rounded-lg border border-border/60 shadow-2xs">
                        <span className="text-muted-foreground text-[11px] font-medium">Zoom In</span>
                        <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-foreground text-[10px] font-mono border border-border font-semibold">
                          Ctrl + +
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between bg-card p-2 px-2.5 rounded-lg border border-border/60 shadow-2xs">
                        <span className="text-muted-foreground text-[11px] font-medium">Zoom Out</span>
                        <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-foreground text-[10px] font-mono border border-border font-semibold">
                          Ctrl + -
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between bg-card p-2 px-2.5 rounded-lg border border-border/60 shadow-2xs">
                        <span className="text-muted-foreground text-[11px] font-medium">Reset Zoom</span>
                        <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-foreground text-[10px] font-mono border border-border font-semibold">
                          Ctrl + 0
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between bg-card p-2 px-2.5 rounded-lg border border-border/60 shadow-2xs">
                        <span className="text-muted-foreground text-[11px] font-medium">Pan Canvas</span>
                        <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-foreground text-[10px] font-mono border border-border font-semibold">
                          Space + Drag
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
