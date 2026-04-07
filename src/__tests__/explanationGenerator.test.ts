import { generateExplanation } from "@/lib/trace/explanationGenerator";
import type { SemanticTag } from "@/lib/trace/types";

describe("generateExplanation", () => {
  it("generates fallback for line event with no tags", () => {
    const result = generateExplanation({
      tags: [],
      lineNo: 5,
      funcName: "test",
      eventType: "line",
    });
    expect(result).toBe("Executing line 5.");
  });

  it("generates fallback for call event with no tags", () => {
    const result = generateExplanation({
      tags: [],
      lineNo: 1,
      funcName: "solve",
      eventType: "call",
    });
    expect(result).toBe("Called function `solve`.");
  });

  it("generates fallback for return event with no tags", () => {
    const result = generateExplanation({
      tags: [],
      lineNo: 10,
      funcName: "solve",
      eventType: "return",
    });
    expect(result).toBe("Returned from `solve`.");
  });

  it("generates fallback for exception event", () => {
    const result = generateExplanation({
      tags: [],
      lineNo: 7,
      funcName: "solve",
      eventType: "exception",
    });
    expect(result).toBe("Exception raised at line 7.");
  });

  it("generates pointer_move explanation", () => {
    const tags: SemanticTag[] = [
      { type: "pointer_move", details: { name: "left", from: 0, to: 1 } },
    ];
    const result = generateExplanation({
      tags,
      lineNo: 5,
      funcName: "test",
      eventType: "line",
    });
    expect(result).toContain("left");
    expect(result).toContain("0");
    expect(result).toContain("1");
  });

  it("generates swap explanation", () => {
    const tags: SemanticTag[] = [
      { type: "swap", details: { target: "nums", i: 0, j: 1 } },
    ];
    const result = generateExplanation({
      tags,
      lineNo: 5,
      funcName: "test",
      eventType: "line",
    });
    expect(result).toContain("Swapped");
    expect(result).toContain("nums");
  });

  it("generates assignment explanation", () => {
    const tags: SemanticTag[] = [
      { type: "assignment", details: { name: "x", value: "42" } },
    ];
    const result = generateExplanation({
      tags,
      lineNo: 5,
      funcName: "test",
      eventType: "line",
    });
    expect(result).toContain("x");
    expect(result).toContain("42");
  });

  it("generates loop_iteration explanation", () => {
    const tags: SemanticTag[] = [
      { type: "loop_iteration", details: { line: 5, count: 3 } },
    ];
    const result = generateExplanation({
      tags,
      lineNo: 5,
      funcName: "test",
      eventType: "line",
    });
    expect(result).toContain("Loop iteration 3");
  });

  it("generates recursive_call explanation", () => {
    const tags: SemanticTag[] = [
      { type: "recursive_call", details: { func: "fib", args: "n=5" } },
    ];
    const result = generateExplanation({
      tags,
      lineNo: 3,
      funcName: "fib",
      eventType: "call",
    });
    expect(result).toContain("Recursive call");
    expect(result).toContain("fib");
  });

  it("generates function_entry explanation", () => {
    const tags: SemanticTag[] = [
      { type: "function_entry", details: { name: "solve" } },
    ];
    const result = generateExplanation({
      tags,
      lineNo: 1,
      funcName: "solve",
      eventType: "call",
    });
    expect(result).toContain("Entered function");
    expect(result).toContain("solve");
  });

  it("concatenates multiple tag explanations", () => {
    const tags: SemanticTag[] = [
      { type: "pointer_move", details: { name: "i", from: 0, to: 1 } },
      { type: "assignment", details: { name: "x", value: "5" } },
    ];
    const result = generateExplanation({
      tags,
      lineNo: 5,
      funcName: "test",
      eventType: "line",
    });
    expect(result).toContain("i");
    expect(result).toContain("x");
  });

  it("generates list_append explanation", () => {
    const tags: SemanticTag[] = [
      { type: "list_append", details: { target: "result", value: "appended 5" } },
    ];
    const result = generateExplanation({
      tags,
      lineNo: 5,
      funcName: "test",
      eventType: "line",
    });
    expect(result).toContain("Appended");
    expect(result).toContain("result");
  });

  it("generates window_expand explanation", () => {
    const tags: SemanticTag[] = [
      { type: "window_expand", details: { right: 5 } },
    ];
    const result = generateExplanation({
      tags,
      lineNo: 5,
      funcName: "test",
      eventType: "line",
    });
    expect(result).toContain("Window expanded");
  });

  it("generates hash_set explanation", () => {
    const tags: SemanticTag[] = [
      { type: "hash_set", details: { target: "seen", key: "a", value: "1" } },
    ];
    const result = generateExplanation({
      tags,
      lineNo: 5,
      funcName: "test",
      eventType: "line",
    });
    expect(result).toContain("Set");
    expect(result).toContain("seen");
  });
});
