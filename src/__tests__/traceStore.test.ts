import { useTraceStore } from "@/lib/store/useTraceStore";
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

describe("useTraceStore", () => {
  beforeEach(() => {
    useTraceStore.getState().clearTrace();
  });

  it("starts with empty state", () => {
    const state = useTraceStore.getState();
    expect(state.rawTrace).toEqual([]);
    expect(state.totalSteps).toBe(0);
    expect(state.currentStepIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  it("setTrace updates trace and resets playback", () => {
    const trace = [makeStep({ stepId: 1 }), makeStep({ stepId: 2 })];
    useTraceStore.getState().setTrace(trace, "output", "42");
    const state = useTraceStore.getState();
    expect(state.rawTrace).toHaveLength(2);
    expect(state.totalSteps).toBe(2);
    expect(state.currentStepIndex).toBe(0);
    expect(state.output).toBe("output");
    expect(state.returnValue).toBe("42");
  });

  it("stepForward advances index and pauses playback", () => {
    const trace = [makeStep({ stepId: 1 }), makeStep({ stepId: 2 }), makeStep({ stepId: 3 })];
    useTraceStore.getState().setTrace(trace, "");
    useTraceStore.getState().play();
    useTraceStore.getState().stepForward();
    expect(useTraceStore.getState().currentStepIndex).toBe(1);
    // Manual step should pause playback
    expect(useTraceStore.getState().isPlaying).toBe(false);
  });

  it("stepForward does not go past end", () => {
    const trace = [makeStep({ stepId: 1 })];
    useTraceStore.getState().setTrace(trace, "");
    useTraceStore.getState().stepForward();
    useTraceStore.getState().stepForward();
    expect(useTraceStore.getState().currentStepIndex).toBe(0);
  });

  it("advanceStep increments without touching isPlaying", () => {
    const trace = [makeStep({ stepId: 1 }), makeStep({ stepId: 2 }), makeStep({ stepId: 3 })];
    useTraceStore.getState().setTrace(trace, "");
    useTraceStore.getState().play();
    useTraceStore.getState().advanceStep();
    expect(useTraceStore.getState().currentStepIndex).toBe(1);
    // Should still be playing
    expect(useTraceStore.getState().isPlaying).toBe(true);
  });

  it("advanceStep stops playback at the last step", () => {
    const trace = [makeStep({ stepId: 1 }), makeStep({ stepId: 2 })];
    useTraceStore.getState().setTrace(trace, "");
    useTraceStore.getState().play();
    useTraceStore.getState().advanceStep(); // moves to index 1 (last)
    useTraceStore.getState().advanceStep(); // tries to go past end → stops
    expect(useTraceStore.getState().currentStepIndex).toBe(1);
    expect(useTraceStore.getState().isPlaying).toBe(false);
  });

  it("stepBackward decrements index", () => {
    const trace = [makeStep({ stepId: 1 }), makeStep({ stepId: 2 })];
    useTraceStore.getState().setTrace(trace, "");
    useTraceStore.getState().stepForward();
    useTraceStore.getState().stepBackward();
    expect(useTraceStore.getState().currentStepIndex).toBe(0);
  });

  it("stepBackward does not go below 0", () => {
    const trace = [makeStep({ stepId: 1 })];
    useTraceStore.getState().setTrace(trace, "");
    useTraceStore.getState().stepBackward();
    expect(useTraceStore.getState().currentStepIndex).toBe(0);
  });

  it("jumpTo sets specific index", () => {
    const trace = [makeStep({ stepId: 1 }), makeStep({ stepId: 2 }), makeStep({ stepId: 3 })];
    useTraceStore.getState().setTrace(trace, "");
    useTraceStore.getState().jumpTo(2);
    expect(useTraceStore.getState().currentStepIndex).toBe(2);
  });

  it("jumpTo clamps to valid range", () => {
    const trace = [makeStep({ stepId: 1 }), makeStep({ stepId: 2 })];
    useTraceStore.getState().setTrace(trace, "");
    useTraceStore.getState().jumpTo(100);
    expect(useTraceStore.getState().currentStepIndex).toBe(1);
    useTraceStore.getState().jumpTo(-5);
    expect(useTraceStore.getState().currentStepIndex).toBe(0);
  });

  it("jumpToStart sets index to 0", () => {
    const trace = [makeStep({ stepId: 1 }), makeStep({ stepId: 2 })];
    useTraceStore.getState().setTrace(trace, "");
    useTraceStore.getState().jumpTo(1);
    useTraceStore.getState().jumpToStart();
    expect(useTraceStore.getState().currentStepIndex).toBe(0);
  });

  it("jumpToEnd sets index to last step", () => {
    const trace = [makeStep({ stepId: 1 }), makeStep({ stepId: 2 }), makeStep({ stepId: 3 })];
    useTraceStore.getState().setTrace(trace, "");
    useTraceStore.getState().jumpToEnd();
    expect(useTraceStore.getState().currentStepIndex).toBe(2);
  });

  it("play/pause toggle works", () => {
    useTraceStore.getState().play();
    expect(useTraceStore.getState().isPlaying).toBe(true);
    useTraceStore.getState().pause();
    expect(useTraceStore.getState().isPlaying).toBe(false);
  });

  it("togglePlay toggles playing state", () => {
    useTraceStore.getState().togglePlay();
    expect(useTraceStore.getState().isPlaying).toBe(true);
    useTraceStore.getState().togglePlay();
    expect(useTraceStore.getState().isPlaying).toBe(false);
  });

  it("setSpeed changes playback speed", () => {
    useTraceStore.getState().setSpeed(2);
    expect(useTraceStore.getState().playbackSpeed).toBe(2);
    useTraceStore.getState().setSpeed(0.5);
    expect(useTraceStore.getState().playbackSpeed).toBe(0.5);
  });

  it("clearTrace resets everything", () => {
    const trace = [makeStep({ stepId: 1 })];
    useTraceStore.getState().setTrace(trace, "output", "42");
    useTraceStore.getState().clearTrace();
    const state = useTraceStore.getState();
    expect(state.rawTrace).toEqual([]);
    expect(state.totalSteps).toBe(0);
    expect(state.output).toBe("");
  });
});
