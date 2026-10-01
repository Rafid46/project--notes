import type { ReactNode } from "react";

export type ViewMode = "whiteboard" | "masonry" | "grid-2" | "grid-4";

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  color?: string;
  subNotes?: NoteItem[];
}

export interface DockItemData {
  icon: ReactNode;
  label: ReactNode;
  onClick: () => void;
  className?: string;
}
