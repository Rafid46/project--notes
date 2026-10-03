"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type ColorSpace = "hsb" | "hsl" | "rgb";
export type ColorChannel =
  | "hue"
  | "saturation"
  | "brightness"
  | "lightness"
  | "red"
  | "green"
  | "blue"
  | "alpha";

interface HSBColor {
  h: number;
  s: number;
  b: number;
  a: number;
}

function parseToHSB(colorStr: string): HSBColor {
  if (colorStr.startsWith("hsla") || colorStr.startsWith("hsl")) {
    const match = colorStr.match(/hsla?\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(/[\s,/%]+/).filter(Boolean);
      const h = parseFloat(parts[0]) || 0;
      const s = (parseFloat(parts[1]) || 0) / 100;
      const l = (parseFloat(parts[2]) || 0) / 100;
      const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
      const val = l + s * Math.min(l, 1 - l);
      const sat = val === 0 ? 0 : 2 * (1 - l / val);
      return {
        h: Math.round(h),
        s: Math.min(1, Math.max(0, sat)),
        b: Math.min(1, Math.max(0, val)),
        a,
      };
    }
  }

  if (colorStr.startsWith("#")) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const num = parseInt(hex, 16);
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    if (max !== min) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s, b: v, a: 1 };
  }

  return { h: 220, s: 0.9, b: 0.9, a: 0.8 };
}

function hsbToHsl(hsb: HSBColor): {
  h: number;
  s: number;
  l: number;
  a: number;
} {
  const l = hsb.b * (1 - hsb.s / 2);
  const s = l === 0 || l === 1 ? 0 : (hsb.b - l) / Math.min(l, 1 - l);
  return {
    h: Math.round(hsb.h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: hsb.a,
  };
}

function hsbToRgb(hsb: HSBColor): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  const h = hsb.h / 360;
  const s = hsb.s;
  const v = hsb.b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0;
  let g = 0;
  let b = 0;
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: hsb.a,
  };
}

