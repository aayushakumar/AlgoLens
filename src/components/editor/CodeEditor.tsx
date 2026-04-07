"use client";

import dynamic from "next/dynamic";
import { useEditorStore } from "@/lib/store/useEditorStore";
import { useTraceStore } from "@/lib/store/useTraceStore";
import { usePyodide } from "@/hooks/usePyodide";
import { Button } from "@/components/ui/button";
import { Play, Loader2, Zap } from "lucide-react";
import { useCallback, useRef, useEffect } from "react";
import type { editor } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-zinc-500">
      Loading editor...
    </div>
  ),
});

export function CodeEditor() {
  const { code, setCode } = useEditorStore();
  const {
    isExecuting,
    isPyodideLoading,
    currentStepIndex,
    semanticSteps,
    totalSteps,
  } = useTraceStore();
  const { execute } = usePyodide();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleVisualize = useCallback(async () => {
    const input = useEditorStore.getState().input;
    await execute(code, input);
  }, [code, execute]);

  // Highlight current line in editor
  useEffect(() => {
    if (!editorRef.current || totalSteps === 0) return;

    const step = semanticSteps[currentStepIndex];
    if (!step) return;

    const lineNo = step.raw.lineNo;
    const monacoInstance = editorRef.current;

    decorationsRef.current = monacoInstance.deltaDecorations(
      decorationsRef.current,
      [
        {
          range: {
            startLineNumber: lineNo,
            startColumn: 1,
            endLineNumber: lineNo,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: "bg-blue-500/20",
            glyphMarginClassName: "bg-blue-500 rounded-full",
          },
        },
      ]
    );

    monacoInstance.revealLineInCenterIfOutsideViewport(lineNo);
  }, [currentStepIndex, semanticSteps, totalSteps]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-10 flex items-center justify-between px-3 bg-card border-b border-border shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Python Code
        </span>
        <Button
          size="sm"
          onClick={handleVisualize}
          disabled={isExecuting || isPyodideLoading}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md"
        >
          {isPyodideLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading Python...
            </>
          ) : isExecuting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              {totalSteps > 0 ? (
                <Zap className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Visualize
            </>
          )}
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={(value) => setCode(value ?? "")}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineHeight: 22,
            padding: { top: 8 },
            formatOnPaste: true,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: "on",
            glyphMargin: true,
            folding: true,
            lineNumbersMinChars: 3,
            renderLineHighlight: "none",
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  );
}
