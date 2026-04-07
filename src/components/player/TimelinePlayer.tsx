"use client";

import { useTraceStore } from "@/lib/store/useTraceStore";
import { useCallback, useRef } from "react";

export function TimelinePlayer() {
  const {
    currentStepIndex,
    totalSteps,
    semanticSteps,
    jumpTo,
  } = useTraceStore();

  const containerRef = useRef<HTMLDivElement>(null);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      jumpTo(Number(e.target.value));
    },
    [jumpTo]
  );

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || totalSteps === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const step = Math.round(ratio * (totalSteps - 1));
      jumpTo(step);
    },
    [totalSteps, jumpTo]
  );

  if (totalSteps === 0) return null;

  const progress = totalSteps > 1 ? currentStepIndex / (totalSteps - 1) : 0;

  return (
    <div className="flex-1 px-4 py-2 flex flex-col gap-2">
      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStepIndex}
          onChange={handleSliderChange}
          className="w-full h-2 appearance-none cursor-pointer rounded-full bg-zinc-800
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-blue-500
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-blue-300
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-125
          "
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
              progress * 100
            }%, #27272a ${progress * 100}%, #27272a 100%)`,
          }}
        />
      </div>

      {/* Step markers / minimap */}
      <div
        ref={containerRef}
        onClick={handleTrackClick}
        className="h-6 relative cursor-pointer rounded overflow-hidden bg-zinc-900/50"
        title="Click to jump to step"
      >
        {/* Render step markers as colored bars */}
        {totalSteps <= 500 ? (
          // For smaller traces, render individual markers
          semanticSteps.map((step, i) => {
            const x = (i / Math.max(1, totalSteps - 1)) * 100;
            const color = getEventColor(step.raw.eventType);
            const isActive = i === currentStepIndex;

            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 transition-opacity"
                style={{
                  left: `${x}%`,
                  width: Math.max(1, 100 / totalSteps) + "%",
                  backgroundColor: color,
                  opacity: isActive ? 1 : 0.4,
                }}
              />
            );
          })
        ) : (
          // For larger traces, render a simplified minimap
          <div
            className="absolute top-0 bottom-0 bg-blue-500/30"
            style={{ left: 0, right: 0 }}
          />
        )}

        {/* Current position indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-[0_0_4px_rgba(255,255,255,0.5)]"
          style={{ left: `${progress * 100}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[9px] text-muted-foreground/60">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-blue-500/60" /> line
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-emerald-500/60" /> call
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-purple-500/60" /> return
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-red-500/60" /> exception
        </span>
      </div>
    </div>
  );
}

function getEventColor(eventType: string): string {
  switch (eventType) {
    case "call":
      return "rgba(16, 185, 129, 0.6)";
    case "return":
      return "rgba(139, 92, 246, 0.6)";
    case "exception":
      return "rgba(239, 68, 68, 0.6)";
    default:
      return "rgba(59, 130, 246, 0.4)";
  }
}
