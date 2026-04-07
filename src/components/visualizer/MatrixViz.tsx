"use client";

import { motion } from "framer-motion";
import type { DataStructureState } from "@/lib/trace/types";
import { parseValue } from "@/lib/trace/diffEngine";

const CELL_SIZE = 44;
const CELL_GAP = 3;

// ─── Board context helpers ────────────────────────────────────────────────────

/** Extract the current (row, col) being visited from locals */
function getCurrentCell(locals: Record<string, string>): [number, number] | null {
  const r = locals.r ?? locals.row ?? locals.cur_r ?? locals.curr_row;
  const c = locals.c ?? locals.col ?? locals.cur_c ?? locals.curr_col;
  if (r !== undefined && c !== undefined) {
    const ri = parseInt(r, 10);
    const ci = parseInt(c, 10);
    if (!isNaN(ri) && !isNaN(ci)) return [ri, ci];
  }
  return null;
}

/** Extract all (row, col) pairs from a set/list repr like {(0,0),(1,1)} or [(0,0)] */
function extractCellPairs(repr: string): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  const re = /\((\d+),\s*(\d+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(repr)) !== null) {
    result.push([parseInt(m[1], 10), parseInt(m[2], 10)]);
  }
  return result;
}

/** Return a Set<"r,c"> of path cells from locals (path, visited, seen, etc.) */
function getPathCells(locals: Record<string, string>): Set<string> {
  const pathVarNames = ["path", "visited", "seen", "curr_path", "current_path"];
  for (const name of pathVarNames) {
    if (locals[name]) {
      const pairs = extractCellPairs(locals[name]);
      if (pairs.length > 0) {
        return new Set(pairs.map(([r, c]) => `${r},${c}`));
      }
    }
  }
  return new Set();
}

/** Return ordered path cells as array (for drawing the trail line) */
function getOrderedPath(locals: Record<string, string>): Array<[number, number]> {
  const pathVarNames = ["path", "visited", "seen", "curr_path", "current_path"];
  for (const name of pathVarNames) {
    if (locals[name]) {
      const pairs = extractCellPairs(locals[name]);
      if (pairs.length > 0) return pairs;
    }
  }
  return [];
}

