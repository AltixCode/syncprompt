import { create } from 'zustand';
import { tokenize } from '../engine/scriptTracker';

/** Seconds of recording a free user gets before the paywall. */
export const FREE_RECORD_SECONDS = 60;

interface ScriptState {
  script: string;
  tokens: string[];
  cursor: number;
  /** Points per line, measured from the rendered prompter. */
  fontSize: number;
  mirrored: boolean;
  isPro: boolean;

  setScript: (text: string) => void;
  setCursor: (cursor: number) => void;
  resetCursor: () => void;
  setFontSize: (size: number) => void;
  toggleMirrored: () => void;
  setIsPro: (pro: boolean) => void;
  /** Recording ceiling for the current entitlement, in seconds. */
  recordLimitSeconds: () => number;
}

export const useScriptStore = create<ScriptState>((set, get) => ({
  script: '',
  tokens: [],
  cursor: 0,
  fontSize: 30,
  mirrored: false,
  isPro: false,

  // Re-tokenising on every edit keeps the tracker and the rendered script from
  // disagreeing about word positions, which would desync the scroll.
  setScript: (text) => set({ script: text, tokens: tokenize(text), cursor: 0 }),
  setCursor: (cursor) => set({ cursor }),
  resetCursor: () => set({ cursor: 0 }),
  setFontSize: (size) => set({ fontSize: Math.min(64, Math.max(18, size)) }),
  toggleMirrored: () => set((s) => ({ mirrored: !s.mirrored })),
  setIsPro: (pro) => set({ isPro: pro }),

  recordLimitSeconds: () => (get().isPro ? Number.POSITIVE_INFINITY : FREE_RECORD_SECONDS),
}));
