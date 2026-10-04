import { create } from "zustand";

interface ColorPickerState {
  activePickerId: string | null;
  openColorPicker: (id: string) => void;
  closeColorPicker: () => void;
  toggleColorPicker: (id: string) => void;
}

export const useColorPickerStore = create<ColorPickerState>((set) => ({
  activePickerId: null,
  openColorPicker: (id: string) => set({ activePickerId: id }),
  closeColorPicker: () => set({ activePickerId: null }),
  toggleColorPicker: (id: string) =>
    set((state) => ({
      activePickerId: state.activePickerId === id ? null : id,
    })),
}));
