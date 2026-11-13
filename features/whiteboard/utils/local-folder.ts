import type {
  BoardFileCategory,
  BoardFileItem,
  BoardFileSort,
  BoardItemLayout,
  DirectoryHandleLike,
  DirectoryPickerWindow,
} from "../types";

const HANDLE_DB_NAME = "project_notes_local_folder_db";
const HANDLE_STORE_NAME = "handles";
const HANDLE_KEY = "last_folder";
const LAYOUT_STORAGE_PREFIX = "project_notes_folder_layout_v1:";

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "avif",
  "bmp",
  "ico",
  "tif",
  "tiff",
  "heic",
]);

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "webm",
  "mov",
  "mkv",
  "avi",
  "m4v",
  "ogv",
]);

const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "ogg",
  "m4a",
  "flac",
  "aac",
  "opus",
]);

const IGNORED_NAMES = new Set([
  ".ds_store",
  "thumbs.db",
  "desktop.ini",
  "node_modules",
  ".git",
]);

const CATEGORY_ORDER: Record<BoardFileCategory, number> = {
  image: 0,
  video: 1,
  audio: 2,
  file: 3,
};

export const DEFAULT_CARD_WIDTHS: Record<BoardFileCategory, number> = {
  image: 260,
  video: 300,
  audio: 280,
  file: 250,
};

const ESTIMATED_HEIGHTS: Record<BoardFileCategory, number> = {
  image: 260,
  video: 235,
  audio: 118,
  file: 128,
};

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

export function classifyFile(file: File): BoardFileCategory {
  const mime = file.type.toLowerCase();
  const ext = getFileExtension(file.name);

  if (mime.startsWith("image/") || IMAGE_EXTENSIONS.has(ext)) {
    return "image";
  }
  if (mime.startsWith("video/") || VIDEO_EXTENSIONS.has(ext)) {
    return "video";
  }
  if (mime.startsWith("audio/") || AUDIO_EXTENSIONS.has(ext)) {
    return "audio";
  }
  return "file";
}

export function supportsDirectoryPicker(): boolean {
  if (typeof window === "undefined") return false;
  return typeof (window as DirectoryPickerWindow).showDirectoryPicker === "function";
}

export async function pickDirectoryHandle(): Promise<DirectoryHandleLike | null> {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
  if (!picker) return null;
  return picker({ mode: "read" });
}

