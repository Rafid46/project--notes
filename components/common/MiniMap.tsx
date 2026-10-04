"use client";

import { useEffect, useState } from "react";
import type { NoteItem } from "@/features/home/types";

const MINIMAP_W = 160;
const MINIMAP_H = 112;
const MINIMAP_SCALE = 0.02;

interface MiniMapProps {
  notes?: NoteItem[];
  cardPositions?: Record<string, { x: number; y: number }>;
  selectedNoteId?: string | null;
  pan: { x: number; y: number };
  zoom: number;
  onPanChange: (pan: { x: number; y: number }) => void;
  className?: string;
}

export default function MiniMap({
  notes = [],
  cardPositions = {},
  selectedNoteId,
  pan,
  zoom,
  onPanChange,
  className,
}: MiniMapProps) {
  const [viewportSize, setViewportSize] = useState({ width: 1000, height: 800 });

  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const mmCx = MINIMAP_W / 2;
  const mmCy = MINIMAP_H / 2;

  const vpW = viewportSize.width / zoom;
  const vpH = viewportSize.height / zoom;
  const vpX = -pan.x / zoom;
  const vpY = -pan.y / zoom;

  const mmVpX = mmCx + vpX * MINIMAP_SCALE;
  const mmVpY = mmCy + vpY * MINIMAP_SCALE;
  const mmVpW = vpW * MINIMAP_SCALE;
  const mmVpH = vpH * MINIMAP_SCALE;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = rect.width / MINIMAP_W;
    const scaleY = rect.height / MINIMAP_H;
    const clickX = (e.clientX - rect.left) / scaleX;
    const clickY = (e.clientY - rect.top) / scaleY;

    const inViewport =
      clickX >= mmVpX &&
      clickX <= mmVpX + mmVpW &&
      clickY >= mmVpY &&
      clickY <= mmVpY + mmVpH;

    let initPanX = pan.x;
    let initPanY = pan.y;

    if (!inViewport) {
      const worldX = (clickX - mmCx) / MINIMAP_SCALE;
      const worldY = (clickY - mmCy) / MINIMAP_SCALE;
      const screenCx = window.innerWidth / 2;
      const screenCy = window.innerHeight / 2;
      initPanX = screenCx - worldX * zoom;
      initPanY = screenCy - worldY * zoom;
      onPanChange({ x: initPanX, y: initPanY });
    }

    const startX = e.clientX;
    const startY = e.clientY;

    const handlePointerMove = (ev: PointerEvent) => {
      ev.preventDefault();
      const dx = (ev.clientX - startX) / scaleX;
      const dy = (ev.clientY - startY) / scaleY;
      onPanChange({
        x: initPanX - (dx / MINIMAP_SCALE) * zoom,
        y: initPanY - (dy / MINIMAP_SCALE) * zoom,
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  return (
    <div
      className={
        className ||
        "fixed bottom-[88px] right-5 z-50 overflow-hidden rounded-xl border border-black/10 bg-white/90 shadow-lg backdrop-blur-md cursor-grab active:cursor-grabbing transition-transform hover:scale-105 touch-none select-none"
      }
      style={{ width: MINIMAP_W, height: MINIMAP_H }}
      onPointerDown={handlePointerDown}
      title="Minimap - Click or drag to navigate"
    >
      {notes.map((note) => {
        const pos = cardPositions[note.id] || { x: 0, y: 0 };
        const mx = mmCx + pos.x * MINIMAP_SCALE;
        const my = mmCy + pos.y * MINIMAP_SCALE;
        const isSelected = selectedNoteId === note.id;

        return (
          <div
            key={`minimap-${note.id}`}
            className={`absolute rounded-sm pointer-events-none ${isSelected ? "bg-blue-500" : "bg-zinc-400"}`}
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
  );
}
export { MiniMap };
