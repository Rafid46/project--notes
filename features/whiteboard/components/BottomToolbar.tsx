"use client";

import CustomColorPicker from "@/components/common/ColorPicker";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Minus, Plus } from "lucide-react";

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
        className || "fixed bottom-5 right-5 z-30 flex items-center gap-2"
      }
    >
      <div className="flex h-11 items-center gap-0.5 rounded-full border border-border/80 bg-background/85 px-1.5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md text-xs font-medium text-muted-foreground dark:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.45)]">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onZoomStep(1 / 1.2)}
              aria-label="Zoom out"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-secondary hover:text-foreground active:scale-95 cursor-pointer"
            >
              <Minus size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Zoom out</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onResetZoom}
              className="min-w-12 rounded-full px-2 py-1 text-center font-mono text-xs font-medium text-foreground transition-colors hover:bg-secondary cursor-pointer"
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
              aria-label="Zoom in"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-secondary hover:text-foreground active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Zoom in</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex h-11 items-center gap-2 rounded-full border border-border/80 bg-background/85 px-3 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md dark:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.45)]">
        {CANVAS_COLORS.map((c) => (
          <Tooltip key={c.value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => handleColorChange(c.value)}
                aria-label={`Canvas color ${c.label}`}
                className={`h-6 w-6 rounded-full border border-black/15 dark:border-white/20 transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                  canvasColor === c.value
                    ? "ring-2 ring-foreground/80 ring-offset-2 ring-offset-background"
                    : ""
                }`}
                style={{ backgroundColor: c.value }}
              />
            </TooltipTrigger>
            <TooltipContent>{c.label}</TooltipContent>
          </Tooltip>
        ))}
        <span aria-hidden="true" className="h-4 w-px bg-border" />
        <CustomColorPicker
          value={canvasColor}
          onChange={handleColorChange}
          placement="top"
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-dashed border-muted-foreground/60 text-muted-foreground transition-all hover:scale-110 hover:border-foreground hover:text-foreground active:scale-95">
                  <Plus size={12} />
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
