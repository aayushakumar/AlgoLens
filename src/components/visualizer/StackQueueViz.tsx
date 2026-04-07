"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { DataStructureState } from "@/lib/trace/types";
import { parseValue } from "@/lib/trace/diffEngine";

const CELL_WIDTH = 60;
const CELL_HEIGHT = 32;

interface StackQueueVizProps {
  ds: DataStructureState;
  prevDS?: DataStructureState;
}

export function StackQueueViz({ ds, prevDS }: StackQueueVizProps) {
  const values = parseValue(ds.value);
  if (!Array.isArray(values)) return null;

  const prevValues = prevDS ? parseValue(prevDS.value) : undefined;
  const isStack = ds.type === "stack";

  // For stack, reverse so top is visually on top
  const displayValues = isStack ? [...values].reverse() : values;
  const prevDisplayValues =
    Array.isArray(prevValues)
      ? isStack
        ? [...prevValues].reverse()
        : prevValues
      : [];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs font-mono text-muted-foreground mb-1">
        {ds.name} ({ds.type})
      </div>

      {isStack ? (
        // Vertical stack
        <div className="flex flex-col items-center gap-0.5">
          {values.length > 0 && (
            <div className="text-[9px] text-muted-foreground/60 mb-0.5">
              ← top
            </div>
          )}
          <AnimatePresence>
            {displayValues.map((val, i) => {
              const realIndex = isStack ? values.length - 1 - i : i;
              const isNew =
                Array.isArray(prevValues) &&
                realIndex >= prevValues.length;

              return (
                <motion.div
                  key={`${realIndex}-${val}`}
                  initial={{ opacity: 0, scale: 0.5, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -20 }}
                  className={`
                    flex items-center justify-center font-mono text-xs
                    border rounded
                    ${
                      isNew
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-zinc-800 border-zinc-700 text-zinc-300"
                    }
                  `}
                  style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
                >
                  {String(val).length > 6 ? String(val).slice(0, 6) + ".." : String(val)}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {values.length === 0 && (
            <div className="text-xs text-muted-foreground/50 italic">
              empty
            </div>
          )}
        </div>
      ) : (
        // Horizontal queue
        <div className="flex items-center gap-0.5">
          {values.length > 0 && (
            <div className="text-[9px] text-muted-foreground/60 mr-1">
              front →
            </div>
          )}
          <AnimatePresence>
            {displayValues.map((val, i) => {
              const isNew =
                Array.isArray(prevDisplayValues) &&
                i >= prevDisplayValues.length;

              return (
                <motion.div
                  key={`${i}-${val}`}
                  initial={{ opacity: 0, scale: 0.5, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.5, x: -20 }}
                  className={`
                    flex items-center justify-center font-mono text-xs
                    border rounded
                    ${
                      isNew
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-zinc-800 border-zinc-700 text-zinc-300"
                    }
                  `}
                  style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
                >
                  {String(val).length > 6 ? String(val).slice(0, 6) + ".." : String(val)}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {values.length > 0 && (
            <div className="text-[9px] text-muted-foreground/60 ml-1">
              ← back
            </div>
          )}
        </div>
      )}
    </div>
  );
}
