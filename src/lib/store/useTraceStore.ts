import { create } from "zustand";
import type { PlaybackSpeed, SemanticStep, TraceStep } from "@/lib/trace/types";

interface TraceState {
  // Raw trace data
  rawTrace: TraceStep[];
  semanticSteps: SemanticStep[];
  output: string;
  returnValue: string | undefined;
  executionError: string | undefined;

  // Playback state
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  totalSteps: number;

  // Execution state
  isExecuting: boolean;
  isPyodideLoading: boolean;

  // Actions
  setTrace: (trace: TraceStep[], output: string, returnValue?: string, error?: string) => void;
  setSemanticSteps: (steps: SemanticStep[]) => void;
  clearTrace: () => void;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  /** Manual step — also pauses playback */
  stepForward: () => void;
  /** Manual step — also pauses playback */
  stepBackward: () => void;
  /** Auto-advance tick — does NOT touch isPlaying */
  advanceStep: () => void;
  jumpTo: (index: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;

  setIsExecuting: (val: boolean) => void;
  setIsPyodideLoading: (val: boolean) => void;
}

export const useTraceStore = create<TraceState>((set, get) => ({
  rawTrace: [],
  semanticSteps: [],
  output: "",
  returnValue: undefined,
  executionError: undefined,

  currentStepIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  totalSteps: 0,

  isExecuting: false,
  isPyodideLoading: false,

  setTrace: (trace, output, returnValue, error) =>
    set({
      rawTrace: trace,
      output,
      returnValue,
      executionError: error,
      totalSteps: trace.length,
      currentStepIndex: 0,
      isPlaying: false,
    }),

  setSemanticSteps: (steps) => set({ semanticSteps: steps }),

  clearTrace: () =>
    set({
      rawTrace: [],
      semanticSteps: [],
      output: "",
      returnValue: undefined,
      executionError: undefined,
      currentStepIndex: 0,
      isPlaying: false,
      totalSteps: 0,
    }),

  play: () => {
    const { currentStepIndex, totalSteps } = get();
    if (currentStepIndex >= totalSteps - 1) {
      set({ currentStepIndex: 0 });
    }
    set({ isPlaying: true });
  },

  pause: () => set({ isPlaying: false }),

  togglePlay: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  stepForward: () => {
    const { currentStepIndex, totalSteps } = get();
    if (currentStepIndex < totalSteps - 1) {
      set({ currentStepIndex: currentStepIndex + 1, isPlaying: false });
    }
  },

  stepBackward: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1, isPlaying: false });
    }
  },

  advanceStep: () => {
    const { currentStepIndex, totalSteps } = get();
    if (currentStepIndex < totalSteps - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      // Reached the end — stop
      set({ isPlaying: false });
    }
  },

  jumpTo: (index) => {
    const { totalSteps } = get();
    const clamped = Math.max(0, Math.min(index, totalSteps - 1));
    set({ currentStepIndex: clamped });
  },

  jumpToStart: () => set({ currentStepIndex: 0, isPlaying: false }),

  jumpToEnd: () => {
    const { totalSteps } = get();
    set({ currentStepIndex: Math.max(0, totalSteps - 1), isPlaying: false });
  },

  setSpeed: (speed) => set({ playbackSpeed: speed }),

  setIsExecuting: (val) => set({ isExecuting: val }),
  setIsPyodideLoading: (val) => set({ isPyodideLoading: val }),
}));