function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HANDLE_STORE_NAME)) {
        db.createObjectStore(HANDLE_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDirectoryHandle(handle: DirectoryHandleLike): Promise<void> {
  try {
    const db = await openHandleDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE_NAME, "readwrite");
      tx.objectStore(HANDLE_STORE_NAME).put(handle, HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {}
}

export async function loadDirectoryHandle(): Promise<DirectoryHandleLike | null> {
  try {
    const db = await openHandleDb();
    const handle = await new Promise<DirectoryHandleLike | null>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE_NAME, "readonly");
      const req = tx.objectStore(HANDLE_STORE_NAME).get(HANDLE_KEY);
      req.onsuccess = () => resolve((req.result as DirectoryHandleLike | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return handle;
  } catch {
    return null;
  }
}

export async function clearDirectoryHandle(): Promise<void> {
  try {
    const db = await openHandleDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE_NAME, "readwrite");
      tx.objectStore(HANDLE_STORE_NAME).delete(HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {}
}

export async function verifyDirectoryPermission(handle: DirectoryHandleLike): Promise<boolean> {
  if (!handle.queryPermission || !handle.requestPermission) return true;
  const current = await handle.queryPermission({ mode: "read" });
  if (current === "granted") return true;
  const requested = await handle.requestPermission({ mode: "read" });
  return requested === "granted";
}

function shouldIgnoreEntry(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.startsWith(".") || IGNORED_NAMES.has(lower);
}

function createBoardFileItem(file: File, relativePath: string): BoardFileItem {
  const category = classifyFile(file);
  const extension = getFileExtension(file.name);
  return {
    id: `local:${relativePath}`,
    name: file.name,
    relativePath,
    category,
    mimeType: file.type || "application/octet-stream",
    extension,
    size: file.size,
    lastModified: file.lastModified,
    url: URL.createObjectURL(file),
    file,
  };
}

export async function readFolderFromHandle(
  handle: DirectoryHandleLike,
  maxFiles = 250,
): Promise<BoardFileItem[]> {
  const items: BoardFileItem[] = [];

  async function walk(dir: DirectoryHandleLike, prefix: string): Promise<void> {
    for await (const entry of dir.values()) {
      if (items.length >= maxFiles) break;
      if (shouldIgnoreEntry(entry.name)) continue;

      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.kind === "file") {
        const file = await entry.getFile();
        items.push(createBoardFileItem(file, relPath));
      } else if (entry.kind === "directory") {
        await walk(entry, relPath);
      }
    }
  }

  await walk(handle, "");
  return items;
}

export function readFolderFromFileList(
  fileList: FileList,
  maxFiles = 250,
): { folderName: string; items: BoardFileItem[] } {
  const files = Array.from(fileList);
  const firstPath = files[0]?.webkitRelativePath || "";
  const folderName = firstPath.includes("/") ? firstPath.split("/")[0] : "Selected Folder";
  const items: BoardFileItem[] = [];

  for (const file of files) {
    if (items.length >= maxFiles) break;
    const rawRel = file.webkitRelativePath || file.name;
    const parts = rawRel.split("/");
    const trimmedRel = parts.length > 1 ? parts.slice(1).join("/") : rawRel;
    if (parts.some((p) => shouldIgnoreEntry(p))) continue;
    items.push(createBoardFileItem(file, trimmedRel));
  }

  return { folderName, items };
}

export function revokeFolderUrls(items: BoardFileItem[]): void {
  for (const item of items) {
    URL.revokeObjectURL(item.url);
  }
}

export function sortBoardFiles(
  items: BoardFileItem[],
  sortBy: BoardFileSort,
): BoardFileItem[] {
  return [...items].sort((a, b) => {
    if (sortBy === "type") {
      const catDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
      if (catDiff !== 0) return catDiff;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    }
    if (sortBy === "newest") {
      return b.lastModified - a.lastModified;
    }
    if (sortBy === "size") {
      return b.size - a.size;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

export function loadSavedFolderLayout(
  folderName: string,
): Record<string, BoardItemLayout> {
  if (typeof window === "undefined" || !folderName) return {};
  try {
    const raw = localStorage.getItem(`${LAYOUT_STORAGE_PREFIX}${folderName}`);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, BoardItemLayout>;
  } catch {
    return {};
  }
}

export function saveFolderLayout(
  folderName: string,
  layout: Record<string, BoardItemLayout>,
): void {
  if (typeof window === "undefined" || !folderName) return;
  try {
    localStorage.setItem(
      `${LAYOUT_STORAGE_PREFIX}${folderName}`,
      JSON.stringify(layout),
    );
  } catch {}
}

export function computeBoardLayout(
  items: BoardFileItem[],
  startX: number,
  startY: number,
  existingWidths: Record<string, number> = {},
): Record<string, BoardItemLayout> {
  const columns = items.length <= 4 ? Math.max(1, items.length) : items.length <= 12 ? 4 : 5;
  const maxRowWidth = columns * 290;
  const gapX = 24;
  const gapY = 24;
  let cursorX = startX;
  let cursorY = startY;
  let rowMaxHeight = 0;
  const result: Record<string, BoardItemLayout> = {};

  items.forEach((item) => {
    const width = existingWidths[item.id] ?? DEFAULT_CARD_WIDTHS[item.category];
    if (cursorX > startX && cursorX + width - startX > maxRowWidth) {
      cursorX = startX;
      cursorY += rowMaxHeight + gapY;
      rowMaxHeight = 0;
    }

    result[item.id] = {
      x: Math.round(cursorX),
      y: Math.round(cursorY),
      width,
    };

    cursorX += width + gapX;
    rowMaxHeight = Math.max(rowMaxHeight, ESTIMATED_HEIGHTS[item.category]);
  });

  return result;
}
