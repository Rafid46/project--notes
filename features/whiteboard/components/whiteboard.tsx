"use client";

import { useEffect, useRef, useState } from "react";
import type { NoteItem } from "@/features/home/types";
import Note from "@/features/notes/components/Note";
import MiniMap from "@/components/common/MiniMap";

import {
  getSavedWhiteboardSettings,
  SETTINGS_CHANGE_EVENT,
  type WhiteboardControlSettings,
} from "@/features/home/components/settings-modal";
import BottomToolbar, { COLOR_STORAGE_KEY } from "./BottomToolbar";
const POSITIONS_STORAGE_KEY = "project_notes_card_positions";

interface WhiteboardProps {
  notes?: NoteItem[];
  selectedNoteId?: string | null;
  onSelectNote?: (noteId: string) => void;
  onUpdateNote?: (noteId: string, updates: Partial<NoteItem>) => void;
}

export default function Whiteboard({
  notes = [],
  selectedNoteId,
  onSelectNote,
  onUpdateNote,
}: WhiteboardProps) {
  const [canvasColor, setCanvasColor] = useState<string>("#ffffff");
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [cardPositions, setCardPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [controlSettings, setControlSettings] =
    useState<WhiteboardControlSettings>(getSavedWhiteboardSettings);
  const controlSettingsRef = useRef<WhiteboardControlSettings>(controlSettings);
  useEffect(() => {
    controlSettingsRef.current = controlSettings;
  }, [controlSettings]);

  useEffect(() => {
    const handleSettingsChange = () => {
      setControlSettings(getSavedWhiteboardSettings());
    };
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    return () =>
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
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

  const dragCardRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const cardPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  useEffect(() => {
    cardPositionsRef.current = cardPositions;
  }, [cardPositions]);

  const allNotes: NoteItem[] = [];
  notes.forEach((parent) => {
    allNotes.push(parent);
    if (parent.subNotes) {
      allNotes.push(...parent.subNotes);
    }
  });

  useEffect(() => {
    const savedColor = localStorage.getItem(COLOR_STORAGE_KEY);
    if (savedColor) {
      setCanvasColor(savedColor);
    }

    const savedPositions = localStorage.getItem(POSITIONS_STORAGE_KEY);
    let loaded: Record<string, { x: number; y: number }> = {};
    if (savedPositions) {
      try {
        loaded = JSON.parse(savedPositions);
      } catch {}
    }

    const initial: Record<string, { x: number; y: number }> = { ...loaded };
    let col = 0;
    notes.forEach((parent) => {
      if (!initial[parent.id]) {
        initial[parent.id] = { x: 340 + col * 360, y: 120 };
      }
      if (parent.subNotes && parent.subNotes.length > 0) {
        parent.subNotes.forEach((sub, subIdx) => {
          if (!initial[sub.id]) {
            initial[sub.id] = {
              x: initial[parent.id].x,
              y: initial[parent.id].y + 240 + subIdx * 210,
            };
          }
        });
      }
      col++;
    });

    setCardPositions(initial);
  }, [notes]);

  const handleZoomStep = (factor: number) => {
    const container = containerRef.current;
    const nextZoom = Math.min(3, Math.max(0.2, zoomRef.current * factor));
    const cx = container ? container.clientWidth / 2 : window.innerWidth / 2;
    const cy = container ? container.clientHeight / 2 : window.innerHeight / 2;
    const worldX = (cx - panRef.current.x) / zoomRef.current;
    const worldY = (cy - panRef.current.y) / zoomRef.current;
    const newPanX = cx - worldX * nextZoom;
    const newPanY = cy - worldY * nextZoom;
    setZoom(nextZoom);
    setPan({ x: newPanX, y: newPanY });
  };

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
        const newPanX = mouseX - worldX * nextZoom;
        const newPanY = mouseY - worldY * nextZoom;
        setZoom(nextZoom);
        setPan({ x: newPanX, y: newPanY });
      } else {
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        (e.target === document.body || e.target === containerRef.current)
      ) {
        isSpacePressedRef.current = true;
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
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDownRef.current = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDownRef.current = false;
      }
    };

    const handleGlobalPointerUp = () => {
      isRightMouseDownRef.current = false;
      isPanningRef.current = false;
      panOriginRef.current = null;
      setIsPanning(false);
      setIsDraggingCard(false);
      if (dragCardRef.current) {
        dragCardRef.current = null;
        try {
          localStorage.setItem(
            POSITIONS_STORAGE_KEY,
            JSON.stringify(cardPositionsRef.current),
          );
        } catch {}
      }
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
    window.addEventListener("pointerup", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, []);

  const isPanAction = (e: React.PointerEvent) => {
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
      if (dragCardRef.current) {
        dragCardRef.current = null;
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

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanAction(e)) {
      if (dragCardRef.current) {
        dragCardRef.current = null;
      }
      if (!isPanningRef.current || !panOriginRef.current) {
        isPanningRef.current = true;
        panOriginRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          initPanX: pan.x,
          initPanY: pan.y,
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

    if (dragCardRef.current) {
      const cardId = dragCardRef.current.id;
      const dx = e.clientX - dragCardRef.current.startX;
      const dy = e.clientY - dragCardRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragCardRef.current.moved = true;
      }
      const newX = dragCardRef.current.initX + dx / zoomRef.current;
      const newY = dragCardRef.current.initY + dy / zoomRef.current;
      setCardPositions((prev) => ({
        ...prev,
        [cardId]: { x: newX, y: newY },
      }));
    }
  };

  const handlePointerUp = () => {
    isPanningRef.current = false;
    panOriginRef.current = null;
    setIsPanning(false);
    setIsDraggingCard(false);

    if (dragCardRef.current) {
      const noteId = dragCardRef.current.id;
      const moved = dragCardRef.current.moved;
      dragCardRef.current = null;
      if (!moved) {
        onSelectNote?.(noteId);
      } else {
        try {
          localStorage.setItem(
            POSITIONS_STORAGE_KEY,
            JSON.stringify(cardPositions),
          );
        } catch {}
      }
    }
  };

  const handleCardPointerDown = (e: React.PointerEvent, noteId: string) => {
    if ((e.buttons & 3) === 3 || isSpacePressedRef.current || e.button !== 0) {
      return;
    }
    e.stopPropagation();
    const pos = cardPositions[noteId] || { x: 0, y: 0 };
    dragCardRef.current = {
      id: noteId,
      startX: e.clientX,
      startY: e.clientY,
      initX: pos.x,
      initY: pos.y,
      moved: false,
    };
    setIsDraggingCard(true);
  };

  const isDarkCanvas = canvasColor === "#18181b";
  const dotColor = isDarkCanvas
    ? "rgba(255, 255, 255, 0.15)"
    : "rgba(0, 0, 0, 0.08)";

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative h-full w-full overflow-hidden select-none ${
        isPanning
          ? "cursor-grabbing"
          : isSpacePressedRef.current
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
        {allNotes.map((note) => {
          const pos = cardPositions[note.id] || { x: 0, y: 0 };
          const isSelected = selectedNoteId === note.id;

          return (
            <Note
              key={note.id}
              note={note}
              isSelected={isSelected}
              onPointerDown={(e) => handleCardPointerDown(e, note.id)}
              onUpdate={(updates) => onUpdateNote?.(note.id, updates)}
              className="absolute w-80 cursor-grab active:cursor-grabbing pointer-events-auto"
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
              }}
              disableLayoutAnimation={isPanning || isDraggingCard}
            />
          );
        })}
      </div>

      <MiniMap
        notes={allNotes}
        cardPositions={cardPositions}
        selectedNoteId={selectedNoteId}
        pan={pan}
        zoom={zoom}
        onPanChange={setPan}
      />

      <BottomToolbar
        zoom={zoom}
        onZoomStep={handleZoomStep}
        onResetZoom={() => setZoom(1)}
        canvasColor={canvasColor}
        onCanvasColorChange={setCanvasColor}
      />
    </div>
  );
}
