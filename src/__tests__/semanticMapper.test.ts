import { mapTraceToSemantic } from "@/lib/trace/semanticMapper";
import type { TraceStep } from "@/lib/trace/types";

const makeStep = (overrides: Partial<TraceStep> = {}): TraceStep => ({
  stepId: 1,
  eventType: "line",
  lineNo: 1,
  funcName: "test_func",
  frameId: "f1",
  callStackDepth: 1,
  locals: {},
  stdout: "",
  ...overrides,
});

describe("mapTraceToSemantic", () => {
  it("returns empty array for empty trace", () => {
    expect(mapTraceToSemantic([])).toEqual([]);
  });

  it("returns one semantic step per trace step", () => {
    const trace = [
      makeStep({ stepId: 1, locals: { x: "1" } }),
      makeStep({ stepId: 2, locals: { x: "2" } }),
    ];
    const result = mapTraceToSemantic(trace);
    expect(result).toHaveLength(2);
  });

  it("generates diffs between consecutive steps", () => {
    const trace = [
      makeStep({ stepId: 1, locals: { x: "1" } }),
      makeStep({ stepId: 2, locals: { x: "2" } }),
    ];
    const result = mapTraceToSemantic(trace);
    const secondStep = result[1];
    expect(secondStep.diffs.some((d) => d.diffType === "changed" && d.varName === "x")).toBe(true);
  });

  it("detects function entry on call event", () => {
    const trace = [
      makeStep({ stepId: 1, eventType: "call", funcName: "solve" }),
    ];
    const result = mapTraceToSemantic(trace);
    expect(result[0].semanticTags.some((t) => t.type === "function_entry")).toBe(true);
  });

  it("detects function exit on return event", () => {
    const trace = [
      makeStep({ stepId: 1, eventType: "return", funcName: "solve", returnValue: "42" }),
    ];
    const result = mapTraceToSemantic(trace);
    expect(result[0].semanticTags.some((t) => t.type === "function_exit")).toBe(true);
  });

  it("detects pointer movement", () => {
    const trace = [
      makeStep({ stepId: 1, locals: { left: "0", nums: "[1, 2, 3]" } }),
      makeStep({ stepId: 2, locals: { left: "1", nums: "[1, 2, 3]" } }),
    ];
    const result = mapTraceToSemantic(trace);
    const tags = result[1].semanticTags;
    expect(tags.some((t) => t.type === "pointer_move" && t.details.name === "left")).toBe(true);
  });

  it("detects array data structures", () => {
    const trace = [
      makeStep({ stepId: 1, locals: { nums: "[1, 2, 3]" } }),
    ];
    const result = mapTraceToSemantic(trace);
    expect(result[0].dataStructures.some((ds) => ds.type === "array" && ds.name === "nums")).toBe(true);
  });

  it("detects hashmap data structures", () => {
    const trace = [
      makeStep({ stepId: 1, locals: { seen: "{'a': 1}" } }),
    ];
    const result = mapTraceToSemantic(trace);
    expect(result[0].dataStructures.some((ds) => ds.type === "hashmap" && ds.name === "seen")).toBe(true);
  });

  it("detects stack-named arrays as stacks", () => {
    const trace = [
      makeStep({ stepId: 1, locals: { stack: "[1, 2]" } }),
    ];
    const result = mapTraceToSemantic(trace);
    expect(result[0].dataStructures.some((ds) => ds.type === "stack" && ds.name === "stack")).toBe(true);
  });

  it("detects matrix data structures", () => {
    const trace = [
      makeStep({ stepId: 1, locals: { grid: "[[1, 2], [3, 4]]" } }),
    ];
    const result = mapTraceToSemantic(trace);
    expect(result[0].dataStructures.some((ds) => ds.type === "matrix" && ds.name === "grid")).toBe(true);
  });

  it("generates explanations for each step", () => {
    const trace = [
      makeStep({ stepId: 1, eventType: "call", funcName: "twoSum", locals: { nums: "[2, 7]", target: "9" } }),
    ];
    const result = mapTraceToSemantic(trace);
    expect(result[0].explanation).toBeTruthy();
    expect(typeof result[0].explanation).toBe("string");
  });

  it("detects loop iterations on same line", () => {
    const trace = [
      makeStep({ stepId: 1, lineNo: 5, locals: { i: "0" } }),
      makeStep({ stepId: 2, lineNo: 5, locals: { i: "1" } }),
    ];
    const result = mapTraceToSemantic(trace);
    expect(result[1].semanticTags.some((t) => t.type === "loop_iteration")).toBe(true);
  });

  it("detects assignments for new variables", () => {
    const trace = [
      makeStep({ stepId: 1, locals: {} }),
      makeStep({ stepId: 2, locals: { result: "0" } }),
    ];
    const result = mapTraceToSemantic(trace);
    expect(result[1].semanticTags.some((t) => t.type === "assignment" && t.details.name === "result")).toBe(true);
  });

  it("associates pointers with the first array DS", () => {
    const trace = [
      makeStep({ stepId: 1, locals: { nums: "[1, 2, 3]", left: "0", right: "2" } }),
    ];
    const result = mapTraceToSemantic(trace);
    expect(result[0].pointers.length).toBeGreaterThanOrEqual(2);
    const leftPtr = result[0].pointers.find((p) => p.name === "left");
    expect(leftPtr?.index).toBe(0);
    const rightPtr = result[0].pointers.find((p) => p.name === "right");
    expect(rightPtr?.index).toBe(2);
  });

  it("builds call stack from trace history", () => {
    const trace = [
      makeStep({ stepId: 1, eventType: "call", funcName: "main", frameId: "f1", callStackDepth: 1 }),
      makeStep({ stepId: 2, eventType: "call", funcName: "helper", frameId: "f2", callStackDepth: 2 }),
      makeStep({ stepId: 3, eventType: "line", funcName: "helper", frameId: "f2", callStackDepth: 2, locals: { x: "1" } }),
    ];
    const result = mapTraceToSemantic(trace);
    const lastStep = result[2];
    expect(lastStep.callStack).toHaveLength(2);
    expect(lastStep.callStack[0].funcName).toBe("main");
    expect(lastStep.callStack[1].funcName).toBe("helper");
  });
});
