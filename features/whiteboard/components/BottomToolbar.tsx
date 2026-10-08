"use client";

import CustomColorPicker from "@/components/common/ColorPicker";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export const COLOR_STORAGE_KEY = "project_notes_canvas_color";

export const CANVAS_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Cream", value: "#fdfbf7" },
  { label: "Soft Gray", value: "#f4f4f5" },
  { label: "Light Mint", value: "#f0fdf4" },
  { label: "Light Blue", value: "#f0f9ff" },
  { label: "Dark", value: "#18181b" },
];

interface BottomToolbarProps {
  zoom: number;
  onZoomStep: (factor: number) => void;
  onResetZoom: () => void;
  canvasColor: string;
  onCanvasColorChange: (color: string) => void;
  className?: string;
}

export default function BottomToolbar({
  zoom,
  onZoomStep,
  onResetZoom,
  canvasColor,
  onCanvasColorChange,
  className,
}: BottomToolbarProps) {
  const handleColorChange = (newColor: string) => {
    onCanvasColorChange(newColor);
    try {
      localStorage.setItem(COLOR_STORAGE_KEY, newColor);
    } catch {}
  };

  return (
    <div
      className={
        className || "fixed bottom-5 right-5 z-50 flex items-center gap-2"
      }
    >
      <div className="flex h-[50px] cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 shadow-lg backdrop-blur-md text-sm font-medium text-zinc-700">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onZoomStep(1 / 1.2)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 active:scale-95 transition-transform text-lg"
            >
              -
            </button>
          </TooltipTrigger>
          <TooltipContent>Zoom out</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onResetZoom}
              className="min-w-[48px] px-1 py-1 text-center hover:text-zinc-900"
            >
              {Math.round(zoom * 100)}%
            </button>
          </TooltipTrigger>
          <TooltipContent>Reset zoom</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onZoomStep(1.2)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 active:scale-95 transition-transform text-lg"
            >
              +
            </button>
          </TooltipTrigger>
          <TooltipContent>Zoom in</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex h-[50px]  items-center gap-2.5 rounded-full border border-black/10 bg-white/90 px-4 shadow-lg backdrop-blur-md">
        {CANVAS_COLORS.map((c) => (
          <Tooltip key={c.value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => handleColorChange(c.value)}
                className={`h-7 w-7 rounded-full border border-black/15 transition-transform hover:scale-110 active:scale-95 ${
                  canvasColor === c.value
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : ""
                }`}
                style={{ backgroundColor: c.value }}
              />
            </TooltipTrigger>
            <TooltipContent>{c.label}</TooltipContent>
          </Tooltip>
        ))}
        <CustomColorPicker
          value={canvasColor}
          onChange={handleColorChange}
          placement="top"
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-dashed border-zinc-400 bg-transparent transition-transform hover:scale-110 active:scale-95"
                >
                  <span className="text-sm font-semibold leading-none text-zinc-600">
                    +
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Custom Color</TooltipContent>
            </Tooltip>
          }
        />
      </div>
    </div>
  );
}
export { BottomToolbar };
