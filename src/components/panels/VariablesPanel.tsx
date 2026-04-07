"use client";

import { useTraceStore } from "@/lib/store/useTraceStore";
import { motion, AnimatePresence } from "framer-motion";

export function VariablesPanel() {
  const { semanticSteps, currentStepIndex, totalSteps } = useTraceStore();

  if (totalSteps === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground/50 italic">
        No variables to show
      </div>
    );
  }

  const step = semanticSteps[currentStepIndex];
  if (!step) return null;

  const { diffs } = step;
  const activeDiffs = diffs.filter((d) => d.diffType !== "removed");

  return (
    <div className="p-2 overflow-auto h-full">
      <AnimatePresence>
        {activeDiffs.map((diff) => (
          <motion.div
            key={diff.varName}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={`
              flex items-start justify-between gap-2 px-2 py-1.5 rounded text-xs font-mono
              mb-0.5 transition-colors
              ${
                diff.diffType === "changed"
                  ? "bg-amber-500/10 border border-amber-500/20"
                  : diff.diffType === "added"
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-transparent border border-transparent"
              }
            `}
          >
            <span
              className={`shrink-0 ${
                diff.diffType === "changed"
                  ? "text-amber-400"
                  : diff.diffType === "added"
                  ? "text-emerald-400"
                  : "text-zinc-500"
              }`}
            >
              {diff.varName}
            </span>
            <span
              className={`text-right break-all ${
                diff.diffType === "changed"
                  ? "text-amber-200"
                  : diff.diffType === "added"
                  ? "text-emerald-200"
                  : "text-zinc-400"
              }`}
            >
              {diff.diffType === "changed" && diff.oldValue && (
                <span className="text-zinc-600 line-through mr-1">
                  {truncate(diff.oldValue, 20)}
                </span>
              )}
              {truncate(diff.newValue ?? "", 30)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {activeDiffs.length === 0 && (
        <div className="text-xs text-muted-foreground/50 italic p-2">
          No variables in scope
        </div>
      )}
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}
