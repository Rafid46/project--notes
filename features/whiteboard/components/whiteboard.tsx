"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

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

interface WhiteboardProps {
  initialData?: ExcalidrawInitialDataState | null;
}

export default function Whiteboard({ initialData }: WhiteboardProps) {
  return (
    <div className="h-full w-full">
      <Excalidraw initialData={initialData} />
    </div>
  );
}
