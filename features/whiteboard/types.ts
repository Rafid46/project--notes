export type BoardFileCategory = "image" | "video" | "audio" | "file";

export type BoardFileFilter = "all" | BoardFileCategory;

export type BoardFileSort = "type" | "name" | "newest" | "size";

export interface BoardFileItem {
  id: string;
  name: string;
  relativePath: string;
  category: BoardFileCategory;
  mimeType: string;
  extension: string;
  size: number;
  lastModified: number;
  url: string;
  file: File;
}

export interface BoardItemLayout {
  x: number;
  y: number;
  width: number;
}

export type PermissionStateMode = "granted" | "denied" | "prompt";

export interface FileHandleLike {
  kind: "file";
  name: string;
  getFile: () => Promise<File>;
}

export interface DirectoryHandleLike {
  kind: "directory";
  name: string;
  values: () => AsyncIterable<FileHandleLike | DirectoryHandleLike>;
  queryPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionStateMode>;
  requestPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionStateMode>;
}

export interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<DirectoryHandleLike>;
}