function hsbToCss(hsb: HSBColor): string {
  const hsl = hsbToHsl(hsb);
  return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a})`;
}

interface ColorPickerContextValue {
  hsb: HSBColor;
  setHsb: React.Dispatch<React.SetStateAction<HSBColor>>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  cssColor: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  updateChannel: (
    channel: ColorChannel,
    val: number,
    space: ColorSpace,
  ) => void;
  setColor: (color: string) => void;
}

export const DEFAULT_PRESET_COLORS: string[] = [
  "#ffffff",
  "#f4f4f5",
  "#fee2e2",
  "#ffedd5",
  "#fef9c3",
  "#dcfce7",
  "#e0f2fe",
  "#f3e8ff",
  "#18181b",
  "#64748b",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#0284c7",
  "#9333ea",
];

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);

export function useColorPickerContext(): ColorPickerContextValue {
  const ctx = useContext(ColorPickerContext);
  if (!ctx) {
    throw new Error(
      "HeroUI ColorPicker components must be used within ColorPicker",
    );
  }
  return ctx;
}

export interface ColorPickerProps {
  children?: ReactNode;
  defaultValue?: string;
  value?: string;
  onChange?: (color: string) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function ColorPicker({
  children,
  defaultValue = "hsla(220, 90%, 50%, 0.8)",
  value,
  onChange,
  onOpenChange,
  className = "",
}: ColorPickerProps) {
  const [internalHsb, setInternalHsb] = useState<HSBColor>(() =>
    parseToHSB(value || defaultValue),
  );
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const handleSetIsOpen = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  useEffect(() => {
    if (value !== undefined) {
      setInternalHsb(parseToHSB(value));
    }
  }, [value]);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        handleSetIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleDown);
    };
  }, [isOpen]);

  const cssColor = hsbToCss(internalHsb);

  const handleSetHsb: React.Dispatch<React.SetStateAction<HSBColor>> = (
    action,
  ) => {
    setInternalHsb((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      onChange?.(hsbToCss(next));
      return next;
    });
  };

  const updateChannel = (
    channel: ColorChannel,
    val: number,
    space: ColorSpace,
  ) => {
    if (space === "hsb") {
      handleSetHsb((prev) => {
        if (channel === "hue") return { ...prev, h: val };
        if (channel === "saturation") return { ...prev, s: val / 100 };
        if (channel === "brightness") return { ...prev, b: val / 100 };
        return prev;
      });
    } else if (space === "hsl") {
      const currentHsl = hsbToHsl(internalHsb);
      const newHsl = {
        h: channel === "hue" ? val : currentHsl.h,
        s: channel === "saturation" ? val : currentHsl.s,
        l: channel === "lightness" ? val : currentHsl.l,
        a: currentHsl.a,
      };
      const s = newHsl.s / 100;
      const l = newHsl.l / 100;
      const b = l + s * Math.min(l, 1 - l);
      const sat = b === 0 ? 0 : 2 * (1 - l / b);
      handleSetHsb({ h: newHsl.h, s: sat, b, a: newHsl.a });
    } else if (space === "rgb") {
      const currentRgb = hsbToRgb(internalHsb);
      const newRgb = {
        r: channel === "red" ? val / 255 : currentRgb.r / 255,
        g: channel === "green" ? val / 255 : currentRgb.g / 255,
        b: channel === "blue" ? val / 255 : currentRgb.b / 255,
        a: currentRgb.a,
      };
      const max = Math.max(newRgb.r, newRgb.g, newRgb.b);
      const min = Math.min(newRgb.r, newRgb.g, newRgb.b);
      const d = max - min;
      let h = 0;
      const s = max === 0 ? 0 : d / max;
      const v = max;
      if (max !== min) {
        switch (max) {
          case newRgb.r:
            h = (newRgb.g - newRgb.b) / d + (newRgb.g < newRgb.b ? 6 : 0);
            break;
          case newRgb.g:
            h = (newRgb.b - newRgb.r) / d + 2;
            break;
          case newRgb.b:
            h = (newRgb.r - newRgb.g) / d + 4;
            break;
        }
        h /= 6;
      }
      handleSetHsb({ h: Math.round(h * 360), s, b: v, a: newRgb.a });
    }
  };

  const setColor = (colorStr: string) => {
    const parsed = parseToHSB(colorStr);
    handleSetHsb(parsed);
  };

  return (
    <ColorPickerContext.Provider
      value={{
        hsb: internalHsb,
        setHsb: handleSetHsb,
        isOpen,
        setIsOpen: handleSetIsOpen,
        cssColor,
        triggerRef,
        popoverRef,
        updateChannel,
        setColor,
      }}
    >
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
      >
        {children}
      </div>
    </ColorPickerContext.Provider>
  );
}

ColorPicker.Trigger = function ColorPickerTrigger({
  children,
  className,
  asChild = false,
}: {
  children?: ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const { isOpen, setIsOpen, triggerRef } = useColorPickerContext();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  if (asChild || React.isValidElement(children)) {
    if (React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        onClick?: (e: React.MouseEvent<HTMLElement>) => void;
        ref?: React.Ref<HTMLElement>;
        className?: string;
      }>;
      return React.cloneElement(child, {
        ref: triggerRef,
        className: className
          ? `${child.props?.className || ""} ${className}`.trim()
          : child.props?.className,
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          child.props?.onClick?.(e);
          handleClick(e);
        },
      });
    }
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      className={
        className ||
        "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted cursor-pointer"
      }
    >
      {children}
    </button>
  );
};

ColorPicker.Popover = function ColorPickerPopover({
  children,
  placement = "bottom",
  align = "end",
  className = "",
}: {
  children?: ReactNode;
  placement?: "top" | "bottom";
  align?: "start" | "end" | "center";
  className?: string;
}) {
  const { isOpen, popoverRef } = useColorPickerContext();
  if (!isOpen) return null;
  const vClass = placement === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const hClass =
    align === "center"
      ? "left-1/2 -translate-x-1/2"
      : align === "start"
        ? "left-0"
        : "right-0";
  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={`absolute ${vClass} ${hClass} z-50 flex w-64 flex-col rounded-2xl border border-border bg-card p-3 shadow-2xl backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
};

export function ColorPickerPresets({
  colors = DEFAULT_PRESET_COLORS,
  className = "",
}: {
  colors?: string[];
  className?: string;
}) {
  const { setColor } = useColorPickerContext();
  const palette = colors && colors.length > 0 ? colors : DEFAULT_PRESET_COLORS;

  return (
    <div
      className={`flex flex-col gap-1.5 pt-1.5 border-t border-border/50 ${className}`}
    >
      <span className="text-[11px] font-medium text-muted-foreground select-none">
        Preset Colors
      </span>
      <div className="grid grid-cols-8 gap-1.5">
        {palette.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setColor(color)}
            className="h-5 w-full rounded-md border border-border/70 transition-transform hover:scale-110 active:scale-95 cursor-pointer outline-none"
            style={{ backgroundColor: color }}
            title={color}
            aria-label={color}
          />
        ))}
      </div>
    </div>
  );
}

