"use client";

import { useTraceStore } from "@/lib/store/useTraceStore";
import { motion, AnimatePresence } from "framer-motion";

export function CallStackPanel() {
  const { semanticSteps, currentStepIndex, totalSteps } = useTraceStore();

  if (totalSteps === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground/50 italic">
        No call stack to show
      </div>
    );
  }

  const step = semanticSteps[currentStepIndex];
  if (!step) return null;

  const { callStack } = step;

  return (
    <div className="p-2 overflow-auto h-full">
      <AnimatePresence>
        {callStack.map((frame, i) => (
          <motion.div
            key={`${frame.frameId}-${i}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`
              px-3 py-2 rounded text-xs font-mono mb-1
              border transition-all
              ${
                frame.isActive
                  ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500"
              }
            `}
            style={{ marginLeft: frame.depth * 8 }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  frame.isActive ? "bg-blue-400" : "bg-zinc-600"
                }`}
              />
              <span className="font-medium">
                {frame.funcName}
              </span>
              {frame.args && (
                <span className="text-zinc-500 truncate">
                  ({truncate(frame.args, 40)})
                </span>
              )}
            </div>
            {frame.returnValue && (
              <div className="mt-1 text-emerald-400 pl-3">
                → {truncate(frame.returnValue, 30)}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {callStack.length === 0 && (
        <div className="text-xs text-muted-foreground/50 italic p-2">
          No call stack frames
        </div>
      )}
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}
