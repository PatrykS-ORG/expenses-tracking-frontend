import { create } from 'zustand';

interface BlockingLoaderState {
  depth: number;
  message: string | null;
  isActive: boolean;
  start: (message?: string | null) => void;
  stop: () => void;
  reset: () => void;
}

export const useBlockingLoaderStore = create<BlockingLoaderState>()((set) => ({
  depth: 0,
  message: null,
  isActive: false,

  start: (message = null) => {
    set((state) => {
      const depth = state.depth + 1;
      return {
        depth,
        isActive: true,
        message: message ?? state.message,
      };
    });
  },

  stop: () => {
    set((state) => {
      const depth = Math.max(0, state.depth - 1);
      return {
        depth,
        isActive: depth > 0,
        message: depth > 0 ? state.message : null,
      };
    });
  },

  reset: () => {
    set({ depth: 0, isActive: false, message: null });
  },
}));

export async function runWithBlockingLoader<T>(
  action: () => Promise<T>,
  message?: string | null,
): Promise<T> {
  const { start, stop } = useBlockingLoaderStore.getState();
  start(message);
  try {
    return await action();
  } finally {
    stop();
  }
}
