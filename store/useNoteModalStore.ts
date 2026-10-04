import { create } from "zustand";

interface NoteModalState {
  isOpen: boolean;
  selectedNoteId: string | null;
  openNoteModal: (noteId?: string) => void;
  closeNoteModal: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setSelectedNoteId: (noteId: string | null) => void;
}

export const useNoteModalStore = create<NoteModalState>((set) => ({
  isOpen: false,
  selectedNoteId: null,
  openNoteModal: (noteId) =>
    set({
      isOpen: true,
      ...(noteId !== undefined ? { selectedNoteId: noteId } : {}),
    }),
  closeNoteModal: () => set({ isOpen: false }),
  setIsOpen: (isOpen) => set({ isOpen }),
  setSelectedNoteId: (selectedNoteId) => set({ selectedNoteId }),
}));
