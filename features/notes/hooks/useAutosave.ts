import { useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/axios";
import { NOTES } from "@/constants/api.constant";
import { useAutosaveStore, SaveSnapshot } from "@/store/useAutosaveStore";
import type { NoteItem } from "@/features/home/types";
import type { NotePayload } from "@/types/Note-type";

const AUTOSAVE_DEBOUNCE_MS = 800;
const AUTOSAVE_MAX_INTERVAL_MS = 5000;
const LOCAL_STORAGE_INTERVAL_MS = 300;

const getBackupKey = (noteId: string) => `autosave_draft_${noteId}`;

const saveToLocalStorage = (
  noteId: string,
  snapshot: SaveSnapshot & { serverId?: string },
) => {
  try {
    const data = JSON.stringify({ ...snapshot, timestamp: Date.now() });
    localStorage.setItem(getBackupKey(noteId), data);
  } catch (err) {
    console.error("Failed to write autosave backup to localStorage", err);
  }
};

const clearLocalStorage = (noteId: string) => {
  try {
    localStorage.removeItem(getBackupKey(noteId));
  } catch (err) {}
};

export function useAutosave({
  onUpdateNoteState,
}: {
  onUpdateNoteState?: (noteId: string, updates: Partial<NoteItem>) => void;
}) {
  const { setTask, updateTask } = useAutosaveStore();
  const timersRef = useRef<
    Record<
      string,
      {
        debounce: NodeJS.Timeout | null;
        maxInterval: NodeJS.Timeout | null;
        localSave: NodeJS.Timeout | null;
      }
    >
  >({});

  const triggerSave = useCallback(
    async (id: string) => {
      const task = useAutosaveStore.getState().tasks[id];
      if (!task || !task.pendingSnapshot || task.isRequestInFlight) return;

      const snapshotToSave = task.pendingSnapshot;

      if (
        task.isCreating &&
        !snapshotToSave.title.trim() &&
        !snapshotToSave.content.trim()
      ) {
        return;
      }

      updateTask(id, {
        isRequestInFlight: true,
        pendingSnapshot: null,
        latestSnapshot: snapshotToSave,
        lastSaveAttempt: Date.now(),
      });

      try {
        const payload: NotePayload = {
          title: snapshotToSave.title,
          content: snapshotToSave.content,
          plainText: snapshotToSave.content.replace(/<[^>]+>/g, ""),
          ...(task.parentId ? { parentId: task.parentId } : {}),
          ...(snapshotToSave.labelId !== undefined
            ? { labelId: snapshotToSave.labelId }
            : {}),
        };

        if (task.isCreating) {
          if (task.parentId && task.parentId.startsWith("temp-")) {
            const parentTask = useAutosaveStore.getState().tasks[task.parentId];
            if (parentTask && parentTask.serverId) {
              task.parentId = parentTask.serverId;
              updateTask(id, { parentId: parentTask.serverId });
              payload.parentId = parentTask.serverId;
            } else {
              updateTask(id, {
                isRequestInFlight: false,
                pendingSnapshot: snapshotToSave,
              });
              setTimeout(() => triggerSave(id), 1000);
              return;
            }
          }

          const { data } = await api.post(NOTES.create, payload);
          const serverId =
            data?.note?.id ||
            data?.id ||
            data?._id ||
            data?.notes?.id ||
            data?.notes?._id;

          if (serverId) {
            updateTask(id, {
              isCreating: false,
              serverId,
              isRequestInFlight: false,
              retryCount: 0,
            });

            if (onUpdateNoteState) {
              onUpdateNoteState(id, { id: serverId });
            }
          } else {
            throw new Error("No server ID returned");
          }
        } else {
          const targetId = task.serverId || id;
          await api.put(NOTES.update(targetId), payload);
          updateTask(id, { isRequestInFlight: false, retryCount: 0 });
        }

        clearLocalStorage(id);

        const latestTask = useAutosaveStore.getState().tasks[id];
        if (latestTask && latestTask.pendingSnapshot) {
          triggerSave(id);
        }
      } catch (err: any) {
        console.error("Autosave failed", err);
        const latestTask = useAutosaveStore.getState().tasks[id];
        const newerPending = latestTask.pendingSnapshot;
        updateTask(id, {
          isRequestInFlight: false,
          pendingSnapshot: newerPending || snapshotToSave,
          retryCount: task.retryCount + 1,
        });

        if (task.retryCount < 5) {
          setTimeout(
            () => triggerSave(id),
            Math.pow(2, task.retryCount) * 1000,
          );
        }
      }
    },
    [updateTask, onUpdateNoteState],
  );

  const registerChange = useCallback(
    (
      id: string,
      updates: {
        title?: string;
        content?: string;
        labelId?: string | null;
        category?: string | null;
      },
      options?: { isCreating?: boolean; parentId?: string | null },
    ) => {
      let task = useAutosaveStore.getState().tasks[id];

      if (!task) {
        task = {
          id,
          isCreating: options?.isCreating || false,
          isRequestInFlight: false,
          latestSnapshot: {
            title: updates.title || "",
            content: updates.content || "",
            revision: 1,
            labelId: updates.labelId,
            category: updates.category,
          },
          pendingSnapshot: {
            title: updates.title || "",
            content: updates.content || "",
            revision: 1,
            labelId: updates.labelId,
            category: updates.category,
          },
          lastSaveAttempt: 0,
          retryCount: 0,
          parentId: options?.parentId,
        };
        setTask(id, task);
      } else {
        const newRev = task.latestSnapshot.revision + 1;
        const newSnapshot = {
          title:
            updates.title !== undefined
              ? updates.title
              : task.pendingSnapshot?.title || task.latestSnapshot.title,
          content:
            updates.content !== undefined
              ? updates.content
              : task.pendingSnapshot?.content || task.latestSnapshot.content,
          labelId:
            updates.labelId !== undefined
              ? updates.labelId
              : task.pendingSnapshot?.labelId || task.latestSnapshot.labelId,
          category:
            updates.category !== undefined
              ? updates.category
              : task.pendingSnapshot?.category || task.latestSnapshot.category,
          revision: newRev,
        };
        updateTask(id, { pendingSnapshot: newSnapshot });
      }

      if (!timersRef.current[id]) {
        timersRef.current[id] = {
          debounce: null,
          maxInterval: null,
          localSave: null,
        };
      }
      const t = timersRef.current[id];

      if (t.debounce) clearTimeout(t.debounce);
      if (!t.maxInterval) {
        t.maxInterval = setTimeout(() => {
          triggerSave(id);
          if (t.maxInterval) {
            clearTimeout(t.maxInterval);
            t.maxInterval = null;
          }
        }, AUTOSAVE_MAX_INTERVAL_MS);
      }

      t.debounce = setTimeout(() => {
        triggerSave(id);
        if (t.maxInterval) {
          clearTimeout(t.maxInterval);
          t.maxInterval = null;
        }
      }, AUTOSAVE_DEBOUNCE_MS);

      if (t.localSave) clearTimeout(t.localSave);
      t.localSave = setTimeout(() => {
        const currentTask = useAutosaveStore.getState().tasks[id];
        if (currentTask?.pendingSnapshot) {
          saveToLocalStorage(id, {
            ...currentTask.pendingSnapshot,
            serverId: currentTask.serverId,
          });
        }
      }, LOCAL_STORAGE_INTERVAL_MS);

      if (onUpdateNoteState) {
        onUpdateNoteState(id, updates);
      }
    },
    [setTask, updateTask, triggerSave, onUpdateNoteState],
  );

  const restoreBackups = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith("autosave_draft_"),
      );
      for (const k of keys) {
        const item = localStorage.getItem(k);
        if (item) {
          const parsed = JSON.parse(item);
          const noteId = k.replace("autosave_draft_", "");

          let task = useAutosaveStore.getState().tasks[noteId];
          if (!task) {
            task = {
              id: noteId,
              serverId: parsed.serverId,
              isCreating: !parsed.serverId,
              isRequestInFlight: false,
              latestSnapshot: {
                title: parsed.title,
                content: parsed.content,
                revision: parsed.revision,
                labelId: parsed.labelId,
                category: parsed.category,
              },
              pendingSnapshot: {
                title: parsed.title,
                content: parsed.content,
                revision: parsed.revision,
                labelId: parsed.labelId,
                category: parsed.category,
              },
              lastSaveAttempt: 0,
              retryCount: 0,
            };
            setTask(noteId, task);
          }
          if (onUpdateNoteState) {
            onUpdateNoteState(noteId, {
              title: parsed.title,
              content: parsed.content,
              labelId: parsed.labelId,
              category: parsed.category,
            });
          }
          triggerSave(noteId);
        }
      }
    } catch (err) {
      console.error("Failed to restore backups", err);
    }
  }, [setTask, triggerSave, onUpdateNoteState]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const allTasks = useAutosaveStore.getState().tasks;
      for (const [id, task] of Object.entries(allTasks)) {
        if (task.pendingSnapshot) {
          saveToLocalStorage(id, {
            ...task.pendingSnapshot,
            serverId: task.serverId,
          });
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleBeforeUnload();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { registerChange, restoreBackups };
}
