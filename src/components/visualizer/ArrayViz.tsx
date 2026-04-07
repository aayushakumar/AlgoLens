"use client";

import { motion } from "framer-motion";
import type { DataStructureState, PointerState } from "@/lib/trace/types";
import { parseValue } from "@/lib/trace/diffEngine";

const CELL_WIDTH = 52;
const CELL_HEIGHT = 40;
const CELL_GAP = 2;
const POINTER_HEIGHT = 28;

interface ArrayVizProps {
  ds: DataStructureState;
  pointers: PointerState[];
  prevDS?: DataStructureState;
}

export function ArrayViz({ ds, pointers, prevDS }: ArrayVizProps) {
  const values = parseValue(ds.value);
  if (!Array.isArray(values)) return null;

  const prevValues = prevDS ? parseValue(prevDS.value) : null;
  const totalWidth = values.length * (CELL_WIDTH + CELL_GAP);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs font-mono text-muted-foreground mb-1">
        {ds.name}
      </div>

      <svg
        width={Math.max(totalWidth + 40, 200)}
        height={CELL_HEIGHT + POINTER_HEIGHT * 2 + 30}
        className="overflow-visible"
      >
        <g transform={`translate(20, ${POINTER_HEIGHT + 10})`}>
          {/* Pointer arrows (above) */}
          {pointers
            .filter((p) => p.index >= 0 && p.index < values.length)
            .map((ptr) => (
              <motion.g
                key={ptr.name}
                animate={{ x: ptr.index * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {/* Arrow */}
                <motion.polygon
                  points="-6,-6 6,-6 0,2"
                  fill={ptr.color}
                  opacity={0.9}
                />
                {/* Label */}
                <text
                  y={-14}
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold fill-current"
                  style={{ fill: ptr.color }}
                >
                  {ptr.name}
                </text>
              </motion.g>
            ))}

          {/* Window highlight (between left/right pointers) */}
          {renderWindowHighlight(pointers, values.length)}

          {/* Array cells */}
          {values.map((val, i) => {
            const changed =
              Array.isArray(prevValues) &&
              i < prevValues.length &&
              JSON.stringify(prevValues[i]) !== JSON.stringify(val);
            const isNew =
              Array.isArray(prevValues) && i >= prevValues.length;

            return (
              <motion.g
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <motion.rect
                  x={i * (CELL_WIDTH + CELL_GAP)}
                  y={0}
                  width={CELL_WIDTH}
                  height={CELL_HEIGHT}
                  rx={4}
                  fill={
                    changed
                      ? "#fbbf24"
                      : isNew
                      ? "#34d399"
                      : "#27272a"
                  }
                  stroke={changed ? "#f59e0b" : "#3f3f46"}
                  strokeWidth={changed ? 2 : 1}
                  animate={{
                    fill: changed ? ["#fbbf24", "#27272a"] : undefined,
                  }}
                  transition={{ duration: 0.8 }}
                />
                {/* Value */}
                <text
                  x={i * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2}
                  y={CELL_HEIGHT / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-mono font-medium"
                  fill={changed ? "#1c1917" : "#e4e4e7"}
                >
                  {String(val).length > 5 ? String(val).slice(0, 5) + ".." : String(val)}
                </text>
                {/* Index */}
                <text
                  x={i * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2}
                  y={CELL_HEIGHT + 14}
                  textAnchor="middle"
                  className="text-[9px] font-mono"
                  fill="#71717a"
                >
                  {i}
                </text>
              </motion.g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function renderWindowHighlight(pointers: PointerState[], length: number) {
  const left = pointers.find(
    (p) =>
      p.name === "left" ||
      p.name === "lo" ||
      p.name === "start" ||
      p.name === "l"
  );
  const right = pointers.find(
    (p) =>
      p.name === "right" ||
      p.name === "hi" ||
      p.name === "end" ||
      p.name === "r"
  );

  if (!left || !right) return null;
  if (left.index < 0 || right.index >= length || left.index > right.index)
    return null;

  const x = left.index * (CELL_WIDTH + CELL_GAP) - 2;
  const width =
    (right.index - left.index + 1) * (CELL_WIDTH + CELL_GAP) + 4 - CELL_GAP;

  return (
    <motion.rect
      x={x}
      y={-2}
      width={width}
      height={CELL_HEIGHT + 4}
      rx={6}
      fill="rgba(59, 130, 246, 0.08)"
      stroke="rgba(59, 130, 246, 0.3)"
      strokeWidth={1.5}
      strokeDasharray="4 2"
      animate={{ width, x }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    />
  );
}
