"use client";

import { motion } from "framer-motion";
import type { DataStructureState } from "@/lib/trace/types";
import { parseValue } from "@/lib/trace/diffEngine";

interface HashMapVizProps {
  ds: DataStructureState;
  prevDS?: DataStructureState;
}

export function HashMapViz({ ds, prevDS }: HashMapVizProps) {
  const value = parseValue(ds.value);
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;

  const entries = Object.entries(value as Record<string, unknown>);
  const prevValue = prevDS ? parseValue(prevDS.value) : null;
  const prevEntries =
    typeof prevValue === "object" && prevValue && !Array.isArray(prevValue)
      ? Object.keys(prevValue as Record<string, unknown>)
      : [];
  const prevKeys = new Set(prevEntries);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs font-mono text-muted-foreground mb-1">
        {ds.name}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 max-h-[200px] overflow-y-auto p-2 rounded-md bg-zinc-900/50 border border-zinc-800">
        {/* Header */}
        <div className="text-[9px] font-mono text-muted-foreground/60 uppercase">
          Key
        </div>
        <div className="text-[9px] font-mono text-muted-foreground/60 uppercase">
          Value
        </div>

        {entries.map(([key, val]) => {
          const isNew = !prevKeys.has(key);
          const isChanged =
            !isNew &&
            prevValue &&
            JSON.stringify((prevValue as Record<string, unknown>)[key]) !==
              JSON.stringify(val);

          return (
            <motion.div
              key={key}
              className="contents"
              initial={isNew ? { opacity: 0 } : undefined}
              animate={{ opacity: 1 }}
            >
              <div
                className={`text-xs font-mono px-2 py-0.5 rounded ${
                  isNew
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-zinc-400"
                }`}
              >
                {String(key)}
              </div>
              <div
                className={`text-xs font-mono px-2 py-0.5 rounded ${
                  isNew
                    ? "text-emerald-300 bg-emerald-500/10"
                    : isChanged
                    ? "text-amber-300 bg-amber-500/10"
                    : "text-zinc-300"
                }`}
              >
                {String(val).length > 15
                  ? String(val).slice(0, 15) + ".."
                  : String(val)}
              </div>
            </motion.div>
          );
        })}

        {entries.length === 0 && (
          <div className="col-span-2 text-xs text-muted-foreground/50 italic text-center py-2">
            empty
          </div>
        )}
      </div>
    </div>
  );
}
