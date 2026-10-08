export interface NoteAttachmentPayload {
  fileName: string;
  mimeType: string;
  storageKey: string;
}
export interface NotePayload {
  title?: string;
  content?: string;
  plainText?: string;
  labels?: any;
  background?: string;
  headerColor?: string;
  headerFont?: string;
  boardX?: number;
  boardY?: number;
  sortOrder?: number;
  parentId?: string | null;
  labelId?: string;
  attachments?: NoteAttachmentPayload[];
}

