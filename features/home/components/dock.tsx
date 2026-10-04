"use client";

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
} from "framer-motion";
import React, {
  Children,
  cloneElement,
  useMemo,
  useRef,
} from "react";
import type { DockItemData } from "../types";

export interface DockProps {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
}

interface DockItemProps {
  className?: string;
  children: React.ReactNode;
  onClick?: (
    e?: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
  ) => void;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
  label?: React.ReactNode;
  isActive?: boolean;
}

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  label,
  isActive,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - rect.width / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize],
  );
  const size = useSpring(targetSize, spring);
  const scale = useTransform(size, (s) => s / baseItemSize);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <motion.div
      ref={ref}
      style={{
        scale,
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={(e) => onClick?.(e)}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 transition-colors cursor-pointer select-none text-xs font-medium focus:outline-none ${
        isActive
          ? "bg-background text-foreground font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
      } ${className}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
      aria-label={typeof label === "string" ? label : undefined}
    >
      {Children.map(children, (child) =>
        React.isValidElement(child) && typeof child.type !== "string"
          ? cloneElement(
              child as React.ReactElement<{ isHovered?: MotionValue<number> }>,
              { isHovered },
            )
          : child,
      )}
    </motion.div>
  );
}

interface DockIconProps {
  className?: string;
  children: React.ReactNode;
}

function DockIcon({ children, className = "" }: DockIconProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
}

export default function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 44,
  distance = 150,
  panelHeight = 52,
  dockHeight = 60,
  baseItemSize = 36,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + 12),
    [dockHeight, magnification],
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div
      style={{ height, scrollbarWidth: "none" }}
      className="flex items-center justify-center"
    >
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`${className} flex items-center justify-center gap-4 rounded-full bg-secondary px-4 pl-3 shadow-xs`}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            label={item.label}
            isActive={item.isActive}
          >
            <DockIcon>{item.icon}</DockIcon>
            <span className="whitespace-nowrap font-semibold text-sm">
              {item.label}
            </span>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}
