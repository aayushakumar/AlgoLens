import type {
  TraceStep,
  SemanticStep,
  SemanticTag,
  DataStructureState,
  PointerState,
  CallFrame,
  VariableDiff,
} from "./types";
import { POINTER_NAMES, POINTER_COLORS } from "./types";
import { computeDiffs, parseValue, isArrayLike, isMatrixLike, isDictLike, isSetLike } from "./diffEngine";
import { generateExplanation } from "./explanationGenerator";

/**
 * Transform a raw trace into enriched semantic steps.
 * This is the "product moat" — converting debugger data into learner-friendly states.
 */
export function mapTraceToSemantic(trace: TraceStep[]): SemanticStep[] {
  const steps: SemanticStep[] = [];
  const loopCounters = new Map<number, number>();

  for (let i = 0; i < trace.length; i++) {
    const curr = trace[i];
    const prev = i > 0 ? trace[i - 1] : null;

    const diffs = computeDiffs(prev, curr);
    const semanticTags = generateTags(prev, curr, diffs, loopCounters);
    const dataStructures = detectDataStructures(curr, diffs);
    const pointers = detectPointers(curr, dataStructures);
    const callStack = buildCallStack(trace, i);
    const explanation = generateExplanation({
      tags: semanticTags,
      lineNo: curr.lineNo,
      funcName: curr.funcName,
      eventType: curr.eventType,
    });

    steps.push({
      raw: curr,
      diffs,
      semanticTags,
      dataStructures,
      pointers,
      callStack,
      explanation,
    });
  }

  return steps;
}

