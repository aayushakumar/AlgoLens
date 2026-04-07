import { create } from "zustand";

interface EditorState {
  code: string;
  input: string;
  setCode: (code: string) => void;
  setInput: (input: string) => void;
}

const DEFAULT_CODE = `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`;

const DEFAULT_INPUT = `[2, 7, 11, 15]\n9`;

export const useEditorStore = create<EditorState>((set) => ({
  code: DEFAULT_CODE,
  input: DEFAULT_INPUT,
  setCode: (code) => set({ code }),
  setInput: (input) => set({ input }),
}));
