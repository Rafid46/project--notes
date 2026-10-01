"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import type {
  ExcalidrawInitialDataState,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";

const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <span className="text-sm font-medium text-zinc-500">
          Loading whiteboard...
        </span>
      </div>
    ),
  },
);

const CANVAS_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Cream", value: "#fdfbf7" },
  { label: "Soft Gray", value: "#f4f4f5" },
  { label: "Light Mint", value: "#f0fdf4" },
  { label: "Light Blue", value: "#f0f9ff" },
  { label: "Dark", value: "#18181b" },
];

const COLOR_STORAGE_KEY = "project_notes_canvas_color";

interface WhiteboardProps {
  initialData?: ExcalidrawInitialDataState | null;
}

export default function Whiteboard({ initialData }: WhiteboardProps) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [canvasColor, setCanvasColor] = useState<string>("#ffffff");

  useEffect(() => {
    const saved = localStorage.getItem(COLOR_STORAGE_KEY);
    if (saved) {
      setCanvasColor(saved);
      if (api) {
        api.updateScene({ appState: { viewBackgroundColor: saved } });
      }
    }
  }, [api]);

  const handleColorChange = (newColor: string) => {
    setCanvasColor(newColor);
    try {
      localStorage.setItem(COLOR_STORAGE_KEY, newColor);
    } catch {}
    if (api) {
      api.updateScene({ appState: { viewBackgroundColor: newColor } });
    }
  };

  return (
    <div className="relative h-full w-full">
      <Excalidraw
        excalidrawAPI={(excalidrawApi) => setApi(excalidrawApi)}
        initialData={initialData}
        zenModeEnabled={true}
      />
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 p-1.5 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/90">
        {CANVAS_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            onClick={() => handleColorChange(c.value)}
            className={`h-6 w-6 rounded-full border border-black/15 transition-transform hover:scale-110 active:scale-95 ${
              canvasColor === c.value ? "ring-2 ring-blue-500 ring-offset-2" : ""
            }`}
            style={{ backgroundColor: c.value }}
            aria-label={c.label}
          />
        ))}
        <label
          title="Custom Color"
          className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-dashed border-zinc-400 bg-transparent transition-transform hover:scale-110 active:scale-95 dark:border-zinc-500"
        >
          <span className="text-xs font-semibold leading-none text-zinc-600 dark:text-zinc-300">+</span>
          <input
            type="color"
            value={canvasColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}
