"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  FolderOpen,
  RotateCw,
  Search,
  Settings,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import MiniMap from "@/components/common/MiniMap";
import ThemeToggle from "@/features/home/components/ThemeToggle";
import SettingsModal, {
  getSavedWhiteboardSettings,
  SETTINGS_CHANGE_EVENT,
  type WhiteboardControlSettings,
} from "@/features/home/components/SettingsModal";
import AuthButton from "@/features/auth/components/AuthButton";
import BottomToolbar, { COLOR_STORAGE_KEY } from "./BottomToolbar";
import BoardFileCard from "./BoardFileCard";
import BoardFilePreviewModal from "./BoardFilePreviewModal";
import FolderBar from "./FolderBar";
import type {
  BoardFileFilter,
  BoardFileItem,
  BoardFileSort,
  BoardItemLayout,
  DirectoryHandleLike,
} from "../types";
import {
  clearDirectoryHandle,
  computeBoardLayout,
  DEFAULT_CARD_WIDTHS,
  loadDirectoryHandle,
  loadSavedFolderLayout,
  pickDirectoryHandle,
  readFolderFromFileList,
  readFolderFromHandle,
  revokeFolderUrls,
  saveDirectoryHandle,
  saveFolderLayout,
  sortBoardFiles,
  supportsDirectoryPicker,
  verifyDirectoryPermission,
} from "../utils/local-folder";

interface DragItemState {
  id: string;
  startX: number;
  startY: number;
  initX: number;
  initY: number;
  currentX: number;
  currentY: number;
  moved: boolean;
  el: HTMLDivElement | null;
}

interface ResizeItemState {
  id: string;
  startX: number;
  initWidth: number;
  currentWidth: number;
  el: HTMLDivElement | null;
}

const FOLDER_CANVAS_COLOR_KEY = "project_notes_folder_canvas_color";

