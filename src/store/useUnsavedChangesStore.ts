import { useEffect, useId } from 'react';
import { create } from 'zustand';

interface UnsavedChangesState {
  dirtyIds: Record<string, true>;
  hasUnsavedChanges: boolean;
  setDirty: (id: string, dirty: boolean) => void;
  clearAll: () => void;
}

export const useUnsavedChangesStore = create<UnsavedChangesState>()((set) => ({
  dirtyIds: {},
  hasUnsavedChanges: false,

  setDirty: (id, dirty) => {
    set((state) => {
      const dirtyIds = { ...state.dirtyIds };
      if (dirty) {
        dirtyIds[id] = true;
      } else {
        delete dirtyIds[id];
      }
      return {
        dirtyIds,
        hasUnsavedChanges: Object.keys(dirtyIds).length > 0,
      };
    });
  },

  clearAll: () => {
    set({ dirtyIds: {}, hasUnsavedChanges: false });
  },
}));

/** Registers dirty form state with the app-wide navigation leave guard. */
export function useUnsavedChangesWarning(when: boolean) {
  const id = useId();
  const setDirty = useUnsavedChangesStore((state) => state.setDirty);

  useEffect(() => {
    setDirty(id, when);
    return () => setDirty(id, false);
  }, [id, setDirty, when]);
}
