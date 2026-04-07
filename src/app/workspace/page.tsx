"use client";

import { Suspense, useState } from "react";
import { Header } from "@/components/layout/Header";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { EXAMPLE_PROBLEMS } from "@/lib/examples/problems";
import { useEditorStore } from "@/lib/store/useEditorStore";
import { useTraceStore } from "@/lib/store/useTraceStore";
import { ChevronDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

function ExampleSelector() {
  const [open, setOpen] = useState(false);
  const setCode = useEditorStore((s) => s.setCode);
  const setInput = useEditorStore((s) => s.setInput);
  const clearTrace = useTraceStore((s) => s.clearTrace);

  const handleSelect = (problemId: string) => {
    const problem = EXAMPLE_PROBLEMS.find((p) => p.id === problemId);
    if (problem) {
      setCode(problem.code);
      setInput(problem.input);
      clearTrace();
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1"
      >
        <BookOpen className="h-4 w-4" />
        Examples
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 w-72 rounded-lg border border-border bg-card shadow-lg p-2 max-h-80 overflow-y-auto">
            {EXAMPLE_PROBLEMS.map((problem) => (
              <button
                key={problem.id}
                onClick={() => handleSelect(problem.id)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      problem.difficulty === "Easy"
                        ? "bg-green-500/10 text-green-400"
                        : problem.difficulty === "Medium"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                  <span className="text-sm font-medium">{problem.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {problem.description}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WorkspaceContent() {
  return (
    <div className="flex flex-col h-full">
      <Header>
        <ExampleSelector />
      </Header>
      <div className="flex-1 overflow-hidden">
        <WorkspaceLayout />
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading workspace...
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}
