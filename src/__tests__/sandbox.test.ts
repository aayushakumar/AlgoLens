import { validateCodeSafety } from "@/lib/engine/sandbox";

describe("validateCodeSafety", () => {
  it("allows safe Python code", () => {
    const code = `
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
`;
    const result = validateCodeSafety(code);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("blocks import os", () => {
    const result = validateCodeSafety("import os\nos.system('ls')");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("os");
  });

  it("blocks import subprocess", () => {
    const result = validateCodeSafety("import subprocess");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("subprocess");
  });

  it("blocks import socket", () => {
    const result = validateCodeSafety("import socket");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("socket");
  });

  it("blocks import shutil", () => {
    const result = validateCodeSafety("import shutil");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("shutil");
  });

  it("blocks from os import", () => {
    const result = validateCodeSafety("from os import path");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("os");
  });

  it("blocks from subprocess import", () => {
    const result = validateCodeSafety("from subprocess import call");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("subprocess");
  });

  it("blocks __import__", () => {
    const result = validateCodeSafety("__import__('os')");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("__import__");
  });

  it("blocks open()", () => {
    const result = validateCodeSafety("f = open('secret.txt')");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("open");
  });

  it("blocks exec()", () => {
    const result = validateCodeSafety("exec('print(1)')");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exec");
  });

  it("blocks eval()", () => {
    const result = validateCodeSafety("eval('1+1')");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("eval");
  });

  it("rejects empty code", () => {
    const result = validateCodeSafety("");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("enter some code");
  });

  it("rejects whitespace-only code", () => {
    const result = validateCodeSafety("   \n  ");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("enter some code");
  });

  it("allows math import", () => {
    const code = "import math\ndef solve(n):\n    return math.sqrt(n)";
    const result = validateCodeSafety(code);
    expect(result.valid).toBe(true);
  });

  it("allows collections import", () => {
    const code = "from collections import defaultdict\ndef solve():\n    d = defaultdict(int)";
    const result = validateCodeSafety(code);
    expect(result.valid).toBe(true);
  });

  it("allows heapq import", () => {
    const code = "import heapq\ndef solve(nums):\n    heapq.heapify(nums)";
    const result = validateCodeSafety(code);
    expect(result.valid).toBe(true);
  });
});
