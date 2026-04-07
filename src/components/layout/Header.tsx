"use client";

import Link from "next/link";
import { Eye, GitBranch, Share2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTraceStore } from "@/lib/store/useTraceStore";
import { useEditorStore } from "@/lib/store/useEditorStore";
import { compressToEncodedURIComponent } from "lz-string";
import { useCallback, useState } from "react";

export function Header({ children }: { children?: React.ReactNode }) {
  const { rawTrace, output, returnValue } = useTraceStore();
  const { code, input } = useEditorStore();
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    if (rawTrace.length === 0) return;

    const data = JSON.stringify({ code, input, trace: rawTrace, output, returnValue });
    const compressed = compressToEncodedURIComponent(data);
    const url = `${window.location.origin}/share?d=${compressed}`;

    if (url.length > 8000) {
      // Store in localStorage as fallback for large traces
      const id = Date.now().toString(36);
      localStorage.setItem(`algolens-share-${id}`, data);
      const shortUrl = `${window.location.origin}/share?id=${id}`;
      navigator.clipboard.writeText(shortUrl);
    } else {
      navigator.clipboard.writeText(url);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [rawTrace, code, input, output, returnValue]);

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Eye className="w-5 h-5 text-blue-500" />
        <span className="font-bold text-lg tracking-tight">
          Algo<span className="text-blue-500">Lens</span>
        </span>
      </Link>

      <nav className="flex items-center gap-2">
        {children}

        <Link href="/workspace">
          <Button variant="ghost" size="sm">
            <BookOpen className="w-4 h-4 mr-1" /> Workspace
          </Button>
        </Link>

        {rawTrace.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            {copied ? "Copied!" : "Share"}
          </Button>
        )}

        <a
          href="https://github.com/aayushakumar/AlgoLens"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="icon">
            <GitBranch className="w-4 h-4" />
          </Button>
        </a>
      </nav>
    </header>
  );
}