export default function FolderWhiteboard() {
  const [canvasColor, setCanvasColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        return (
          localStorage.getItem(FOLDER_CANVAS_COLOR_KEY) ||
          localStorage.getItem(COLOR_STORAGE_KEY) ||
          "#ffffff"
        );
      } catch {}
    }
    return "#ffffff";
  });

  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [folderName, setFolderName] = useState<string | null>(null);
  const [folderItems, setFolderItems] = useState<BoardFileItem[]>([]);
  const [directoryHandle, setDirectoryHandle] =
    useState<DirectoryHandleLike | null>(null);
  const [savedHandle, setSavedHandle] = useState<DirectoryHandleLike | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState<BoardFileFilter>("all");
  const [sortBy, setSortBy] = useState<BoardFileSort>("type");
  const [folderLayout, setFolderLayout] = useState<
    Record<string, BoardItemLayout>
  >({});
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

  const [controlSettings, setControlSettings] =
    useState<WhiteboardControlSettings>(getSavedWhiteboardSettings);

  const containerRef = useRef<HTMLDivElement>(null);
  const emptyFallbackInputRef = useRef<HTMLInputElement>(null);
  const cardElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const isSpacePressedRef = useRef(false);
  const isRightMouseDownRef = useRef(false);
  const isPanningRef = useRef(false);
  const panOriginRef = useRef<{
    startX: number;
    startY: number;
    initPanX: number;
    initPanY: number;
  } | null>(null);
  const controlSettingsRef = useRef(controlSettings);

  const dragItemRef = useRef<DragItemState | null>(null);
  const resizeItemRef = useRef<ResizeItemState | null>(null);
  const draggedRef = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const folderNameRef = useRef<string | null>(null);
  const folderItemsRef = useRef<BoardFileItem[]>([]);
  const folderLayoutRef = useRef<Record<string, BoardItemLayout>>({});

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    controlSettingsRef.current = controlSettings;
  }, [controlSettings]);

  useEffect(() => {
    folderNameRef.current = folderName;
  }, [folderName]);

  useEffect(() => {
    folderItemsRef.current = folderItems;
  }, [folderItems]);

  useEffect(() => {
    folderLayoutRef.current = folderLayout;
  }, [folderLayout]);

  useEffect(() => {
    if (emptyFallbackInputRef.current) {
      emptyFallbackInputRef.current.setAttribute("webkitdirectory", "");
      emptyFallbackInputRef.current.setAttribute("directory", "");
    }
  }, [folderName]);

  useEffect(() => {
    const handleSettingsChange = () => {
      setControlSettings(getSavedWhiteboardSettings());
    };
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    return () =>
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
  }, []);

  useEffect(() => {
    loadDirectoryHandle().then((handle) => {
      if (handle) setSavedHandle(handle);
    });
    return () => {
      revokeFolderUrls(folderItemsRef.current);
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const handleCanvasColorChange = (color: string) => {
    setCanvasColor(color);
    try {
      localStorage.setItem(FOLDER_CANVAS_COLOR_KEY, color);
    } catch {}
  };

  const applyLoadedFolder = (
    name: string,
    rawItems: BoardFileItem[],
    activeSort: BoardFileSort,
  ) => {
    revokeFolderUrls(folderItemsRef.current);
    const sorted = sortBoardFiles(rawItems, activeSort);
    const saved = loadSavedFolderLayout(name);
    const missingItems = sorted.filter((item) => !saved[item.id]);
    const computed =
      missingItems.length > 0
        ? computeBoardLayout(missingItems, 120, 120)
        : {};
    const mergedLayout: Record<string, BoardItemLayout> = {
      ...saved,
      ...computed,
    };

    folderNameRef.current = name;
    folderItemsRef.current = sorted;
    folderLayoutRef.current = mergedLayout;
    setFolderName(name);
    setFolderItems(sorted);
    setFolderLayout(mergedLayout);
    setActiveFilter("all");
    setPan({ x: 0, y: 0 });
    setZoom(1);
    saveFolderLayout(name, mergedLayout);
  };

  const handlePickFolder = async () => {
    try {
      setIsLoadingFolder(true);
      const handle = await pickDirectoryHandle();
      if (!handle) return;
      const items = await readFolderFromHandle(handle);
      setDirectoryHandle(handle);
      setSavedHandle(handle);
      await saveDirectoryHandle(handle);
      applyLoadedFolder(handle.name, items, sortBy);
    } catch {
    } finally {
      setIsLoadingFolder(false);
    }
  };

  const handleFallbackFilesSelected = (files: FileList) => {
    setIsLoadingFolder(true);
    try {
      const { folderName: name, items } = readFolderFromFileList(files);
      setDirectoryHandle(null);
      applyLoadedFolder(name, items, sortBy);
    } finally {
      setIsLoadingFolder(false);
    }
  };

  const handleReconnectSaved = async () => {
    if (!savedHandle) return;
    try {
      setIsLoadingFolder(true);
      const granted = await verifyDirectoryPermission(savedHandle);
      if (!granted) return;
      const items = await readFolderFromHandle(savedHandle);
      setDirectoryHandle(savedHandle);
      applyLoadedFolder(savedHandle.name, items, sortBy);
    } catch {
    } finally {
      setIsLoadingFolder(false);
    }
  };

  const handleRefreshFolder = async () => {
    if (!directoryHandle) return;
    try {
      setIsLoadingFolder(true);
      const granted = await verifyDirectoryPermission(directoryHandle);
      if (!granted) return;
      const items = await readFolderFromHandle(directoryHandle);
      applyLoadedFolder(directoryHandle.name, items, sortBy);
    } catch {
    } finally {
      setIsLoadingFolder(false);
    }
  };

  const handleClearFolder = async () => {
    revokeFolderUrls(folderItemsRef.current);
    folderNameRef.current = null;
    folderItemsRef.current = [];
    folderLayoutRef.current = {};
    setFolderName(null);
    setFolderItems([]);
    setFolderLayout({});
    setDirectoryHandle(null);
    setSavedHandle(null);
    setPreviewItemId(null);
    setSearchQuery("");
    await clearDirectoryHandle();
  };

  const folderCounts = useMemo(() => {
    const counts = {
      all: folderItems.length,
      image: 0,
      video: 0,
      audio: 0,
      file: 0,
    };
    for (const item of folderItems) {
      counts[item.category] += 1;
    }
    return counts;
  }, [folderItems]);

  const visibleFolderItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = folderItems.filter((item) => {
      const matchesFilter =
        activeFilter === "all" || item.category === activeFilter;
      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.relativePath.toLowerCase().includes(q)
      );
    });
    return sortBoardFiles(filtered, sortBy);
  }, [folderItems, activeFilter, sortBy, searchQuery]);

  const arrangeItems = (itemsToArrange: BoardFileItem[]) => {
    if (!folderNameRef.current || itemsToArrange.length === 0) return;
    const widths: Record<string, number> = {};
    for (const item of itemsToArrange) {
      const existingWidth = folderLayoutRef.current[item.id]?.width;
      if (existingWidth) widths[item.id] = existingWidth;
    }
    const arranged = computeBoardLayout(itemsToArrange, 120, 120, widths);
    const updated = { ...folderLayoutRef.current, ...arranged };
    folderLayoutRef.current = updated;
    setFolderLayout(updated);
    saveFolderLayout(folderNameRef.current, updated);
  };

  const handleSortChange = (nextSort: BoardFileSort) => {
    setSortBy(nextSort);
    const q = searchQuery.trim().toLowerCase();
    const filtered = folderItemsRef.current.filter((item) => {
      const matchesFilter =
        activeFilter === "all" || item.category === activeFilter;
      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.relativePath.toLowerCase().includes(q)
      );
    });
    arrangeItems(sortBoardFiles(filtered, nextSort));
  };

  const minimapExtraItems = useMemo(() => {
    return visibleFolderItems.map((item) => {
      const layout = folderLayout[item.id] || {
        x: 120,
        y: 120,
        width: DEFAULT_CARD_WIDTHS[item.category],
      };
      return {
        id: item.id,
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: item.category === "image" ? 200 : 140,
      };
    });
  }, [visibleFolderItems, folderLayout]);

  const handleZoomStep = useCallback((factor: number) => {
    const container = containerRef.current;
    const nextZoom = Math.min(3, Math.max(0.2, zoomRef.current * factor));
    const cx = container ? container.clientWidth / 2 : window.innerWidth / 2;
    const cy = container ? container.clientHeight / 2 : window.innerHeight / 2;
    const worldX = (cx - panRef.current.x) / zoomRef.current;
    const worldY = (cy - panRef.current.y) / zoomRef.current;
    setZoom(nextZoom);
    setPan({
      x: cx - worldX * nextZoom,
      y: cy - worldY * nextZoom,
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const settings = controlSettingsRef.current;
      const isRightClickHeld =
        (e.buttons & 2) === 2 || isRightMouseDownRef.current;
      const isZoomModifier =
        isRightClickHeld ||
        settings.wheelZoomMode === "direct" ||
        (settings.wheelZoomMode === "ctrl" && (e.ctrlKey || e.metaKey)) ||
        (settings.wheelZoomMode === "alt" && e.altKey);

      if (isZoomModifier) {
        const dir = settings.invertZoom ? 1 : -1;
        const zoomFactor = Math.exp(
          dir * -e.deltaY * 0.0025 * (settings.zoomStep / 1.2),
        );
        const nextZoom = Math.min(
          3,
          Math.max(0.2, zoomRef.current * zoomFactor),
        );
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldX = (mouseX - panRef.current.x) / zoomRef.current;
        const worldY = (mouseY - panRef.current.y) / zoomRef.current;
        setZoom(nextZoom);
        setPan({
          x: mouseX - worldX * nextZoom,
          y: mouseY - worldY * nextZoom,
        });
      } else {
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        (e.target === document.body || e.target === containerRef.current)
      ) {
        isSpacePressedRef.current = true;
        setIsSpacePressed(true);
      }
      if (e.ctrlKey || e.metaKey) {
        const step = controlSettingsRef.current.zoomStep;
        if (e.key === "=" || e.key === "+" || e.code === "NumpadAdd") {
          e.preventDefault();
          handleZoomStep(step);
        } else if (
          e.key === "-" ||
          e.key === "_" ||
          e.code === "NumpadSubtract"
        ) {
          e.preventDefault();
          handleZoomStep(1 / step);
        } else if (e.key === "0" || e.code === "Numpad0") {
          e.preventDefault();
          setZoom(1);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpacePressedRef.current = false;
        setIsSpacePressed(false);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) isRightMouseDownRef.current = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) isRightMouseDownRef.current = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [handleZoomStep]);

  const isPanAction = (e: React.PointerEvent | PointerEvent) => {
    const trigger = controlSettingsRef.current.panTrigger;
    const isMiddle = e.button === 1 || (e.buttons & 4) === 4;
    const isSpace = isSpacePressedRef.current && (e.buttons & 1) === 1;
    const isRight = (e.buttons & 2) === 2 || isRightMouseDownRef.current;
    const isAlt = e.altKey && (e.buttons & 1) === 1;
    const isShift = e.shiftKey && (e.buttons & 1) === 1;
    const bothButtons = (e.buttons & 3) === 3;

    if (trigger === "space") return isSpace || bothButtons;
    if (trigger === "middle") return isMiddle;
    if (trigger === "right") return isRight;
    if (trigger === "alt") return isAlt;
    if (trigger === "shift") return isShift;
    return bothButtons || isMiddle || isSpace;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPanAction(e)) {
      if (dragItemRef.current) {
        dragItemRef.current = null;
        draggedRef.current = false;
      }
      isPanningRef.current = true;
      panOriginRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initPanX: pan.x,
        initPanY: pan.y,
      };
      setIsPanning(true);
      e.preventDefault();
    }
  };

  const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
    if (resizeItemRef.current) {
      const dx = e.clientX - resizeItemRef.current.startX;
      const nextWidth = Math.min(
        720,
        Math.max(
          180,
          Math.round(resizeItemRef.current.initWidth + dx / zoomRef.current),
        ),
      );
      resizeItemRef.current.currentWidth = nextWidth;

      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          if (!resizeItemRef.current) return;
          const el =
            resizeItemRef.current.el ||
            cardElementsRef.current[resizeItemRef.current.id];
          if (el) {
            el.style.width = `${resizeItemRef.current.currentWidth}px`;
          }
        });
      }
      return;
    }

    if (dragItemRef.current) {
      const dx = e.clientX - dragItemRef.current.startX;
      const dy = e.clientY - dragItemRef.current.startY;
      if (
        !dragItemRef.current.moved &&
        (Math.abs(dx) > 2 || Math.abs(dy) > 2)
      ) {
        dragItemRef.current.moved = true;
        draggedRef.current = true;
      }
      dragItemRef.current.currentX =
        dragItemRef.current.initX + dx / zoomRef.current;
      dragItemRef.current.currentY =
        dragItemRef.current.initY + dy / zoomRef.current;

      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          if (!dragItemRef.current) return;
          const el =
            dragItemRef.current.el ||
            cardElementsRef.current[dragItemRef.current.id];
          if (el) {
            el.style.transform = `translate3d(${dragItemRef.current.currentX}px, ${dragItemRef.current.currentY}px, 0)`;
          }
        });
      }
      return;
    }

    if (isPanAction(e)) {
      if (!isPanningRef.current || !panOriginRef.current) {
        isPanningRef.current = true;
        panOriginRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          initPanX: panRef.current.x,
          initPanY: panRef.current.y,
        };
        setIsPanning(true);
      } else {
        const dx = e.clientX - panOriginRef.current.startX;
        const dy = e.clientY - panOriginRef.current.startY;
        setPan({
          x: panOriginRef.current.initPanX + dx,
          y: panOriginRef.current.initPanY + dy,
        });
      }
      e.preventDefault();
      return;
    }

    if (isPanningRef.current && !isPanAction(e)) {
      isPanningRef.current = false;
      panOriginRef.current = null;
      setIsPanning(false);
    }
  }, []);

  const handleGlobalPointerUp = useCallback(() => {
    isRightMouseDownRef.current = false;
    isPanningRef.current = false;
    panOriginRef.current = null;
    setIsPanning(false);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (resizeItemRef.current) {
      const { id, currentWidth, el } = resizeItemRef.current;
      resizeItemRef.current = null;
      if (el) {
        el.style.zIndex = "";
        el.style.width = `${currentWidth}px`;
      }
      const existing = folderLayoutRef.current[id] || {
        x: 120,
        y: 120,
        width: currentWidth,
      };
      const updatedLayout = {
        ...folderLayoutRef.current,
        [id]: { ...existing, width: currentWidth },
      };
      folderLayoutRef.current = updatedLayout;
      setFolderLayout(updatedLayout);
      if (folderNameRef.current) {
        saveFolderLayout(folderNameRef.current, updatedLayout);
      }
    }

    if (dragItemRef.current) {
      const { id, moved, currentX, currentY, el } = dragItemRef.current;
      dragItemRef.current = null;

      if (el) {
        el.style.zIndex = "";
        el.style.transition = "";
      }

      if (moved) {
        draggedRef.current = true;
        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }
        dragTimeoutRef.current = setTimeout(() => {
          draggedRef.current = false;
        }, 50);

        const finalX = Math.round(currentX);
        const finalY = Math.round(currentY);

        if (el) {
          el.style.transform = `translate3d(${finalX}px, ${finalY}px, 0)`;
        }

        const existing = folderLayoutRef.current[id] || {
          x: finalX,
          y: finalY,
          width: 260,
        };
        const updatedLayout = {
          ...folderLayoutRef.current,
          [id]: { ...existing, x: finalX, y: finalY },
        };
        folderLayoutRef.current = updatedLayout;
        setFolderLayout(updatedLayout);
        if (folderNameRef.current) {
          saveFolderLayout(folderNameRef.current, updatedLayout);
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handleGlobalPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerup", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [handleGlobalPointerMove, handleGlobalPointerUp]);

  const handleCardPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, itemId: string) => {
      if (
        (e.buttons & 3) === 3 ||
        isSpacePressedRef.current ||
        e.button !== 0
      ) {
        return;
      }
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("video") ||
        target.closest("audio") ||
        target.closest("[data-resize-handle]") ||
        target.closest('[role="button"]')
      ) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      draggedRef.current = false;
      const pos = folderLayoutRef.current[itemId] || { x: 120, y: 120 };
      const el = cardElementsRef.current[itemId];
      if (el) {
        el.style.transition = "none";
        el.style.zIndex = "50";
      }
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
      dragItemRef.current = {
        id: itemId,
        startX: e.clientX,
        startY: e.clientY,
        initX: pos.x,
        initY: pos.y,
        currentX: pos.x,
        currentY: pos.y,
        moved: false,
        el,
      };
    },
    [],
  );

  const handleCardResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, item: BoardFileItem) => {
      if (e.button !== 0 || isSpacePressedRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      const el = cardElementsRef.current[item.id];
      const currentWidth =
        folderLayoutRef.current[item.id]?.width ??
        DEFAULT_CARD_WIDTHS[item.category];
      if (el) {
        el.style.transition = "none";
        el.style.zIndex = "50";
      }
      document.body.style.userSelect = "none";
      document.body.style.cursor = "nwse-resize";
      resizeItemRef.current = {
        id: item.id,
        startX: e.clientX,
        initWidth: currentWidth,
        currentWidth,
        el,
      };
    },
    [],
  );

  const handleEmptyOpenClick = () => {
    if (supportsDirectoryPicker()) {
      handlePickFolder();
    } else {
      emptyFallbackInputRef.current?.click();
    }
  };

  const isDarkCanvas = canvasColor === "#18181b";
  const dotColor = isDarkCanvas
    ? "rgba(255, 255, 255, 0.15)"
    : "rgba(0, 0, 0, 0.08)";

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <header className="absolute top-6 inset-x-0 z-30 flex items-center justify-between px-6 pointer-events-none">
        <div className="flex items-center pointer-events-auto">
          <Link href="/" className="flex h-10 items-center gap-2.5 pb-4 px-4">
            <Image
              src="/assets/hane.png"
              alt="Logo"
              width={104}
              height={44}
              className="object-contain w-auto h-auto rounded-lg"
            />
          </Link>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
          <div
            className={`group relative flex h-[52px] items-center justify-start rounded-full bg-secondary shadow-xs transition-all duration-300 ${
              searchQuery ? "w-64" : "hover:w-64 focus-within:w-64 w-[52px]"
            } overflow-hidden`}
          >
            <button
              type="button"
              aria-label="Search files"
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search size={18} />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search folder files..."
              className={`h-full w-full bg-transparent px-2 pr-8 text-sm text-foreground placeholder-muted-foreground outline-none transition-opacity duration-300 ${
                searchQuery
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <nav className="flex h-[52px] items-center gap-1 rounded-full bg-secondary p-1.5 shadow-xs">
            <Link
              href="/"
              className="inline-flex h-full items-center gap-2 rounded-full px-4 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Notes</span>
            </Link>
            <span className="inline-flex h-full items-center gap-2 rounded-full bg-background px-4 text-xs font-semibold text-foreground shadow-xs">
              <FolderOpen size={14} />
              <span>Folder Board</span>
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <ThemeToggle />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus:outline-none cursor-pointer"
          >
            <Settings size={18} />
          </motion.button>
          <AuthButton />
        </div>
      </header>

      <div
        ref={containerRef}
        suppressHydrationWarning
        onPointerDown={handlePointerDown}
        className={`relative h-full w-full overflow-hidden select-none ${
          isPanning
            ? "cursor-grabbing"
            : isSpacePressed
              ? "cursor-grab"
              : "cursor-default"
        }`}
        style={{
          backgroundColor: canvasColor,
          backgroundImage: `radial-gradient(${dotColor} ${1.5 * zoom}px, transparent ${1.5 * zoom}px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        <div
          className="absolute inset-0 h-full w-full pointer-events-none origin-top-left"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          }}
        >
          {visibleFolderItems.map((item) => {
            const layout = folderLayout[item.id] || {
              x: 120,
              y: 120,
              width: DEFAULT_CARD_WIDTHS[item.category],
            };

            return (
              <div
                key={item.id}
                ref={(el) => {
                  cardElementsRef.current[item.id] = el;
                }}
                className="absolute left-0 top-0 will-change-transform select-none hover:z-30 z-10"
                style={{
                  width: layout.width,
                  transform: `translate3d(${layout.x}px, ${layout.y}px, 0)`,
                }}
                onClickCapture={(e) => {
                  if (draggedRef.current) {
                    e.stopPropagation();
                  }
                }}
              >
                <BoardFileCard
                  item={item}
                  isSelected={previewItemId === item.id}
                  onPointerDown={(e) => handleCardPointerDown(e, item.id)}
                  onResizePointerDown={(e) =>
                    handleCardResizePointerDown(e, item)
                  }
                  onPreview={() => {
                    if (draggedRef.current) return;
                    setPreviewItemId(item.id);
                  }}
                />
              </div>
            );
          })}
        </div>

        {!folderName && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="pointer-events-auto flex max-w-md flex-col items-center rounded-3xl border border-black/10 bg-white/90 p-8 text-center shadow-xl backdrop-blur-md text-zinc-900"
            >
              <input
                ref={emptyFallbackInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFallbackFilesSelected(e.target.files);
                  }
                  e.target.value = "";
                }}
              />
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm">
                <FolderOpen size={26} />
              </div>
              <h1 className="text-lg font-semibold">
                Inspiration Folder Whiteboard
              </h1>
              <p className="mt-1.5 text-sm text-zinc-600">
                Select a folder from your device to arrange, resize, filter, and
                sort images, videos, and files freely on an infinite canvas.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleEmptyOpenClick}
                  disabled={isLoadingFolder}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-transform hover:bg-zinc-800 active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  <FolderOpen size={16} />
                  <span>Open Folder</span>
                </button>
                {savedHandle && (
                  <button
                    type="button"
                    onClick={handleReconnectSaved}
                    disabled={isLoadingFolder}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 cursor-pointer"
                  >
                    <RotateCw size={15} />
                    <span className="max-w-[160px] truncate">
                      Reconnect {savedHandle.name}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <MiniMap
          extraItems={minimapExtraItems}
          pan={pan}
          zoom={zoom}
          onPanChange={(newPan) => setPan(newPan)}
        />

        <FolderBar
          folderName={folderName}
          savedFolderName={savedHandle?.name ?? null}
          isLoading={isLoadingFolder}
          canRefresh={Boolean(directoryHandle)}
          activeFilter={activeFilter}
          sortBy={sortBy}
          counts={folderCounts}
          onPickFolder={handlePickFolder}
          onFallbackFilesSelected={handleFallbackFilesSelected}
          onReconnectSaved={handleReconnectSaved}
          onRefreshFolder={handleRefreshFolder}
          onClearFolder={handleClearFolder}
          onFilterChange={setActiveFilter}
          onSortChange={handleSortChange}
          onArrangeVisible={() => arrangeItems(visibleFolderItems)}
          className="fixed bottom-5 left-6 z-40 flex flex-wrap items-center gap-2 max-w-[calc(100vw-380px)]"
        />

        <BottomToolbar
          zoom={zoom}
          onZoomStep={handleZoomStep}
          onResetZoom={() => setZoom(1)}
          canvasColor={canvasColor}
          onCanvasColorChange={handleCanvasColorChange}
        />

        <BoardFilePreviewModal
          items={visibleFolderItems}
          activeItemId={previewItemId}
          onClose={() => setPreviewItemId(null)}
          onSelectItem={setPreviewItemId}
        />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </main>
  );
}

