import type { NoteFile } from "@/features/home/types";

export interface ProcessedFilesResult {
  title: string;
  content: string;
  files: NoteFile[];
}

export async function uploadFileToApi(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (file.size < 10 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(
          typeof reader.result === "string"
            ? reader.result
            : URL.createObjectURL(file),
        );
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    } else {
      resolve(URL.createObjectURL(file));
    }
  });
}

function isBinaryContent(text: string): boolean {
  for (let i = 0; i < Math.min(text.length, 1000); i++) {
    if (text.charCodeAt(i) === 0) return true;
  }
  return false;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (
      file.type?.startsWith("image/") ||
      file.type.startsWith("video/") ||
      file.type.startsWith("audio/") ||
      file.type === "application/pdf" ||
      file.type === "application/zip"
    ) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      if (isBinaryContent(text)) {
        resolve("");
      } else {
        resolve(text);
      }
    };
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });
}

export async function processDroppedFiles(
  fileList: FileList | File[],
): Promise<ProcessedFilesResult> {
  const files = Array.from(fileList);
  if (files.length === 0) {
    return { title: "Untitled Note", content: "", files: [] };
  }

  const processedFiles: NoteFile[] = [];
  const textContents: string[] = [];

  for (const file of files) {
    const fileUrl = await uploadFileToApi(file);
    const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    processedFiles.push({
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      url: fileUrl,
    });

    const text = await readFileAsText(file);
    if (text.trim()) {
      textContents.push(text);
    }
  }

  const primaryFile = files[0];
  const nameWithoutExt = primaryFile.name.replace(/\.[^/.]+$/, "");
  const title = nameWithoutExt || primaryFile.name;
  const content = textContents.join("\n\n");

  return {
    title,
    content,
    files: processedFiles,
  };
}
