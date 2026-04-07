import { computeDiffs, parseValue, isArrayLike, isMatrixLike, isDictLike } from "@/lib/trace/diffEngine";
import type { TraceStep } from "@/lib/trace/types";

const makeStep = (overrides: Partial<TraceStep> = {}): TraceStep => ({
  stepId: 1,
  eventType: "line",
  lineNo: 1,
  funcName: "test",
  frameId: "f1",
  callStackDepth: 1,
  locals: {},
  stdout: "",
  ...overrides,
});

describe("parseValue", () => {
  it("parses None to null", () => {
    expect(parseValue("None")).toBeNull();
  });

  it("parses True/False to booleans", () => {
    expect(parseValue("True")).toBe(true);
    expect(parseValue("False")).toBe(false);
  });

  it("parses numbers", () => {
    expect(parseValue("42")).toBe(42);
    expect(parseValue("3.14")).toBe(3.14);
  });

  it("parses Python lists (single quotes)", () => {
    expect(parseValue("[1, 2, 3]")).toEqual([1, 2, 3]);
  });

  it("parses Python dicts", () => {
    expect(parseValue("{'a': 1, 'b': 2}")).toEqual({ a: 1, b: 2 });
  });

  it("parses strings", () => {
    expect(parseValue("'hello'")).toBe("hello");
  });

  it("returns raw string for unparseable values", () => {
    expect(parseValue("<object at 0x123>")).toBe("<object at 0x123>");
  });

  it("handles mixed booleans in lists", () => {
    expect(parseValue("[True, False, None]")).toEqual([true, false, null]);
  });
});

describe("isArrayLike", () => {
  it("returns true for list repr", () => {
    expect(isArrayLike("[1, 2, 3]")).toBe(true);
  });

  it("returns true for empty list", () => {
    expect(isArrayLike("[]")).toBe(true);
  });

  it("returns false for dict", () => {
    expect(isArrayLike("{'a': 1}")).toBe(false);
  });

  it("returns false for plain number", () => {
    expect(isArrayLike("42")).toBe(false);
  });
});

describe("isMatrixLike", () => {
  it("returns true for nested lists", () => {
    expect(isMatrixLike("[[1, 2], [3, 4]]")).toBe(true);
  });

  it("returns false for flat list", () => {
    expect(isMatrixLike("[1, 2, 3]")).toBe(false);
  });

  it("returns false for empty list", () => {
    expect(isMatrixLike("[]")).toBe(false);
  });
});

describe("isDictLike", () => {
  it("returns true for dict repr", () => {
    expect(isDictLike("{'a': 1}")).toBe(true);
  });

  it("returns true for empty dict", () => {
    expect(isDictLike("{}")).toBe(true);
  });

  it("returns false for list", () => {
    expect(isDictLike("[1, 2]")).toBe(false);
  });
});

describe("computeDiffs", () => {
  it("marks all as added when prev is null", () => {
    const curr = makeStep({ locals: { x: "1", y: "2" } });
    const diffs = computeDiffs(null, curr);
    expect(diffs).toHaveLength(2);
    expect(diffs.every((d) => d.diffType === "added")).toBe(true);
  });

  it("detects changed variables", () => {
    const prev = makeStep({ locals: { x: "1" } });
    const curr = makeStep({ locals: { x: "2" } });
    const diffs = computeDiffs(prev, curr);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].diffType).toBe("changed");
    expect(diffs[0].oldValue).toBe("1");
    expect(diffs[0].newValue).toBe("2");
  });

  it("detects removed variables", () => {
    const prev = makeStep({ locals: { x: "1", y: "2" } });
    const curr = makeStep({ locals: { x: "1" } });
    const diffs = computeDiffs(prev, curr);
    const removed = diffs.find((d) => d.varName === "y");
    expect(removed?.diffType).toBe("removed");
  });

  it("marks unchanged variables", () => {
    const prev = makeStep({ locals: { x: "1" } });
    const curr = makeStep({ locals: { x: "1" } });
    const diffs = computeDiffs(prev, curr);
    expect(diffs[0].diffType).toBe("unchanged");
  });

  it("detects list append", () => {
    const prev = makeStep({ locals: { nums: "[1, 2]" } });
    const curr = makeStep({ locals: { nums: "[1, 2, 3]" } });
    const diffs = computeDiffs(prev, curr);
    expect(diffs[0].details).toContain("appended");
  });

  it("detects list element removal", () => {
    const prev = makeStep({ locals: { nums: "[1, 2, 3]" } });
    const curr = makeStep({ locals: { nums: "[1, 2]" } });
    const diffs = computeDiffs(prev, curr);
    expect(diffs[0].details).toContain("removed element");
  });

  it("detects swap", () => {
    const prev = makeStep({ locals: { nums: "[3, 1, 2]" } });
    const curr = makeStep({ locals: { nums: "[1, 3, 2]" } });
    const diffs = computeDiffs(prev, curr);
    expect(diffs[0].details).toContain("swapped indices 0 and 1");
  });

  it("detects element change at index", () => {
    const prev = makeStep({ locals: { nums: "[1, 2, 3]" } });
    const curr = makeStep({ locals: { nums: "[1, 99, 3]" } });
    const diffs = computeDiffs(prev, curr);
    expect(diffs[0].details).toContain("element at index 1 changed");
  });
});
