"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { NoteItem } from "@/features/home/types";

const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <span className="text-sm font-medium text-zinc-500">Loading whiteboard...</span>
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
const POSITIONS_STORAGE_KEY = "project_notes_card_positions";

interface WhiteboardProps {
  notes?: NoteItem[];
  selectedNoteId?: string | null;
  initialData?: ExcalidrawInitialDataState | null;
}

export default function Whiteboard({
  notes = [],
  selectedNoteId,
  initialData,
}: WhiteboardProps) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [canvasColor, setCanvasColor] = useState<string>("#ffffff");
  const [initialElements, setInitialElements] = useState<readonly ExcalidrawElement[] | null>(null);
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(COLOR_STORAGE_KEY);
    if (saved) {
      setCanvasColor(saved);
      if (api) {
        api.updateScene({ appState: { viewBackgroundColor: saved } });
      }
    }
  }, [api]);

  useEffect(() => {
    if (initialData?.elements && initialData.elements.length > 0) {
      setInitialElements(initialData.elements);
      return;
    }

    let isMounted = true;
    import("@excalidraw/excalidraw").then(({ convertToExcalidrawElements }) => {
      if (!isMounted) return;

      const savedPositions: Record<string, { x: number; y: number }> = (() => {
        try {
          const item = localStorage.getItem(POSITIONS_STORAGE_KEY);
          return item ? (JSON.parse(item) as Record<string, { x: number; y: number }>) : {};
        } catch {
          return {};
        }
      })();

      type SkeletonsType = Parameters<typeof convertToExcalidrawElements>[0];
      const skeletons: NonNullable<SkeletonsType> = [];
      let col = 0;

      notes.forEach((parent) => {
        const parentPos = savedPositions[parent.id];
        const px = parentPos?.x ?? 80 + col * 340;
        const py = parentPos?.y ?? 80;

        skeletons.push({
          type: "rectangle",
          id: parent.id,
          x: px,
          y: py,
          width: 300,
          height: 180,
          backgroundColor: parent.color || "#fef3c7",
          strokeColor: "#71717a",
          fillStyle: "solid",
          roundness: { type: 3 },
          label: {
            text: `${parent.title}\n\n${parent.content}`,
            fontSize: 16,
          },
        });

        if (parent.subNotes && parent.subNotes.length > 0) {
          parent.subNotes.forEach((sub, subIdx) => {
            const subPos = savedPositions[sub.id];
            const sx = subPos?.x ?? px;
            const sy = subPos?.y ?? py + 220 + subIdx * 200;

            skeletons.push({
              type: "rectangle",
              id: sub.id,
              x: sx,
              y: sy,
              width: 300,
              height: 160,
              backgroundColor: sub.color || "#e0f2fe",
              strokeColor: "#71717a",
              fillStyle: "solid",
              roundness: { type: 3 },
              label: {
                text: `${sub.title}\n\n${sub.content}`,
                fontSize: 15,
              },
            });
          });
        }

        col++;
      });

      const converted = convertToExcalidrawElements(skeletons, {
        regenerateIds: false,
      });

      setInitialElements(converted);
    });

    return () => {
      isMounted = false;
    };
  }, [notes, initialData]);

  useEffect(() => {
    if (!api || !initialElements || initialElements.length === 0 || hasCenteredRef.current) return;
    hasCenteredRef.current = true;
    setTimeout(() => {
      api.scrollToContent(initialElements, { fitToViewport: true, animate: false });
    }, 100);
  }, [api, initialElements]);

  useEffect(() => {
    if (!api || !selectedNoteId) return;
    const sceneElements = api.getSceneElements();
    const target = sceneElements.find((el) => el.id === selectedNoteId);
    if (target) {
      api.scrollToContent(target, { animate: true });
    }
  }, [api, selectedNoteId]);

  const handleColorChange = (newColor: string) => {
    setCanvasColor(newColor);
    try {
      localStorage.setItem(COLOR_STORAGE_KEY, newColor);
    } catch {}
    if (api) {
      api.updateScene({ appState: { viewBackgroundColor: newColor } });
    }
  };

  const handleChange = (
    elements: readonly ExcalidrawElement[],
    _appState: AppState,
    _files: BinaryFiles
  ) => {
    const positions: Record<string, { x: number; y: number }> = {};
    elements.forEach((el) => {
      if (el.id && !el.isDeleted) {
        positions[el.id] = { x: el.x, y: el.y };
      }
    });
    try {
      localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
    } catch {}
  };

  if (!initialElements) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <span className="text-sm font-medium text-zinc-500">Loading whiteboard notes...</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Excalidraw
        excalidrawAPI={(excalidrawApi) => setApi(excalidrawApi)}
        initialData={{
          elements: initialElements,
          appState: {
            viewBackgroundColor: canvasColor,
            zenModeEnabled: true,
            showWelcomeScreen: false,
          },
        }}
        onChange={handleChange}
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