/** Word/string matching progress from locals */
function getWordContext(
  locals: Record<string, string>
): { word: string; index: number } | null {
  const wordRepr = locals.word ?? locals.target ?? locals.s;
  const iRepr = locals.i ?? locals.idx ?? locals.k;
  if (wordRepr && iRepr !== undefined) {
    const cleaned = wordRepr.replace(/^['"]|['"]$/g, "");
    const idx = parseInt(iRepr, 10);
    if (!isNaN(idx) && cleaned.length > 0) return { word: cleaned, index: idx };
  }
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface MatrixVizProps {
  ds: DataStructureState;
  prevDS?: DataStructureState;
  locals?: Record<string, string>;
  depth?: number;
}

export function MatrixViz({ ds, prevDS, locals = {}, depth = 0 }: MatrixVizProps) {
  const matrix = parseValue(ds.value);
  if (!Array.isArray(matrix) || !Array.isArray(matrix[0])) return null;

  const prevMatrix = prevDS ? parseValue(prevDS.value) : null;
  const rows = matrix.length;
  const cols = (matrix[0] as unknown[]).length;

  const currentCell = getCurrentCell(locals);
  const pathCells = getPathCells(locals);
  const orderedPath = getOrderedPath(locals);
  const wordCtx = getWordContext(locals);

  const isDFSBoard = currentCell !== null || pathCells.size > 0;

  const svgWidth = cols * (CELL_SIZE + CELL_GAP) + 54;
  const svgHeight = rows * (CELL_SIZE + CELL_GAP) + 28;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-zinc-400">{ds.name}</span>
        {isDFSBoard && depth > 1 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-900/40 text-violet-300 border border-violet-700/40">
            depth {depth}
          </span>
        )}
      </div>

      <svg width={svgWidth} height={svgHeight} className="overflow-visible">
        <defs>
          <filter id="glow-current" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-found" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform="translate(30, 12)">
          {/* Column headers */}
          {Array.from({ length: cols }, (_, c) => (
            <text
              key={`col-${c}`}
              x={c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2}
              y={-6}
              textAnchor="middle"
              fill="#52525b"
              fontSize={9}
              fontFamily="monospace"
            >
              {c}
            </text>
          ))}

          {/* Path trail connecting line */}
          {orderedPath.length > 1 && (
            <polyline
              points={orderedPath
                .map(
                  ([r, c]) =>
                    `${c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2},${
                      r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2
                    }`
                )
                .join(" ")}
              fill="none"
              stroke="#0d9488"
              strokeWidth={2}
              strokeDasharray="5 3"
              strokeOpacity={0.5}
            />
          )}

          {matrix.map((row, r) => (
            <g key={r}>
              {/* Row header */}
              <text
                x={-10}
                y={r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#52525b"
                fontSize={9}
                fontFamily="monospace"
              >
                {r}
              </text>

              {(row as unknown[]).map((val, c) => {
                const isCurrentCell =
                  currentCell?.[0] === r && currentCell?.[1] === c;
                const isPathCell = pathCells.has(`${r},${c}`) && !isCurrentCell;
                const prevVal =
                  Array.isArray(prevMatrix) &&
                  Array.isArray(prevMatrix[r]) &&
                  (prevMatrix[r] as unknown[])[c];
                const changed =
                  !isDFSBoard &&
                  prevVal !== undefined &&
                  JSON.stringify(prevVal) !== JSON.stringify(val);

                // Word match: is current character what's expected?
                const wordChar = wordCtx?.word[wordCtx.index];
                const isWordMatchCell =
                  isCurrentCell && wordChar !== undefined && String(val) === wordChar;

                // Cell fill / stroke by priority
                let fill: string;
                let stroke: string;
                let strokeWidth: number;

                if (isCurrentCell) {
                  fill = isWordMatchCell ? "#b45309" : "#92400e"; // amber tones
                  stroke = isWordMatchCell ? "#fbbf24" : "#f59e0b";
                  strokeWidth = 2.5;
                } else if (isPathCell) {
                  fill = "#0f766e"; // teal
                  stroke = "#14b8a6";
                  strokeWidth = 1.5;
                } else if (changed) {
                  fill = "#fbbf24";
                  stroke = "#f59e0b";
                  strokeWidth = 2;
                } else {
                  fill = "#27272a";
                  stroke = "#3f3f46";
                  strokeWidth = 1;
                }

                // Path step index (for ordered paths)
                const pathStepIdx = orderedPath.findIndex(
                  ([pr, pc]) => pr === r && pc === c
                );

                return (
                  <motion.g key={`${r}-${c}`}>
                    <motion.rect
                      x={c * (CELL_SIZE + CELL_GAP)}
                      y={r * (CELL_SIZE + CELL_GAP)}
                      width={CELL_SIZE}
                      height={CELL_SIZE}
                      rx={5}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      filter={
                        isCurrentCell
                          ? "url(#glow-current)"
                          : undefined
                      }
                      animate={isCurrentCell ? { opacity: [1, 0.75, 1] } : {}}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Green outer ring when word char matches */}
                    {isWordMatchCell && (
                      <motion.rect
                        x={c * (CELL_SIZE + CELL_GAP) - 3}
                        y={r * (CELL_SIZE + CELL_GAP) - 3}
                        width={CELL_SIZE + 6}
                        height={CELL_SIZE + 6}
                        rx={7}
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth={2}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: [0.6, 1, 0.6], scale: 1 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}

                    {/* Cell value */}
                    <text
                      x={c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2}
                      y={r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2 + (isPathCell && pathStepIdx >= 0 ? -4 : 1)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isCurrentCell || isPathCell ? "#fff" : "#e4e4e7"}
                      fontSize={isCurrentCell ? 14 : 11}
                      fontFamily="monospace"
                      fontWeight={isCurrentCell ? "bold" : "normal"}
                      style={{ pointerEvents: "none" }}
                    >
                      {String(val).length > 3 ? ".." : String(val)}
                    </text>

                    {/* Path step number badge */}
                    {isPathCell && pathStepIdx >= 0 && (
                      <text
                        x={c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2}
                        y={r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2 + 8}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#5eead4"
                        fontSize={8}
                        fontFamily="monospace"
                        style={{ pointerEvents: "none" }}
                      >
                        #{pathStepIdx + 1}
                      </text>
                    )}
                  </motion.g>
                );
              })}
            </g>
          ))}
        </g>
      </svg>

      {/* Word matching progress bar */}
      {wordCtx && (
        <WordProgress word={wordCtx.word} matchIndex={wordCtx.index} />
      )}

      {/* Legend (only when DFS context available) */}
      {isDFSBoard && (
        <div className="flex flex-wrap justify-center gap-3 text-[10px] font-mono text-zinc-500">
          {currentCell && (
            <span className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ background: "#f59e0b" }}
              />
              current ({currentCell[0]},{currentCell[1]})
            </span>
          )}
          {pathCells.size > 0 && (
            <span className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ background: "#0f766e" }}
              />
              path ({pathCells.size} step{pathCells.size !== 1 ? "s" : ""})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Word progress bar ────────────────────────────────────────────────────────

function WordProgress({
  word,
  matchIndex,
}: {
  word: string;
  matchIndex: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
        word progress
      </div>
      <div className="flex gap-1 flex-wrap justify-center">
        {word.split("").map((char, i) => {
          const isMatched = i < matchIndex;
          const isCurrent = i === matchIndex;
          return (
            <motion.div
              key={i}
              className={[
                "w-7 h-7 flex items-center justify-center rounded text-xs font-mono font-bold border select-none",
                isMatched
                  ? "bg-emerald-900/60 border-emerald-500 text-emerald-300"
                  : isCurrent
                  ? "bg-amber-900/60 border-amber-400 text-amber-200"
                  : "bg-zinc-800/80 border-zinc-700 text-zinc-500",
              ].join(" ")}
              animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.9, repeat: Infinity }}
            >
              {char}
            </motion.div>
          );
        })}
      </div>
      <div className="text-[10px] font-mono text-zinc-600">
        {matchIndex}/{word.length} matched
        {matchIndex === word.length && (
          <span className="ml-2 text-emerald-400 font-bold">✓ complete!</span>
        )}
      </div>
    </div>
  );
}
