import type { Metadata } from "next";
import FolderWhiteboard from "@/features/whiteboard/components/FolderWhiteboard";

export const metadata: Metadata = {
  title: "Folder Board - project - notes",
  description:
    "Browse, sort, resize, and arrange local folder images, videos, and files on an infinite inspiration whiteboard.",
};

export default function BoardPage() {
  return <FolderWhiteboard />;
}

