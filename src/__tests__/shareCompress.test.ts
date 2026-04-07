import { compressShareData, decompressShareData } from "@/lib/share/compress";
import type { TraceStep } from "@/lib/trace/types";

// Mock lz-string
jest.mock("lz-string", () => ({
  compressToEncodedURIComponent: (s: string) =>
    Buffer.from(s).toString("base64"),
  decompressFromEncodedURIComponent: (s: string) =>
    Buffer.from(s, "base64").toString("utf-8"),
}));

const sampleTrace: TraceStep[] = [
  {
    stepId: 1,
    eventType: "line",
    lineNo: 1,
    funcName: "two_sum",
    frameId: "f1",
    callStackDepth: 1,
    locals: { nums: "[2, 7, 11, 15]", target: "9" },
    stdout: "",
  },
  {
    stepId: 2,
    eventType: "line",
    lineNo: 2,
    funcName: "two_sum",
    frameId: "f1",
    callStackDepth: 1,
    locals: { nums: "[2, 7, 11, 15]", target: "9", seen: "{}" },
    stdout: "",
  },
];

describe("compressShareData / decompressShareData", () => {
  it("round-trips share data", () => {
    const data = {
      code: 'def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        if target - num in seen:\n            return [seen[target - num], i]\n        seen[num] = i\n    return []',
      input: "[2, 7, 11, 15]\n9",
      trace: sampleTrace,
      output: "",
      returnValue: "[0, 1]",
    };

    const compressed = compressShareData(data);
    expect(typeof compressed).toBe("string");
    expect(compressed.length).toBeGreaterThan(0);

    const decompressed = decompressShareData(compressed);
    expect(decompressed).not.toBeNull();
    expect(decompressed!.code).toBe(data.code);
    expect(decompressed!.input).toBe(data.input);
    expect(decompressed!.trace).toHaveLength(2);
    expect(decompressed!.returnValue).toBe("[0, 1]");
  });

  it("returns null for invalid compressed data", () => {
    const result = decompressShareData("not-valid-base64!@#$");
    expect(result).toBeNull();
  });
});
