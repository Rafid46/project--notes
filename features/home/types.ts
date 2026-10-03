import type { ReactNode, MouseEvent, KeyboardEvent } from "react";

export type GridViewMode = "grid-2" | "grid-3" | "grid-4" | "grid-5" | "grid-6";
export type ViewMode = "whiteboard" | "masonry" | GridViewMode;

export interface NoteFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  color?: string;
  textColor?: string;
  category?: string;
  subNotes?: NoteItem[];
  files?: NoteFile[];
}

export interface DockItemData {
  icon: ReactNode;
  label: ReactNode;
  onClick: (e?: MouseEvent<Element> | KeyboardEvent<Element>) => void;
  className?: string;
  isActive?: boolean;
}
