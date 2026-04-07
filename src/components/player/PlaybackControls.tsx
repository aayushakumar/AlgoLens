"use client";

import { useTraceStore } from "@/lib/store/useTraceStore";
import { usePlayback } from "@/hooks/usePlayback";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
} from "lucide-react";
import type { PlaybackSpeed } from "@/lib/trace/types";

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2, 4];

export function PlaybackControls() {
  const {
    isPlaying,
    currentStepIndex,
    totalSteps,
    playbackSpeed,
    togglePlay,
    stepForward,
    stepBackward,
    jumpToStart,
    jumpToEnd,
    setSpeed,
  } = useTraceStore();

  usePlayback(); // Activate keyboard shortcuts + auto-advance

  if (totalSteps === 0) return null;

  const atStart = currentStepIndex === 0;
  const atEnd = currentStepIndex >= totalSteps - 1;

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(playbackSpeed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
  };

  return (
    <div className="flex items-center justify-between px-4 py-1.5 border-b border-border shrink-0">
      {/* Left: Step counter + playing indicator */}
      <div className="flex items-center gap-2.5 min-w-[130px]">
        {isPlaying && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        )}
        <span className="text-xs font-mono text-muted-foreground">
          Step{" "}
          <span className="text-foreground font-semibold">
            {currentStepIndex + 1}
          </span>{" "}
          / {totalSteps}
        </span>
      </div>

      {/* Center: Playback buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={jumpToStart}
          disabled={atStart && !isPlaying}
          className="h-7 w-7"
          title="Jump to start (Home)"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={stepBackward}
          disabled={atStart}
          className="h-7 w-7"
          title="Previous step (←)"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </Button>

        {/* Main play/pause/replay button */}
        <Button
          variant="default"
          size="icon"
          onClick={atEnd && !isPlaying ? jumpToStart : togglePlay}
          className="h-9 w-9 rounded-full shadow-md shadow-primary/20"
          title={
            atEnd && !isPlaying
              ? "Replay from start"
              : isPlaying
              ? "Pause (Space)"
              : "Play (Space)"
          }
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : atEnd ? (
            <RotateCcw className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 translate-x-px" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={stepForward}
          disabled={atEnd}
          className="h-7 w-7"
          title="Next step (→)"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={jumpToEnd}
          disabled={atEnd}
          className="h-7 w-7"
          title="Jump to end (End)"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Right: Speed control */}
      <div className="flex items-center gap-1.5 min-w-[130px] justify-end">
        <span className="text-[10px] text-muted-foreground mr-0.5">Speed</span>
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`h-6 px-2 text-[10px] font-mono transition-colors ${
                playbackSpeed === s
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              title={`${s}x speed`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