ColorPicker.Presets = ColorPickerPresets;

export function ColorSwatch({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { cssColor } = useColorPickerContext();
  const sizeClasses =
    size === "lg"
      ? "h-7 w-7 rounded-lg"
      : size === "sm"
        ? "h-4 w-4 rounded-sm"
        : "h-5 w-5 rounded-md";

  return (
    <span
      className={`inline-block border border-border shrink-0 shadow-xs ${sizeClasses} ${className}`}
      style={{ backgroundColor: cssColor }}
    />
  );
}

export function Label({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`text-xs font-medium text-foreground select-none ${className}`}
    >
      {children}
    </span>
  );
}

export function ColorArea({
  colorSpace: _colorSpace,
  xChannel: _xChannel,
  yChannel: _yChannel,
  className = "",
  children,
}: {
  colorSpace?: ColorSpace;
  xChannel?: ColorChannel;
  yChannel?: ColorChannel;
  className?: string;
  children?: ReactNode;
}) {
  const { hsb, setHsb } = useColorPickerContext();
  const areaRef = useRef<HTMLDivElement | null>(null);

  const handlePointer = (e: PointerEvent | ReactPointerEvent) => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const s = x / rect.width;
    const b = 1 - y / rect.height;
    setHsb((prev) => ({ ...prev, s, b }));
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointer(e);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      handlePointer(e);
    }
  };

  const pureHueColor = `hsl(${hsb.h}, 100%, 50%)`;

  return (
    <div
      ref={areaRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className={`relative h-36 w-full cursor-crosshair rounded-xl overflow-hidden touch-none select-none border border-border ${className}`}
      style={{ backgroundColor: pureHueColor }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />

      {children}
    </div>
  );
}

ColorArea.Thumb = function ColorAreaThumb() {
  const { hsb, cssColor } = useColorPickerContext();
  const left = `${hsb.s * 100}%`;
  const top = `${(1 - hsb.b) * 100}%`;

  return (
    <div
      className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md pointer-events-none ring-1 ring-black/30"
      style={{
        left,
        top,
        backgroundColor: cssColor,
      }}
    />
  );
};

export function ColorSlider({
  channel: _channel,
  colorSpace: _colorSpace,
  className = "",
  children,
}: {
  channel?: ColorChannel;
  colorSpace?: ColorSpace;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>{children}</div>
  );
}

ColorSlider.Output = function ColorSliderOutput({
  className = "",
}: {
  className?: string;
}) {
  const { hsb } = useColorPickerContext();
  return (
    <span className={`text-[11px] self-end ${className}`}>
      {Math.round(hsb.h)}°
    </span>
  );
};

ColorSlider.Track = function ColorSliderTrack({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { setHsb } = useColorPickerContext();
  const trackRef = useRef<HTMLDivElement | null>(null);

  const handlePointer = (e: PointerEvent | ReactPointerEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const h = Math.round((x / rect.width) * 360);
    setHsb((prev) => ({ ...prev, h }));
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointer(e);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      handlePointer(e);
    }
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className={`relative h-4 w-full cursor-pointer rounded-full select-none touch-none border border-border ${className}`}
      style={{
        background:
          "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
      }}
    >
      {children}
    </div>
  );
};

ColorSlider.Thumb = function ColorSliderThumb() {
  const { hsb } = useColorPickerContext();
  const left = `${(hsb.h / 360) * 100}%`;

  return (
    <div
      className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md pointer-events-none ring-1 ring-black/30"
      style={{
        left,
        backgroundColor: `hsl(${hsb.h}, 100%, 50%)`,
      }}
    />
  );
};

interface SelectContextValue {
  value: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onChange?: (val: string) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

export function Select({
  "aria-label": _ariaLabel,
  value,
  variant: _variant,
  onChange,
  children,
  className = "",
}: {
  "aria-label"?: string;
  value: string;
  variant?: string;
  onChange?: (val: string) => void;
  children?: ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleDown);
    };
  }, [isOpen]);

  return (
    <SelectContext.Provider value={{ value, isOpen, setIsOpen, onChange }}>
      <div ref={containerRef} className={`relative w-full ${className}`}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

Select.Trigger = function SelectTrigger({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  return (
    <button
      type="button"
      onClick={() => ctx.setIsOpen(!ctx.isOpen)}
      className={`flex h-8 w-full items-center justify-between rounded-lg border border-border bg-secondary px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
};

Select.Value = function SelectValue({
  className = "",
}: {
  className?: string;
}) {
  const ctx = useContext(SelectContext);
  return <span className={`text-xs ${className}`}>{ctx?.value}</span>;
};

Select.Indicator = function SelectIndicator() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
};

Select.Popover = function SelectPopover({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  const ctx = useContext(SelectContext);
  if (!ctx?.isOpen) return null;
  return (
    <div
      className={`absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover p-1 shadow-lg backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
};

export function ListBox({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-col gap-0.5 ${className}`}>{children}</div>;
}

ListBox.Item = function ListBoxItem({
  id,
  textValue,
  children,
  className = "",
}: {
  key?: string;
  id: string;
  textValue?: string;
  children?: ReactNode;
  className?: string;
}) {
  const ctx = useContext(SelectContext);
  const isSelected = ctx?.value === id;

  return (
    <button
      type="button"
      onClick={() => {
        ctx?.onChange?.(id);
        ctx?.setIsOpen(false);
      }}
      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted cursor-pointer ${
        isSelected
          ? "bg-muted font-semibold text-foreground"
          : "text-muted-foreground"
      } ${className}`}
    >
      <span>{children}</span>
    </button>
  );
};

ListBox.ItemIndicator = function ListBoxItemIndicator() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-foreground"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};

interface ColorFieldContextValue {
  channel: ColorChannel;
  colorSpace: ColorSpace;
}

const ColorFieldContext = createContext<ColorFieldContextValue | null>(null);

export function ColorField({
  "aria-label": _ariaLabel,
  channel,
  colorSpace,
  children,
  className = "",
}: {
  "aria-label"?: string;
  channel: ColorChannel;
  colorSpace: ColorSpace;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <ColorFieldContext.Provider value={{ channel, colorSpace }}>
      <div className={`flex flex-col items-center gap-1 ${className}`}>
        {children}
      </div>
    </ColorFieldContext.Provider>
  );
}

ColorField.Group = function ColorFieldGroup({
  variant: _variant,
  children,
  className = "",
}: {
  variant?: string;
  children?: ReactNode;
  className?: string;
}) {
  return <div className={`w-full ${className}`}>{children}</div>;
};

ColorField.Input = function ColorFieldInput({
  className = "",
}: {
  className?: string;
}) {
  const fieldCtx = useContext(ColorFieldContext);
  const { hsb, updateChannel } = useColorPickerContext();

  if (!fieldCtx) return null;
  const { channel, colorSpace } = fieldCtx;

  let displayValue = 0;
  let max = 100;
  if (colorSpace === "hsb") {
    if (channel === "hue") {
      displayValue = Math.round(hsb.h);
      max = 360;
    } else if (channel === "saturation") {
      displayValue = Math.round(hsb.s * 100);
      max = 100;
    } else if (channel === "brightness") {
      displayValue = Math.round(hsb.b * 100);
      max = 100;
    }
  } else if (colorSpace === "hsl") {
    const hsl = hsbToHsl(hsb);
    if (channel === "hue") {
      displayValue = hsl.h;
      max = 360;
    } else if (channel === "saturation") {
      displayValue = hsl.s;
      max = 100;
    } else if (channel === "lightness") {
      displayValue = hsl.l;
      max = 100;
    }
  } else if (colorSpace === "rgb") {
    const rgb = hsbToRgb(hsb);
    max = 255;
    if (channel === "red") displayValue = rgb.r;
    if (channel === "green") displayValue = rgb.g;
    if (channel === "blue") displayValue = rgb.b;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Math.min(max, parseInt(e.target.value, 10) || 0));
    updateChannel(channel, val, colorSpace);
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="number"
        value={displayValue}
        onChange={handleChange}
        min={0}
        max={max}
        className={`h-7 w-full rounded-md border border-border bg-secondary px-1 text-center text-xs text-foreground outline-none transition-colors focus:border-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
      />
      <span className="mt-0.5 text-[10px] uppercase text-muted-foreground">
        {channel[0]}
      </span>
    </div>
  );
};
