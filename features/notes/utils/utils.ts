import { useState, useEffect, useRef } from "react";
import type { LinkPreviewMetadata, NoteFile } from "../../home/types";
import { processDroppedFiles } from "./file-handler";
import { extractUrls, getLinkPreview } from "./link-preview";

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
