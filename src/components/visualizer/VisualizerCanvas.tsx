"use client";

import { useTraceStore } from "@/lib/store/useTraceStore";
import { ArrayViz } from "./ArrayViz";
import { MatrixViz } from "./MatrixViz";
import { StackQueueViz } from "./StackQueueViz";
import { HashMapViz } from "./HashMapViz";
import { Eye } from "lucide-react";
import type { DataStructureState } from "@/lib/trace/types";

export function VisualizerCanvas() {
  const { semanticSteps, currentStepIndex, totalSteps } = useTraceStore();

  if (totalSteps === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-background/50">
        <Eye className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-sm">Click &quot;Visualize&quot; to see your code in action</p>
      </div>
    );
  }

  const currentStep = semanticSteps[currentStepIndex];
  const prevStep = currentStepIndex > 0 ? semanticSteps[currentStepIndex - 1] : undefined;

  if (!currentStep) return null;

  const { dataStructures, pointers, explanation } = currentStep;
  const locals = currentStep.raw.locals;
  const depth = currentStep.raw.callStackDepth;

  // Find previous data structure states for diff highlighting
  const findPrevDS = (ds: DataStructureState): DataStructureState | undefined => {
    return prevStep?.dataStructures.find((p) => p.id === ds.id);
  };

  // Check if there's a matrix DS — "set" DS (path/visited) are rendered on the board instead
  const hasMatrix = dataStructures.some((ds) => ds.type === "matrix");

  return (
    <div className="h-full flex flex-col bg-background/50 overflow-auto">
      {/* Explanation bar */}
      <div className="px-4 py-2.5 border-b border-border bg-card/50 shrink-0 min-h-[44px] flex items-start gap-2">
        <span className="text-blue-400 font-mono text-xs shrink-0 mt-0.5">
          L{currentStep.raw.lineNo}
        </span>
        <p className="text-sm text-zinc-300 leading-snug">{explanation}</p>
      </div>

      {/* Visualization area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex flex-col items-center gap-8">
          {dataStructures.map((ds) => {
            // Skip "set" DS when a matrix exists — path cells are shown on the board
            if (ds.type === "set" && hasMatrix) return null;

            return (
              <div key={ds.id} className="w-full flex justify-center">
                {ds.type === "array" && (
                  <ArrayViz
                    ds={ds}
                    pointers={pointers.filter((p) => p.targetDS === ds.id)}
                    prevDS={findPrevDS(ds)}
                  />
                )}
                {ds.type === "matrix" && (
                  <MatrixViz
                    ds={ds}
                    prevDS={findPrevDS(ds)}
                    locals={locals}
                    depth={depth}
                  />
                )}
                {(ds.type === "stack" || ds.type === "queue") && (
                  <StackQueueViz ds={ds} prevDS={findPrevDS(ds)} />
                )}
                {ds.type === "hashmap" && (
                  <HashMapViz ds={ds} prevDS={findPrevDS(ds)} />
                )}
                {ds.type === "set" && !hasMatrix && (
                  <SetViz ds={ds} />
                )}
                {ds.type === "string" && (
                  <StringDSViz ds={ds} locals={locals} />
                )}
              </div>
            );
          })}

          {dataStructures.length === 0 && (
            <div className="text-sm text-muted-foreground/50 italic">
              No data structures detected at this step
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inline set visualizer ────────────────────────────────────────────────────

function SetViz({ ds }: { ds: DataStructureState }) {
  // Show as a compact pill list
  const repr = ds.value === "set()" ? "" : ds.value.slice(1, -1);
  const items = repr
    ? repr.split(/,\s*(?=\(|[^,)])/).filter(Boolean)
    : [];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="text-xs font-mono text-zinc-400">{ds.name}</div>
      <div className="flex flex-wrap gap-1 justify-center max-w-xs">
        {items.length === 0 ? (
          <span className="text-xs font-mono text-zinc-600 italic">empty set</span>
        ) : (
          items.slice(0, 12).map((item, i) => (
            <span
              key={i}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-900/40 border border-teal-700/40 text-teal-300"
            >
              {item.trim()}
            </span>
          ))
        )}
        {items.length > 12 && (
          <span className="text-[11px] font-mono text-zinc-600">
            +{items.length - 12} more
          </span>
        )}
      </div>
    </div>
  );
}

// ─── String DS visualizer with index pointer ────────────────────────────────

function StringDSViz({
  ds,
  locals,
}: {
  ds: DataStructureState;
  locals: Record<string, string>;
}) {
  const str = ds.value.replace(/^['"]|['"]$/g, "");
  const iRepr = locals.i ?? locals.idx ?? locals.k;
  const cursor = iRepr !== undefined ? parseInt(iRepr, 10) : -1;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="text-xs font-mono text-zinc-400">{ds.name}</div>
      <div className="flex gap-1 flex-wrap justify-center">
        {str.split("").map((char, i) => (
          <div
            key={i}
            className={[
              "w-7 h-7 flex items-center justify-center rounded text-xs font-mono font-bold border",
              i === cursor
                ? "bg-amber-900/60 border-amber-400 text-amber-200"
                : i < cursor
                ? "bg-emerald-900/40 border-emerald-700 text-emerald-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-400",
            ].join(" ")}
          >
            {char}
          </div>
        ))}
      </div>
    </div>
  );
}
