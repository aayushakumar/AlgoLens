import type { ExampleProblem } from "@/lib/trace/types";

export const EXAMPLE_PROBLEMS: ExampleProblem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    category: "Hash Map",
    difficulty: "Easy",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    code: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    input: `[2, 7, 11, 15]\n9`,
    expectedOutput: "[0, 1]",
  },
  {
    id: "binary-search",
    title: "Binary Search",
    category: "Two Pointers",
    difficulty: "Easy",
    description:
      "Given a sorted array of integers and a target, return the index of the target using binary search.",
    code: `def binary_search(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    input: `[1, 3, 5, 7, 9, 11, 13, 15]\n7`,
    expectedOutput: "3",
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    category: "Stack",
    difficulty: "Easy",
    description:
      "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    code: `def is_valid(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return len(stack) == 0`,
    input: `"({[]})"`,
    expectedOutput: "True",
  },
  {
    id: "merge-sort",
    title: "Merge Sort",
    category: "Recursion",
    difficulty: "Medium",
    description:
      "Sort an array using the merge sort algorithm (divide and conquer).",
    code: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result`,
    input: `[38, 27, 43, 3, 9, 82, 10]`,
    expectedOutput: "[3, 9, 10, 27, 38, 43, 82]",
  },
  {
    id: "climbing-stairs",
    title: "Climbing Stairs (DP)",
    category: "Dynamic Programming",
    difficulty: "Easy",
    description:
      "You are climbing a staircase with n steps. Each time you can take 1 or 2 steps. How many distinct ways can you climb to the top?",
    code: `def climb_stairs(n):
    if n <= 2:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    dp[2] = 2
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]`,
    input: `6`,
    expectedOutput: "13",
  },
  {
    id: "max-sliding-window",
    title: "Sliding Window Maximum",
    category: "Sliding Window",
    difficulty: "Medium",
    description:
      "Find the maximum value in each sliding window of size k.",
    code: `def max_sliding_window(nums, k):
    from collections import deque
    result = []
    q = deque()
    for i in range(len(nums)):
        while q and q[0] < i - k + 1:
            q.popleft()
        while q and nums[q[-1]] < nums[i]:
            q.pop()
        q.append(i)
        if i >= k - 1:
            result.append(nums[q[0]])
    return result`,
    input: `[1, 3, -1, -3, 5, 3, 6, 7]\n3`,
    expectedOutput: "[3, 3, 5, 5, 6, 7]",
  },
  {
    id: "bubble-sort",
    title: "Bubble Sort",
    category: "Sorting",
    difficulty: "Easy",
    description: "Sort an array using the bubble sort algorithm — great for visualizing swaps.",
    code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`,
    input: `[64, 34, 25, 12, 22, 11, 90]`,
    expectedOutput: "[11, 12, 22, 25, 34, 64, 90]",
  },
  {
    id: "fibonacci",
    title: "Fibonacci (Recursive)",
    category: "Recursion",
    difficulty: "Easy",
    description: "Compute the nth Fibonacci number recursively — watch the recursion tree unfold.",
    code: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)`,
    input: `6`,
    expectedOutput: "8",
  },
];
