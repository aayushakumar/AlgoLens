"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { decompressFromEncodedURIComponent } from "lz-string";
import { Header } from "@/components/layout/Header";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { useTraceStore } from "@/lib/store/useTraceStore";
import { useEditorStore } from "@/lib/store/useEditorStore";
import { mapTraceToSemantic } from "@/lib/trace/semanticMapper";
import type { TraceStep } from "@/lib/trace/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ShareData {
  code: string;
  input: string;
  trace: TraceStep[];
  output?: string;
  returnValue?: string;
}

function ShareContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const setCode = useEditorStore((s) => s.setCode);
  const setInput = useEditorStore((s) => s.setInput);
  const setTrace = useTraceStore((s) => s.setTrace);

  useEffect(() => {
    try {
      const compressed = searchParams.get("d");
      const localId = searchParams.get("id");

      let raw: string | null = null;

      if (compressed) {
        raw = decompressFromEncodedURIComponent(compressed);
      } else if (localId) {
        raw = localStorage.getItem(`algolens-share-${localId}`);
      }

      if (!raw) {
        setError("No shared data found. The link may be invalid or expired.");
        return;
      }

      const data: ShareData = JSON.parse(raw);

      if (!data.code || !Array.isArray(data.trace)) {
        setError("Invalid share data format.");
        return;
      }

      setCode(data.code);
      setInput(data.input || "");

      const semanticSteps = mapTraceToSemantic(data.trace);
      setTrace(data.trace, data.output || "", data.returnValue);
      useTraceStore.getState().setSemanticSteps(semanticSteps);
      setLoaded(true);
    } catch {
      setError("Failed to load shared visualization. The data may be corrupted.");
    }
  }, [searchParams, setCode, setInput, setTrace]);

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
            <h2 className="text-xl font-semibold">Unable to Load</h2>
            <p className="text-muted-foreground max-w-md">{error}</p>
            <Link href="/workspace">
              <Button>Go to Workspace</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading shared visualization...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-hidden">
        <WorkspaceLayout />
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ShareContent />
    </Suspense>
  );
}
