import type { SemanticTag, SemanticTagType } from "./types";

interface ExplanationContext {
  tags: SemanticTag[];
  lineNo: number;
  funcName: string;
  eventType: string;
}

/**
 * Generate a human-readable explanation from semantic tags.
 */
export function generateExplanation(ctx: ExplanationContext): string {
  const parts: string[] = [];

  for (const tag of ctx.tags) {
    const text = tagToText(tag);
    if (text) parts.push(text);
  }

  if (parts.length === 0) {
    // Fallback based on event type
    switch (ctx.eventType) {
      case "call":
        return `Called function \`${ctx.funcName}\`.`;
      case "return":
        return `Returned from \`${ctx.funcName}\`.`;
      case "exception":
        return `Exception raised at line ${ctx.lineNo}.`;
      default:
        return `Executing line ${ctx.lineNo}.`;
    }
  }

  return parts.join(" ");
}

function tagToText(tag: SemanticTag): string | undefined {
  const d = tag.details;
  const formatters: Record<SemanticTagType, () => string | undefined> = {
    pointer_move: () =>
      `Pointer \`${d.name}\` moved from ${d.from} to ${d.to}.`,
    swap: () =>
      `Swapped elements at indices ${d.i} and ${d.j} in \`${d.target}\`.`,
    list_append: () =>
      `Appended \`${d.value}\` to \`${d.target}\`.`,
    list_pop: () =>
      `Popped \`${d.value}\` from \`${d.target}\`.`,
    element_update: () =>
      `Updated \`${d.target}[${d.index}]\` from ${d.old} to ${d.new}.`,
    window_expand: () =>
      `Window expanded: right pointer moved to ${d.right}.`,
    window_shrink: () =>
      `Window shrunk: left pointer moved to ${d.left}.`,
    recursive_call: () =>
      d.args ? `Recursive call \`${d.func}(${d.args})\`.` : `Recursive call to \`${d.func}\`.`,
    recursive_return: () =>
      `Returned \`${d.value}\` from \`${d.func}\`.`,
    branch_taken: () =>
      `Condition at line ${d.line} evaluated to \`${d.result}\`.`,
    loop_iteration: () =>
      `Loop iteration ${d.count} (line ${d.line}).`,
    hash_set: () =>
      `Set \`${d.target}[${d.key}]\` = ${d.value}.`,
    hash_delete: () =>
      `Deleted key \`${d.key}\` from \`${d.target}\`.`,
    comparison: () =>
      `Compared values.`,
    assignment: () =>
      `Assigned \`${d.name}\` = ${d.value}.`,
    function_entry: () =>
      `Entered function \`${d.name}\`.`,
    function_exit: () =>
      `Exited function \`${d.name}\`.`,
    dfs_explore: () => {
      const depthStr = d.depth ? ` (depth ${d.depth})` : "";
      return `DFS: Exploring cell (${d.r}, ${d.c})${depthStr} — checking if board[${d.r}][${d.c}] matches word[${d.i}].`;
    },
    dfs_backtrack: () =>
      `Backtracking from (${d.r}, ${d.c}) — no valid path found here. Removing from path.`,
    dfs_found: () =>
      `Found! Path through (${d.r}, ${d.c}) completes the match.`,
  };

  const formatter = formatters[tag.type];
  return formatter ? formatter() : undefined;
}
