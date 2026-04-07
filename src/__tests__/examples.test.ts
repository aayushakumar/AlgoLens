import { EXAMPLE_PROBLEMS } from "@/lib/examples/problems";

describe("EXAMPLE_PROBLEMS", () => {
  it("has at least 5 examples", () => {
    expect(EXAMPLE_PROBLEMS.length).toBeGreaterThanOrEqual(5);
  });

  it("each example has required fields", () => {
    for (const problem of EXAMPLE_PROBLEMS) {
      expect(problem.id).toBeTruthy();
      expect(problem.title).toBeTruthy();
      expect(problem.category).toBeTruthy();
      expect(["Easy", "Medium", "Hard"]).toContain(problem.difficulty);
      expect(problem.description).toBeTruthy();
      expect(problem.code).toBeTruthy();
      expect(problem.code).toContain("def ");
      expect(typeof problem.input).toBe("string");
    }
  });

  it("has unique ids", () => {
    const ids = EXAMPLE_PROBLEMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes Two Sum", () => {
    const twoSum = EXAMPLE_PROBLEMS.find((p) => p.id === "two-sum");
    expect(twoSum).toBeDefined();
    expect(twoSum!.difficulty).toBe("Easy");
  });

  it("includes Binary Search", () => {
    const bs = EXAMPLE_PROBLEMS.find((p) => p.id === "binary-search");
    expect(bs).toBeDefined();
  });

  it("code is valid Python (contains def)", () => {
    for (const problem of EXAMPLE_PROBLEMS) {
      expect(problem.code).toMatch(/def\s+\w+/);
    }
  });

  it("has a mix of difficulties", () => {
    const difficulties = new Set(EXAMPLE_PROBLEMS.map((p) => p.difficulty));
    expect(difficulties.size).toBeGreaterThanOrEqual(2);
  });
});