/** Generate semantic tags by analyzing diffs and events */
function generateTags(
  prev: TraceStep | null,
  curr: TraceStep,
  diffs: VariableDiff[],
  loopCounters: Map<number, number>
): SemanticTag[] {
  const tags: SemanticTag[] = [];

  // Function entry/exit
  if (curr.eventType === "call") {
    tags.push({
      type: "function_entry",
      details: { name: curr.funcName },
    });

    // Is it recursive? (Same function name as any ancestor)
    if (prev && prev.funcName === curr.funcName) {
      // Detect DFS board exploration: recursive call with r, c integer args
      const rVal = curr.locals.r ?? curr.locals.row;
      const cVal = curr.locals.c ?? curr.locals.col;
      const iVal = curr.locals.i ?? curr.locals.idx ?? curr.locals.k;
      if (rVal !== undefined && cVal !== undefined && !isNaN(Number(rVal)) && !isNaN(Number(cVal))) {
        tags.push({
          type: "dfs_explore",
          details: {
            r: Number(rVal),
            c: Number(cVal),
            i: iVal !== undefined ? Number(iVal) : 0,
            depth: curr.callStackDepth,
          },
        });
      } else {
        // Generic recursive call — keep args concise (skip path/board to reduce noise)
        const shortVarNames = ["r", "c", "i", "j", "n", "k", "lo", "hi", "left", "right", "start", "end", "idx", "row", "col", "num"];
        const args = Object.entries(curr.locals)
          .filter(([k]) => shortVarNames.includes(k) || (!isMatrixLike(curr.locals[k]) && !isSetLike(curr.locals[k]) && !isArrayLike(curr.locals[k])))
          .slice(0, 6)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ");
        tags.push({
          type: "recursive_call",
          details: { func: curr.funcName, args },
        });
      }
    }
  }

  if (curr.eventType === "return") {
    tags.push({
      type: "function_exit",
      details: { name: curr.funcName },
    });
    if (curr.returnValue !== undefined) {
      // Detect DFS backtrack/found
      const rVal = curr.locals.r ?? curr.locals.row;
      const cVal = curr.locals.c ?? curr.locals.col;
      if (rVal !== undefined && cVal !== undefined && !isNaN(Number(rVal)) && !isNaN(Number(cVal)) && curr.callStackDepth > 1) {
        if (curr.returnValue === "False" || curr.returnValue === "None") {
          tags.push({
            type: "dfs_backtrack",
            details: { r: Number(rVal), c: Number(cVal) },
          });
        } else if (curr.returnValue === "True") {
          tags.push({
            type: "dfs_found",
            details: { r: Number(rVal), c: Number(cVal) },
          });
        }
      } else {
        tags.push({
          type: "recursive_return",
          details: { func: curr.funcName, value: curr.returnValue },
        });
      }
    }
  }

  // Track loop iterations (same line visited again)
  if (prev && curr.lineNo === prev.lineNo && curr.eventType === "line") {
    const count = (loopCounters.get(curr.lineNo) ?? 0) + 1;
    loopCounters.set(curr.lineNo, count);
    tags.push({
      type: "loop_iteration",
      details: { line: curr.lineNo, count },
    });
  } else if (curr.eventType === "line") {
    loopCounters.delete(curr.lineNo);
  }

  // Analyze variable diffs
  for (const diff of diffs) {
    if (diff.diffType === "unchanged" || diff.diffType === "removed") continue;

    // Pointer movement
    if (POINTER_NAMES.has(diff.varName) && diff.diffType === "changed") {
      const oldNum = Number(diff.oldValue);
      const newNum = Number(diff.newValue);
      if (!isNaN(oldNum) && !isNaN(newNum)) {
        tags.push({
          type: "pointer_move",
          details: { name: diff.varName, from: oldNum, to: newNum },
        });

        // Window expand/shrink detection
        if (diff.varName === "right" || diff.varName === "end" || diff.varName === "hi") {
          tags.push({ type: "window_expand", details: { right: newNum } });
        }
        if (diff.varName === "left" || diff.varName === "start" || diff.varName === "lo") {
          if (newNum > oldNum) {
            tags.push({ type: "window_shrink", details: { left: newNum } });
          }
        }
        continue;
      }
    }

    // Assignment
    if (diff.diffType === "added") {
      tags.push({
        type: "assignment",
        details: { name: diff.varName, value: diff.newValue ?? "" },
      });
    }

    // Collection mutations
    if (diff.diffType === "changed" && diff.details) {
      if (diff.details.includes("appended")) {
        tags.push({
          type: "list_append",
          details: { target: diff.varName, value: diff.details },
        });
      } else if (diff.details.includes("removed")) {
        tags.push({
          type: "list_pop",
          details: { target: diff.varName, value: diff.details },
        });
      } else if (diff.details.includes("swapped")) {
        const match = diff.details.match(/indices (\d+) and (\d+)/);
        if (match) {
          tags.push({
            type: "swap",
            details: { target: diff.varName, i: Number(match[1]), j: Number(match[2]) },
          });
        }
      } else if (diff.details.includes("element at index")) {
        const match = diff.details.match(/index (\d+)/);
        if (match) {
          tags.push({
            type: "element_update",
            details: { target: diff.varName, index: Number(match[1]), old: diff.oldValue ?? "", new: diff.newValue ?? "" },
          });
        }
      }
    }

    // Hash map mutations
    if (diff.diffType === "changed" && isDictLike(diff.newValue ?? "")) {
      tags.push({
        type: "hash_set",
        details: { target: diff.varName, key: "?", value: diff.newValue ?? "" },
      });
    }
  }

  return tags;
}

