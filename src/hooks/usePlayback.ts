"use client";

import { useEffect, useCallback, useRef } from "react";
import { useTraceStore } from "@/lib/store/useTraceStore";

/**
 * Hook for managing playback — auto-advance, keyboard shortcuts.
 */
export function usePlayback() {
  const {
    isPlaying,
    playbackSpeed,
    currentStepIndex,
    totalSteps,
    stepForward,
    pause,
    togglePlay,
    stepBackward,
    jumpToStart,
    jumpToEnd,
  } = useTraceStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying || totalSteps === 0) return;

    const ms = Math.max(50, 500 / playbackSpeed);
    intervalRef.current = setInterval(() => {
      // Read state directly — avoids stale closure
      useTraceStore.getState().advanceStep();
    }, ms);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, totalSteps]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture when typing in input/textarea/editor
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      // Don't capture in Monaco editor
      if ((e.target as HTMLElement)?.closest?.(".monaco-editor")) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          stepForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          stepBackward();
          break;
        case "Home":
          e.preventDefault();
          jumpToStart();
          break;
        case "End":
          e.preventDefault();
          jumpToEnd();
          break;
      }
    },
    [togglePlay, stepForward, stepBackward, jumpToStart, jumpToEnd]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    isPlaying,
    currentStepIndex,
    totalSteps,
    playbackSpeed,
    stepForward,
    stepBackward,
    pause,
  };
}
