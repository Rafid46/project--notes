import type { NoteItem } from "@/features/home/types";

export function getActiveNote(
  notes: NoteItem[],
  selectedNoteId: string,
): NoteItem | undefined {
  return (
    notes.find((n) => n.id === selectedNoteId) ||
    notes
      .flatMap((n) => n.subNotes || [])
      .find((s) => s.id === selectedNoteId) ||
    notes[0]
  );
}

export function addNoteToState(
  prevNotes: NoteItem[],
  newNoteData: {
    title: string;
    content: string;
    color?: string;
    parentId: string | null;
  },
): NoteItem[] {
  const newNote: NoteItem = {
    id: `note-${Date.now()}`,
    title: newNoteData.title,
    content: newNoteData.content,
    color: newNoteData.color,
    parentId: newNoteData.parentId,
    subNotes: [],
  };

  if (newNote.parentId) {
    return prevNotes.map((note) => {
      if (note.id === newNote.parentId) {
        return {
          ...note,
          subNotes: [...(note.subNotes || []), newNote],
        };
      }
      return note;
    });
  } else {
    return [...prevNotes, newNote];
  }
}

export function updateNoteInState(
  prevNotes: NoteItem[],
  noteId: string,
  updates: Partial<NoteItem>
): NoteItem[] {
  return prevNotes.map((note) => {
    if (note.id === noteId) {
      return { ...note, ...updates };
    }
    if (note.subNotes && note.subNotes.length > 0) {
      return {
        ...note,
        subNotes: note.subNotes.map((sub) =>
          sub.id === noteId ? { ...sub, ...updates } : sub
        ),
      };
    }
    return note;
  });
}
