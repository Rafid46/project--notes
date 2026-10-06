"use client";

import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Tag, X, Loader2, Paperclip } from "lucide-react";
import type { LinkPreviewMetadata, NoteFile } from "../../home/types";
import LinkPreviewCard from "@/features/notes/components/LinkPreviewCard";
import {
  extractUrls,
  getLinkPreview,
} from "@/features/notes/utils/link-preview";
import { processDroppedFiles } from "@/features/notes/utils/file-handler";
import CustomColorPicker from "@/components/common/ColorPicker";

interface NotePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: {
    title: string;
    content: string;
    color?: string;
    category?: string;
    parentId: string | null;
    linkPreviews?: LinkPreviewMetadata[];
    files?: NoteFile[];
  }) => void;
  parentId: string | null;
  anchorRect: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  } | null;
  initialTitle?: string;
  initialContent?: string;
  initialFiles?: NoteFile[];
}

const COLORS = [
  "#a1a1aa",
  "#f59e0b",
  "#0284c7",
  "#9333ea",
  "#10b981",
  "#ef4444",
];

export default function CreateNotePopover({
  isOpen,
  onClose,
  onSave,
  parentId,
  initialTitle = "",
  initialContent = "",
  initialFiles,
}: NotePopoverProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [category, setCategory] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [labels, setLabels] = useState(["Work", "Personal", "Design"]);
  const [error, setError] = useState("");
  const [linkPreviews, setLinkPreviews] = useState<LinkPreviewMetadata[]>([]);
  const [files, setFiles] = useState<NoteFile[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchingUrlsRef = useRef<Set<string>>(new Set());
  const prevIsOpenRef = useRef(false);

  const stateRef = useRef({
    title,
    content,
    color,
    category,
    linkPreviews,
    files,
  });
  useEffect(() => {
    stateRef.current = { title, content, color, category, linkPreviews, files };
  }, [title, content, color, category, linkPreviews, files]);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setTitle(initialTitle || "");
      setContent(initialContent || "");
      setColor(COLORS[0]);
      setCategory("");
      setIsCategoryOpen(false);
      setError("");
      setLinkPreviews([]);
      setFiles(initialFiles || []);
      setIsLoadingPreview(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialTitle, initialContent, initialFiles]);

  useEffect(() => {
    if (!isOpen) return;

    const saveAndClose = () => {
      const {
        title: currentTitle,
        content: currentContent,
        color: currentColor,
        category: currentCategory,
        linkPreviews: currentLinkPreviews,
        files: currentFiles,
      } = stateRef.current;

      if (
        currentTitle.trim() ||
        currentContent.trim() ||
        currentLinkPreviews.length > 0 ||
        currentFiles.length > 0
      ) {
        onSave({
          title: currentTitle.trim() || "Untitled Note",
          content: currentContent,
          color: currentColor,
          category: currentCategory.trim() || undefined,
          parentId,
          linkPreviews:
            currentLinkPreviews.length > 0 ? currentLinkPreviews : undefined,
          files: currentFiles.length > 0 ? currentFiles : undefined,
        });
      }
      onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        saveAndClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") saveAndClose();
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, onSave, parentId]);

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

  if (!isOpen) return null;

  const handleSave = () => {
    if (
      !title.trim() &&
      !content.trim() &&
      linkPreviews.length === 0 &&
      files.length === 0
    ) {
      onClose();
      return;
    }

    setError("");
    onSave({
      title: title.trim() || "Untitled Note",
      content,
      color,
      category: category.trim() || undefined,
      parentId,
      linkPreviews: linkPreviews.length > 0 ? linkPreviews : undefined,
      files: files.length > 0 ? files : undefined,
    });
    onClose();
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      const {
        title: fileTitle,
        content: fileContent,
        files: newFiles,
      } = await processDroppedFiles(e.clipboardData.files);
      if (!title.trim() && fileTitle) {
        setTitle(fileTitle);
      }
      if (fileContent) {
        setContent((prev) =>
          prev ? `${prev}\n\n${fileContent}` : fileContent,
        );
      }
      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
      }
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

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    const {
      title: fileTitle,
      content: fileContent,
      files: newFiles,
    } = await processDroppedFiles(selected);
    if (!title.trim() && fileTitle) {
      setTitle(fileTitle);
    }
    if (fileContent) {
      setContent((prev) => (prev ? `${prev}\n\n${fileContent}` : fileContent));
    }
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = "";
  };

  const handlePopoverDrop = async (e: React.DragEvent) => {
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      const {
        title: fileTitle,
        content: fileContent,
        files: newFiles,
      } = await processDroppedFiles(e.dataTransfer.files);
      if (!title.trim() && fileTitle) {
        setTitle(fileTitle);
      }
      if (fileContent) {
        setContent((prev) =>
          prev ? `${prev}\n\n${fileContent}` : fileContent,
        );
      }
      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
      }
    }
  };

  return (
    <div
      ref={popoverRef}
      onDrop={handlePopoverDrop}
      onDragOver={(e) => e.preventDefault()}
      className="absolute top-[96px] left-1/2 z-50 -translate-x-1/2 flex w-[600px] max-h-[85vh] flex-col rounded-2xl bg-popover p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {category && (
        <div className="absolute -top-3 right-6 bg-blue-500 px-4 py-1.5 rounded-2xl text-xs font-bold text-white flex items-center gap-2 z-20 shadow-md">
          {category}
          <button
            onClick={() => setCategory("")}
            className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
            aria-label="Remove category"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2.5 shrink-0">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0 transition-colors"
          style={{ backgroundColor: color }}
        />
        {parentId && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Subnote
          </span>
        )}
      </div>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleTitleKeyDown}
        onPaste={handlePaste}
        autoFocus
        className="w-full text-base font-semibold text-foreground placeholder-muted-foreground outline-none bg-transparent shrink-0"
      />

      <div className="flex-1 overflow-y-auto min-h-0 pr-1 mt-2 custom-scrollbar flex flex-col">
        <textarea
          placeholder="Take a note or paste a link..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handlePaste}
          rows={5}
          className="w-full text-sm leading-relaxed text-muted-foreground placeholder-muted-foreground outline-none resize-none bg-transparent"
        />

        {isLoadingPreview && (
          <div className="mt-2.5 p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center gap-2.5 animate-pulse shrink-0">
            <Loader2
              size={16}
              className="animate-spin text-muted-foreground shrink-0"
            />
            <span className="text-xs text-muted-foreground">
              Loading link preview...
            </span>
          </div>
        )}

        {linkPreviews.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-2 shrink-0">
            {linkPreviews.map((preview) => (
              <LinkPreviewCard
                key={preview.url}
                preview={preview}
                onRemove={() =>
                  setLinkPreviews((prev) =>
                    prev.filter((p) => p.url !== preview.url),
                  )
                }
              />
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-3 border-t border-border pt-3 shrink-0">
            {files.some((f) => f.type.startsWith("image/")) && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {files
                  .filter((f) => f.type.startsWith("image/"))
                  .map((file) => (
                    <div
                      key={file.id}
                      className="relative group/file rounded-lg overflow-hidden border border-border bg-muted/30 aspect-video"
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-between p-1 text-white">
                        <span className="text-[10px] truncate max-w-[70%] font-medium">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFiles((prev) =>
                              prev.filter((f) => f.id !== file.id),
                            )
                          }
                          className="p-1 hover:bg-white/20 rounded cursor-pointer text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {files
                .filter((f) => !f.type.startsWith("image/"))
                .map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/40 text-xs"
                  >
                    <Paperclip size={12} className="text-muted-foreground" />
                    <span className="font-medium truncate max-w-[150px]">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((prev) => prev.filter((f) => f.id !== file.id))
                      }
                      className="p-0.5 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <span className="mt-2 text-xs text-red-500 shrink-0">{error}</span>
      )}

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
                color === c
                  ? "border-zinc-400 scale-110"
                  : "border-transparent hover:scale-110"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
          <CustomColorPicker
            value={color}
            onChange={(newColor) => setColor(newColor)}
            placement="top"
            trigger={
              <div
                title="Custom color"
                className="flex h-4 w-4 items-center justify-center rounded-full border border-dashed border-zinc-400 hover:scale-110 transition-transform cursor-pointer"
              >
                <span className="text-[10px] leading-none text-muted-foreground font-bold">
                  +
                </span>
              </div>
            }
          />
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Add file or image"
          >
            <ImageIcon size={22} />
          </button>
          <button
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className={`rounded p-1 transition-colors cursor-pointer ${
              isCategoryOpen
                ? "bg-muted text-foreground"
                : "hover:bg-muted hover:text-foreground"
            }`}
            aria-label="Add label"
          >
            <Tag size={22} />
          </button>
        </div>
      </div>

      {isCategoryOpen && (
        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3 shrink-0">
          <h4 className="text-sm font-medium text-foreground px-1">Labels</h4>

          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto custom-scrollbar">
            {labels.map((label) => (
              <label
                key={label}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={category === label}
                  onChange={() => setCategory(category === label ? "" : label)}
                  className="rounded border-zinc-500 text-blue-500 focus:ring-blue-500 bg-transparent cursor-pointer"
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              placeholder="Create new label..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newLabel.trim()) {
                  e.preventDefault();
                  if (!labels.includes(newLabel.trim())) {
                    setLabels([...labels, newLabel.trim()]);
                  }
                  setCategory(newLabel.trim());
                  setNewLabel("");
                }
              }}
              className="flex-1 text-sm px-3 py-2 bg-muted rounded-lg outline-none text-foreground border border-transparent focus:border-border transition-colors"
            />
            <button
              onClick={() => {
                if (newLabel.trim()) {
                  if (!labels.includes(newLabel.trim())) {
                    setLabels([...labels, newLabel.trim()]);
                  }
                  setCategory(newLabel.trim());
                  setNewLabel("");
                }
              }}
              className="text-sm font-medium bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
