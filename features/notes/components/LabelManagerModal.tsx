import React, { useState } from "react";
import { Tag, Edit2, Trash2, X, Check, Plus } from "lucide-react";
import {
  useLabels,
  useUpdateLabel,
  useDeleteLabel,
  useCreateLabel,
} from "../hooks/useLabels";
import type { Label } from "@/features/home/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LabelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LabelManagerModal({
  isOpen,
  onClose,
}: LabelManagerModalProps) {
  const { data: labels = [], isLoading } = useLabels();
  const [newLabelName, setNewLabelName] = useState("");
  const createLabel = useCreateLabel();

  const handleCreateLabel = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newLabelName.trim()) return;

    createLabel.mutate(
      { name: newLabelName },
      {
        onSuccess: () => {
          setNewLabelName("");
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md p-6 !rounded-[20px]"
        overlayClassName="bg-black/15 !backdrop-blur-[1px]"
      >
        <DialogHeader className="flex flex-row items-center gap-2 space-y-0 mb-4">
          <Tag size={20} className="mt-1" />
          <DialogTitle>Manage Labels</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleCreateLabel}
          className="relative flex items-center mb-4"
        >
          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="Create new label..."
            className="w-full bg-background border border-border rounded-full pl-4 pr-24 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={createLabel.isPending || !newLabelName.trim()}
            className="absolute right-1.5 flex items-center justify-center gap-1 bg-primary text-primary-foreground px-3.5 py-1.5 rounded-full hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer text-xs font-medium"
          >
            <Plus size={14} />
            Create
          </button>
        </form>

        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 w-full rounded-lg bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : labels.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No labels found
          </div>
        ) : (
          <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
            {labels.map((label) => (
              <LabelItem key={label.id} label={label} />
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LabelItem({ label }: { label: Label }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(label.name);
  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();

  const handleSave = () => {
    if (editName.trim() === "" || editName === label.name) {
      setIsEditing(false);
      return;
    }
    updateLabel.mutate(
      { id: label.id, name: editName },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete the label "${label.name}"?`,
      )
    ) {
      deleteLabel.mutate(label.id);
    }
  };

  return (
    <li className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50 hover:border-border transition-colors group">
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1 mr-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={updateLabel.isPending}
            className="p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditName(label.name);
            }}
            className="p-1.5 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 overflow-hidden">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: label.color || "#ccc" }}
            />
            <span className="text-sm font-medium truncate">{label.name}</span>
          </div>
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
              title="Edit Label"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteLabel.isPending}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              title="Delete Label"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </>
      )}
    </li>
  );
}
