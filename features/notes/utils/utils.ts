import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Archive,
  FileCode,
  Video,
  Music,
  File,
} from "lucide-react";
import type { LinkPreviewMetadata, NoteFile } from "../../home/types";
import { processDroppedFiles } from "./file-handler";
import { extractUrls, getLinkPreview } from "./link-preview";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(
  mimeType: string,
  filename: string,
): React.ReactElement {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (mimeType.includes("pdf") || ext === "pdf") {
    return React.createElement(FileText, {
      className: "text-red-500 shrink-0",
      size: 16,
    });
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("rar") ||
    mimeType.includes("compressed") ||
    ["zip", "rar", "7z", "tar", "gz"].includes(ext)
  ) {
    return React.createElement(Archive, {
      className: "text-amber-500 shrink-0",
      size: 16,
    });
  }
  if (
    mimeType.includes("code") ||
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("html") ||
    [
      "js",
      "ts",
      "tsx",
      "jsx",
      "json",
      "html",
      "css",
      "py",
      "rs",
      "go",
      "cpp",
      "c",
    ].includes(ext)
  ) {
    return React.createElement(FileCode, {
      className: "text-emerald-500 shrink-0",
      size: 16,
    });
  }
  if (
    mimeType.startsWith("video/") ||
    ["mp4", "webm", "mkv", "mov"].includes(ext)
  ) {
    return React.createElement(Video, {
      className: "text-purple-500 shrink-0",
      size: 16,
    });
  }
  if (
    mimeType.startsWith("audio/") ||
    ["mp3", "wav", "ogg", "m4a", "flac"].includes(ext)
  ) {
    return React.createElement(Music, {
      className: "text-pink-500 shrink-0",
      size: 16,
    });
  }
  return React.createElement(File, {
    className: "text-blue-500 shrink-0",
    size: 16,
  });
}

export function getCardTextColor(colorStr?: string): {
  title: string;
  body: string;
  subtext: string;
} {
  if (!colorStr) {
    return {
      title: "text-foreground group-hover:text-blue-600",
      body: "text-muted-foreground",
      subtext: "text-muted-foreground",
    };
  }

  let isDark = false;
  if (colorStr.startsWith("#")) {
    let hex = colorStr.slice(1);
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const num = parseInt(hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    isDark = luma < 140;
  } else if (colorStr.startsWith("hsl")) {
    const match = colorStr.match(/hsl[a]?\([^,]+,[^,]+,\s*([0-9.]+)%/);
    if (match) {
      const l = parseFloat(match[1]);
      isDark = l < 50;
    }
  }

  if (isDark) {
    return {
      title: "text-white font-semibold",
      body: "text-white/85",
      subtext: "text-white/70",
    };
  }

  return {
    title: "text-zinc-900 font-semibold group-hover:text-blue-600",
    body: "text-zinc-700",
    subtext: "text-zinc-600",
  };
}

export function useCreateNoteForm({
  initialTitle = "",
  initialContent = "",
  initialFiles = [],
  isOpen,
}: {
  initialTitle?: string;
  initialContent?: string;
  initialFiles?: NoteFile[];
  isOpen: boolean;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<NoteFile[]>([]);
  const [linkPreviews, setLinkPreviews] = useState<LinkPreviewMetadata[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const fetchingUrlsRef = useRef<Set<string>>(new Set());
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setTitle(initialTitle || "");
      setContent(initialContent || "");
      setLinkPreviews([]);
      setFiles(initialFiles || []);
      setIsLoadingPreview(false);
      fetchingUrlsRef.current.clear();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialTitle, initialContent, initialFiles]);

  useEffect(() => {
    if (!isOpen) return;

    const urls = [...extractUrls(content), ...extractUrls(title)];
    if (urls.length === 0) return;

    for (const url of urls) {
      const existing = linkPreviews.find((p) => p.url === url);
      if ((existing && existing.image) || fetchingUrlsRef.current.has(url)) {
        continue;
      }
      fetchingUrlsRef.current.add(url);
      setIsLoadingPreview(true);
      getLinkPreview(url)
        .then((preview) => {
          if (preview) {
            setLinkPreviews((prev) =>
              prev.some((p) => p.url === preview.url)
                ? prev.map((p) => (p.url === preview.url ? preview : p))
                : [...prev, preview],
            );
            setTitle((currentTitle) => {
              if (!currentTitle.trim() && preview.title) {
                return preview.title;
              }
              return currentTitle;
            });
          }
        })
        .finally(() => {
          fetchingUrlsRef.current.delete(url);
          setIsLoadingPreview(false);
        });
    }
  }, [isOpen, content, title, linkPreviews]);

  const handleFiles = async (newFilesList: FileList | File[]) => {
    const {
      title: fileTitle,
      content: fileContent,
      files: newFiles,
    } = await processDroppedFiles(newFilesList);

    if (!title.trim() && fileTitle) {
      setTitle(fileTitle);
    }
    if (fileContent) {
      setContent((prev) => (prev ? `${prev}\n\n${fileContent}` : fileContent));
    }
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      await handleFiles(Array.from(e.clipboardData.files));
      return;
    }

    const text = e.clipboardData.getData("text");
    if (!text) return;
    const urls = extractUrls(text);
    if (urls.length === 0) return;

    setIsLoadingPreview(true);
    try {
      for (const url of urls) {
        const existing = linkPreviews.find((p) => p.url === url);
        if ((existing && existing.image) || fetchingUrlsRef.current.has(url)) {
          continue;
        }
        fetchingUrlsRef.current.add(url);
        try {
          const preview = await getLinkPreview(url);
          if (preview) {
            setLinkPreviews((prev) =>
              prev.some((p) => p.url === preview.url)
                ? prev.map((p) => (p.url === preview.url ? preview : p))
                : [...prev, preview],
            );
            setTitle((currentTitle) => {
              if (!currentTitle.trim() && preview.title) {
                return preview.title;
              }
              return currentTitle;
            });
          }
        } finally {
          fetchingUrlsRef.current.delete(url);
        }
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    await handleFiles(Array.from(selected));
    e.target.value = "";
  };

  const handlePopoverDrop = async (e: React.DragEvent) => {
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  return {
    title,
    setTitle,
    content,
    setContent,
    files,
    setFiles,
    linkPreviews,
    setLinkPreviews,
    isLoadingPreview,
    handlePaste,
    handleFileInputChange,
    handlePopoverDrop,
  };
}
