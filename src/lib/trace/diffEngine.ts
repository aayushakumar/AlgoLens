import type { TraceStep, VariableDiff } from "./types";

/**
 * Compute variable diffs between two consecutive trace steps.
 */
export function computeDiffs(
  prev: TraceStep | null,
  curr: TraceStep
): VariableDiff[] {
  const diffs: VariableDiff[] = [];
  const prevLocals = prev?.locals ?? {};
  const currLocals = curr.locals;

  // Check for added or changed
  for (const [name, value] of Object.entries(currLocals)) {
    if (!(name in prevLocals)) {
      diffs.push({ varName: name, diffType: "added", newValue: value });
    } else if (prevLocals[name] !== value) {
      diffs.push({
        varName: name,
        diffType: "changed",
        oldValue: prevLocals[name],
        newValue: value,
        details: detectElementChange(name, prevLocals[name], value),
      });
    } else {
      diffs.push({ varName: name, diffType: "unchanged", newValue: value });
    }
  }

  // Check for removed
  for (const name of Object.keys(prevLocals)) {
    if (!(name in currLocals)) {
      diffs.push({ varName: name, diffType: "removed", oldValue: prevLocals[name] });
    }
  }

  return diffs;
}

/**
 * Try to detect element-level changes in lists/dicts.
 */
function detectElementChange(
  _name: string,
  oldVal: string,
  newVal: string
): string | undefined {
  try {
    // Try to parse as JSON-like (Python repr is close enough for simple types)
    const oldParsed = parseValue(oldVal);
    const newParsed = parseValue(newVal);

    if (Array.isArray(oldParsed) && Array.isArray(newParsed)) {
      if (newParsed.length > oldParsed.length) {
        return `appended ${JSON.stringify(newParsed[newParsed.length - 1])}`;
      }
      if (newParsed.length < oldParsed.length) {
        return `removed element (length ${oldParsed.length} → ${newParsed.length})`;
      }
      // Same length — find changed index
      for (let i = 0; i < oldParsed.length; i++) {
        if (JSON.stringify(oldParsed[i]) !== JSON.stringify(newParsed[i])) {
          // Check for swap
          if (
            i + 1 < oldParsed.length &&
            JSON.stringify(oldParsed[i]) === JSON.stringify(newParsed[i + 1]) &&
            JSON.stringify(oldParsed[i + 1]) === JSON.stringify(newParsed[i])
          ) {
            return `swapped indices ${i} and ${i + 1}`;
          }
          return `element at index ${i} changed: ${JSON.stringify(oldParsed[i])} → ${JSON.stringify(newParsed[i])}`;
        }
      }
    }
  } catch {
    // Can't parse — skip
  }
  return undefined;
}

/**
 * Parse Python repr into a JS value (best effort).
 */
export function parseValue(repr: string): unknown {
  if (repr === "None") return null;
  if (repr === "True") return true;
  if (repr === "False") return false;

  // Try parsing as JSON directly (works for numbers, strings, arrays)
  try {
    // Convert Python single-quotes to doubles for JSON
    const jsonLike = repr
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null");
    return JSON.parse(jsonLike);
  } catch {
    return repr;
  }
}

/**
 * Check if a value looks like a list/array.
 */
export function isArrayLike(repr: string): boolean {
  return repr.startsWith("[") && repr.endsWith("]");
}

/**
 * Check if a value looks like a matrix (list of lists).
 */
export function isMatrixLike(repr: string): boolean {
  if (!isArrayLike(repr)) return false;
  try {
    const parsed = parseValue(repr);
    return (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      Array.isArray(parsed[0])
    );
  } catch {
    return false;
  }
}

/**
 * Check if a value looks like a dict/hashmap.
 * A dict has "key: value" pairs at the top level.
 */
export function isDictLike(repr: string): boolean {
  if (!repr.startsWith("{") || !repr.endsWith("}")) return false;
  // Empty braces `{}` is an empty dict in Python
  if (repr === "{}") return true;
  // A set like {(0, 0), (1, 1)} or {1, 2, 3} has no top-level `:`
  // We scan for `:` outside of nested parens/brackets/strings
  let depth = 0;
  let inStr = false;
  let strChar = "";
  for (let i = 1; i < repr.length - 1; i++) {
    const ch = repr[i];
    if (inStr) {
      if (ch === strChar) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; strChar = ch; continue; }
    if (ch === "(" || ch === "[" || ch === "{") { depth++; continue; }
    if (ch === ")" || ch === "]" || ch === "}") { depth--; continue; }
    if (depth === 0 && ch === ":") return true;
  }
  return false;
}

/**
 * Check if a value looks like a Python set.
 * Handles: set(), {1, 2, 3}, {(0, 0), (1, 1)}
 */
export function isSetLike(repr: string): boolean {
  if (repr === "set()") return true;
  return repr.startsWith("{") && repr.endsWith("}") && !isDictLike(repr);
}
