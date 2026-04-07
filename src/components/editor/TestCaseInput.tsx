"use client";

import { useEditorStore } from "@/lib/store/useEditorStore";
import { useTraceStore } from "@/lib/store/useTraceStore";
import { AlertCircle } from "lucide-react";

export function TestCaseInput() {
  const { input, setInput } = useEditorStore();
  const { executionError } = useTraceStore();

  return (
    <div className="h-full flex flex-col">
      <div className="h-8 flex items-center px-3 bg-card border-b border-border shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Test Input
        </span>
        <span className="ml-2 text-xs text-muted-foreground/60">
          (one argument per line)
        </span>
      </div>
      <div className="flex-1 relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`[2, 7, 11, 15]\n9`}
          className="w-full h-full bg-[#1e1e1e] text-zinc-300 p-3 text-sm font-mono resize-none focus:outline-none placeholder:text-zinc-600"
          spellCheck={false}
        />
      </div>
      {executionError && (
        <div className="px-3 py-2 bg-red-950/50 border-t border-red-800/50 flex items-start gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-300 font-mono break-all">
            {executionError}
          </span>
        </div>
      )}
    </div>
  );
}
