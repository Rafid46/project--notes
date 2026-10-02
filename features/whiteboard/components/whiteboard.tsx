"use client";

import { useEffect, useRef, useState } from "react";
import type { NoteItem } from "@/features/home/types";
import Note from "@/features/notes/components/Note";

const CANVAS_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Cream", value: "#fdfbf7" },
  { label: "Soft Gray", value: "#f4f4f5" },
  { label: "Light Mint", value: "#f0fdf4" },
  { label: "Light Blue", value: "#f0f9ff" },
  { label: "Dark", value: "#18181b" },
];

const COLOR_STORAGE_KEY = "project_notes_canvas_color";
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
  const [cardPositions, setCardPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

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

  useEffect(() => {
    if (!selectedNoteId) return;
    const target = cardPositions[selectedNoteId];
    if (target) {
      setPan({
        x: window.innerWidth / 2 - (target.x + 160) * zoomRef.current,
        y: window.innerHeight / 2 - (target.y + 100) * zoomRef.current,
      });
    }
  }, [selectedNoteId]);

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
      const isRightClickHeld =
        (e.buttons & 2) === 2 || isRightMouseDownRef.current;
      if (isRightClickHeld || e.ctrlKey || e.metaKey) {
        const zoomFactor = Math.exp(-e.deltaY * 0.003);
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
        if (e.key === "=" || e.key === "+" || e.code === "NumpadAdd") {
          e.preventDefault();
          handleZoomStep(1.2);
        } else if (
          e.key === "-" ||
          e.key === "_" ||
          e.code === "NumpadSubtract"
        ) {
          e.preventDefault();
          handleZoomStep(1 / 1.2);
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

  const handleColorChange = (newColor: string) => {
    setCanvasColor(newColor);
    try {
      localStorage.setItem(COLOR_STORAGE_KEY, newColor);
    } catch {}
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const bothButtons = (e.buttons & 3) === 3;
    const isMiddle = e.button === 1 || e.buttons === 4;
    const isSpace = isSpacePressedRef.current && (e.buttons & 1) === 1;

    if (bothButtons || isMiddle || isSpace) {
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
    const bothButtons = (e.buttons & 3) === 3;
    const isMiddle = e.buttons === 4;
    const isSpace = isSpacePressedRef.current && (e.buttons & 1) === 1;

    if (bothButtons || isMiddle || isSpace) {
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

    if (isPanningRef.current && !bothButtons && !isMiddle && !isSpace) {
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
  };

  const isDarkCanvas = canvasColor === "#18181b";
  const dotColor = isDarkCanvas
    ? "rgba(255, 255, 255, 0.15)"
    : "rgba(0, 0, 0, 0.08)";

  const MINIMAP_W = 160;
  const MINIMAP_H = 112;
  const MINIMAP_SCALE = 0.02;
  const mmCx = MINIMAP_W / 2;
  const mmCy = MINIMAP_H / 2;

  const vpW = typeof window !== "undefined" ? window.innerWidth / zoom : 1000 / zoom;
  const vpH = typeof window !== "undefined" ? window.innerHeight / zoom : 800 / zoom;
  const vpX = -pan.x / zoom;
  const vpY = -pan.y / zoom;

  const mmVpX = mmCx + vpX * MINIMAP_SCALE;
  const mmVpY = mmCy + vpY * MINIMAP_SCALE;
  const mmVpW = vpW * MINIMAP_SCALE;
  const mmVpH = vpH * MINIMAP_SCALE;

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldX = (clickX - mmCx) / MINIMAP_SCALE;
    const worldY = (clickY - mmCy) / MINIMAP_SCALE;

    const screenCx = window.innerWidth / 2;
    const screenCy = window.innerHeight / 2;

    setPan({
      x: screenCx - worldX * zoom,
      y: screenCy - worldY * zoom,
    });
  };

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
            />
          );
        })}
      </div>

      <div
        className="fixed bottom-[88px] right-5 z-50 overflow-hidden rounded-xl border border-black/10 bg-white/90 shadow-lg backdrop-blur-md cursor-pointer transition-transform hover:scale-105"
        style={{ width: MINIMAP_W, height: MINIMAP_H }}
        onClick={handleMinimapClick}
        title="Minimap - Click to navigate"
      >
        {allNotes.map((note) => {
          const pos = cardPositions[note.id] || { x: 0, y: 0 };
          const mx = mmCx + pos.x * MINIMAP_SCALE;
          const my = mmCy + pos.y * MINIMAP_SCALE;
          const isSelected = selectedNoteId === note.id;

          return (
            <div
              key={`minimap-${note.id}`}
              className={`absolute rounded-sm ${isSelected ? "bg-blue-500" : "bg-zinc-400"}`}
              style={{
                left: mx,
                top: my,
                width: 320 * MINIMAP_SCALE,
                height: 160 * MINIMAP_SCALE,
              }}
            />
          );
        })}

        <div
          className="absolute border-2 border-blue-500/50 bg-blue-500/10 rounded-sm pointer-events-none"
          style={{
            left: mmVpX,
            top: mmVpY,
            width: mmVpW,
            height: mmVpH,
          }}
        />
      </div>

      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
        <div className="flex h-[50px] cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 shadow-lg backdrop-blur-md text-sm font-medium text-zinc-700">
          <button
            type="button"
            onClick={() => handleZoomStep(1 / 1.2)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 active:scale-95 transition-transform text-lg"
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="min-w-[48px] px-1 py-1 text-center hover:text-zinc-900"
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => handleZoomStep(1.2)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 active:scale-95 transition-transform text-lg"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        <div className="flex h-[50px] cursor-pointer items-center gap-2.5 rounded-full border border-black/10 bg-white/90 px-4 shadow-lg backdrop-blur-md">
          {CANVAS_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => handleColorChange(c.value)}
              className={`h-7 w-7 rounded-full border border-black/15 transition-transform hover:scale-110 active:scale-95 ${
                canvasColor === c.value
                  ? "ring-2 ring-blue-500 ring-offset-2"
                  : ""
              }`}
              style={{ backgroundColor: c.value }}
              aria-label={c.label}
            />
          ))}
          <label
            title="Custom Color"
            className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-dashed border-zinc-400 bg-transparent transition-transform hover:scale-110 active:scale-95"
          >
            <span className="text-sm font-semibold leading-none text-zinc-600">
              +
            </span>
            <input
              type="color"
              value={canvasColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
