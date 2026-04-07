// ============================================================
// AlgoLens Trace & Visualization Types
// ============================================================

/** Raw trace step captured by sys.settrace in Pyodide */
export interface TraceStep {
  stepId: number;
  eventType: "line" | "call" | "return" | "exception";
  lineNo: number;
  funcName: string;
  frameId: string;
  callStackDepth: number;
  locals: Record<string, string>;
  stdout: string;
  returnValue?: string;
  error?: string;
}

/** Variable diff between consecutive steps */
export interface VariableDiff {
  varName: string;
  diffType: "added" | "changed" | "removed" | "unchanged";
  oldValue?: string;
  newValue?: string;
  details?: string; // e.g. "element at index 3 changed"
}

/** Semantic tags describing what happened at this step */
export type SemanticTagType =
  | "pointer_move"
  | "swap"
  | "list_append"
  | "list_pop"
  | "element_update"
  | "window_expand"
  | "window_shrink"
  | "recursive_call"
  | "recursive_return"
  | "branch_taken"
  | "loop_iteration"
  | "hash_set"
  | "hash_delete"
  | "comparison"
  | "assignment"
  | "function_entry"
  | "function_exit"
  | "dfs_explore"
  | "dfs_backtrack"
  | "dfs_found";

export interface SemanticTag {
  type: SemanticTagType;
  details: Record<string, string | number | boolean>;
}

/** State of a single data structure at a point in time */
export interface DataStructureState {
  id: string;
  name: string;
  type: "array" | "matrix" | "stack" | "queue" | "hashmap" | "set" | "string" | "tree" | "linkedlist";
  value: string; // JSON-serialized
  highlights?: number[]; // indices to highlight
  pointers?: PointerState[];
}

/** A pointer/index over a data structure */
export interface PointerState {
  name: string;
  index: number;
  color: string;
  targetDS: string; // id of the data structure
}

/** A call stack frame */
export interface CallFrame {
  funcName: string;
  args: string;
  depth: number;
  frameId: string;
  returnValue?: string;
  isActive: boolean;
}

/** Enriched step after semantic processing */
export interface SemanticStep {
  raw: TraceStep;
  diffs: VariableDiff[];
  semanticTags: SemanticTag[];
  dataStructures: DataStructureState[];
  pointers: PointerState[];
  callStack: CallFrame[];
  explanation: string;
}

/** Execution result from Pyodide worker */
export interface ExecutionResult {
  success: boolean;
  trace: TraceStep[];
  output: string;
  returnValue?: string;
  error?: string;
}

/** Example problem definition */
export interface ExampleProblem {
  id: string;
  title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  code: string;
  input: string;
  expectedOutput?: string;
}

/** Playback speed options */
export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

/** Pointer color palette */
export const POINTER_COLORS: Record<string, string> = {
  left: "#3b82f6",    // blue
  right: "#ef4444",   // red
  mid: "#f59e0b",     // amber
  i: "#3b82f6",       // blue
  j: "#ef4444",       // red
  lo: "#3b82f6",      // blue
  hi: "#ef4444",      // red
  slow: "#8b5cf6",    // purple
  fast: "#10b981",    // emerald
  start: "#3b82f6",   // blue
  end: "#ef4444",     // red
  top: "#f59e0b",     // amber
  curr: "#f59e0b",    // amber
  head: "#3b82f6",    // blue
  tail: "#ef4444",    // red
  k: "#8b5cf6",       // purple
  p: "#10b981",       // emerald
  q: "#f97316",       // orange
};

/** Well-known pointer variable names */
export const POINTER_NAMES = new Set([
  "left", "right", "mid", "i", "j", "lo", "hi",
  "low", "high", "start", "end", "slow", "fast",
  "l", "r", "top", "head", "tail", "curr", "prev",
  "p", "q", "k", "idx", "index", "ptr", "front", "back",
  "begin", "first", "last", "pos"
]);