/** Detect data structures in the current locals */
function detectDataStructures(
  step: TraceStep,
  diffs: VariableDiff[]
): DataStructureState[] {
  const structures: DataStructureState[] = [];
  const changedVars = new Set(diffs.filter(d => d.diffType === "changed").map(d => d.varName));

  for (const [name, repr] of Object.entries(step.locals)) {
    // Skip simple primitives and pointer variables
    if (POINTER_NAMES.has(name)) continue;

    if (isMatrixLike(repr)) {
      structures.push({
        id: `ds-${name}`,
        name,
        type: "matrix",
        value: repr,
        highlights: changedVars.has(name) ? [step.stepId] : [],
      });
    } else if (isSetLike(repr)) {
      // Python sets (path, visited, seen, etc.) — visualised as a set overlay on the matrix
      structures.push({
        id: `ds-${name}`,
        name,
        type: "set",
        value: repr,
        highlights: changedVars.has(name) ? [step.stepId] : [],
      });
    } else if (isArrayLike(repr)) {
      // Check if it's used as a stack/result (but NOT if it contains coord-tuples — those are path lists)
      const stackNames = ["stack", "stk", "mono_stack", "result", "res", "queue", "q"];
      const pathNames = ["path", "visited", "seen", "curr_path", "current_path"];
      const isStack = stackNames.some(s => name.toLowerCase().includes(s));
      const isPathList = pathNames.some(s => name.toLowerCase() === s);

      // Path-like lists of (r,c) tuples: treat as "set" for overlay
      if (isPathList) {
        structures.push({
          id: `ds-${name}`,
          name,
          type: "set",
          value: repr,
          highlights: changedVars.has(name) ? [step.stepId] : [],
        });
      } else {
        structures.push({
          id: `ds-${name}`,
          name,
          type: isStack ? "stack" : "array",
          value: repr,
          highlights: changedVars.has(name) ? [step.stepId] : [],
        });
      }
    } else if (isDictLike(repr)) {
      structures.push({
        id: `ds-${name}`,
        name,
        type: "hashmap",
        value: repr,
      });
    } else if (repr.startsWith("'") && repr.endsWith("'") && repr.length >= 2) {
      // Python string literal — visualise when it's a keyword word/target/s
      const stringVarNames = ["word", "target", "s", "t", "pattern", "needle", "haystack"];
      if (stringVarNames.includes(name)) {
        structures.push({
          id: `ds-${name}`,
          name,
          type: "string",
          value: repr,
        });
      }
    }
  }

  return structures;
}

/** Detect pointer positions relative to data structures */
function detectPointers(
  step: TraceStep,
  dataStructures: DataStructureState[]
): PointerState[] {
  const pointers: PointerState[] = [];

  // Find the first array-type data structure to attach 1D pointers to
  const targetArray = dataStructures.find(ds => ds.type === "array");
  // Find the first matrix for 2D row/col pointers
  const targetMatrix = dataStructures.find(ds => ds.type === "matrix");

  const ROW_POINTER_NAMES = new Set(["r", "row", "cur_r", "curr_row", "x"]);
  const COL_POINTER_NAMES = new Set(["c", "col", "cur_c", "curr_col", "y"]);

  for (const [name, repr] of Object.entries(step.locals)) {
    if (!POINTER_NAMES.has(name)) continue;
    const idx = Number(repr);
    if (isNaN(idx) || !Number.isInteger(idx)) continue;

    if (targetMatrix && (ROW_POINTER_NAMES.has(name) || COL_POINTER_NAMES.has(name))) {
      // r/c pointers attach to the matrix — index stored but the matrix
      // component reads r/c directly from locals
      pointers.push({
        name,
        index: idx,
        color: POINTER_COLORS[name] ?? "#f59e0b",
        targetDS: targetMatrix.id,
      });
    } else if (targetArray) {
      pointers.push({
        name,
        index: idx,
        color: POINTER_COLORS[name] ?? "#6b7280",
        targetDS: targetArray.id,
      });
    }
  }

  return pointers;
}

/** Build call stack from trace up to current step */
function buildCallStack(trace: TraceStep[], currentIndex: number): CallFrame[] {
  const frames: CallFrame[] = [];
  const step = trace[currentIndex];
  const seenFrames = new Set<string>();

  // Walk backwards to build call stack
  for (let i = currentIndex; i >= 0; i--) {
    const s = trace[i];
    if (s.eventType === "call" && !seenFrames.has(s.frameId)) {
      seenFrames.add(s.frameId);
      const args = Object.entries(s.locals)
        .slice(0, 5) // limit args shown
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");

      frames.unshift({
        funcName: s.funcName,
        args,
        depth: s.callStackDepth,
        frameId: s.frameId,
        isActive: s.frameId === step.frameId,
      });
    }
    // Check for return to mark completed frames
    if (s.eventType === "return" && i < currentIndex) {
      const returnedFrame = trace.slice(0, i).reverse().find(
        t => t.eventType === "call" && t.frameId === s.frameId
      );
      if (returnedFrame) {
        seenFrames.add(s.frameId);
      }
    }
  }

  // Simplified: derive from callStackDepth
  if (frames.length === 0) {
    frames.push({
      funcName: step.funcName,
      args: "",
      depth: step.callStackDepth,
      frameId: step.frameId,
      isActive: true,
    });
  }

  return frames;
}
