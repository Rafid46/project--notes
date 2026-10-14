"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { NoteItem } from "@/features/home/types";
import NoteCard from "./NoteCard";

export interface NoteModalProps {
  note?: NoteItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNote: (noteId: string, updates: Partial<NoteItem>) => void;
}

export default function NoteModal({
  note,
  isOpen,
  onClose,
  onUpdateNote,
}: NoteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && note && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
            <NoteCard
              note={note}
              isModal
              onClose={onClose}
              onUpdate={(updates) => onUpdateNote(note.id, updates)}
            />
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
