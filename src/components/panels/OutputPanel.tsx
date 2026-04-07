"use client";

import { useTraceStore } from "@/lib/store/useTraceStore";
import { Terminal, CheckCircle2, XCircle } from "lucide-react";

export function OutputPanel() {
  const { output, returnValue, executionError, totalSteps } = useTraceStore();

  return (
    <div className="p-3 h-full overflow-auto font-mono text-xs">
      {/* Return value */}
      {returnValue && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Return Value
            </span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2 text-emerald-200">
            {returnValue}
          </div>
        </div>
      )}

      {/* Error */}
      {executionError && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-red-400 mb-1">
            <XCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Error
            </span>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2 text-red-200 break-all">
            {executionError}
          </div>
        </div>
      )}

      {/* Stdout */}
      <div>
        <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
          <Terminal className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase font-bold tracking-wider">
            Console Output
          </span>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded px-3 py-2 text-zinc-300 min-h-[40px] whitespace-pre-wrap">
          {output || (totalSteps > 0 ? "(no output)" : "Run code to see output")}
        </div>
      </div>
    </div>
  );
}
