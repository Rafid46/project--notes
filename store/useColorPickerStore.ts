import { create } from "zustand";

interface ColorPickerState {
  activePickerId: string | null;
  activeNoteId: string | null;
  openColorPicker: (id: string, noteId?: string | null) => void;
  closeColorPicker: () => void;
  toggleColorPicker: (id: string, noteId?: string | null) => void;
}

export const useColorPickerStore = create<ColorPickerState>((set) => ({
  activePickerId: null,
  activeNoteId: null,
  openColorPicker: (id: string, noteId?: string | null) =>
    set({ activePickerId: id, activeNoteId: noteId ?? null }),
  closeColorPicker: () =>
    set({ activePickerId: null, activeNoteId: null }),
  toggleColorPicker: (id: string, noteId?: string | null) =>
    set((state) => ({
      activePickerId: state.activePickerId === id ? null : id,
      activeNoteId: state.activePickerId === id ? null : (noteId ?? null),
    })),
}));
