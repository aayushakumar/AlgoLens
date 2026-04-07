import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { TraceStep } from "@/lib/trace/types";

export interface ShareData {
  code: string;
  input: string;
  trace: TraceStep[];
  output: string;
  returnValue?: string;
}

/**
 * Compress share data for URL encoding.
 * Returns the compressed string suitable for a URL parameter.
 */
export function compressShareData(data: ShareData): string {
  const json = JSON.stringify(data);
  return compressToEncodedURIComponent(json);
}

/**
 * Decompress share data from a URL parameter.
 */
export function decompressShareData(compressed: string): ShareData | null {
  try {
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json) as ShareData;
  } catch {
    return null;
  }
}

/**
 * Save a session to localStorage.
 */
export function saveSession(data: ShareData): string {
  const id = Date.now().toString(36);
  const sessions = getRecentSessions();
  sessions.unshift({ id, timestamp: Date.now(), code: data.code, title: getTitle(data.code) });

  // Keep only last 10 sessions
  const trimmed = sessions.slice(0, 10);
  localStorage.setItem("algolens-sessions", JSON.stringify(trimmed));
  localStorage.setItem(`algolens-session-${id}`, JSON.stringify(data));
  return id;
}

/**
 * Load a session from localStorage.
 */
export function loadSession(id: string): ShareData | null {
  try {
    const data = localStorage.getItem(`algolens-session-${id}`);
    if (!data) return null;
    return JSON.parse(data) as ShareData;
  } catch {
    return null;
  }
}

export interface SessionMeta {
  id: string;
  timestamp: number;
  code: string;
  title: string;
}

/**
 * Get list of recent sessions.
 */
export function getRecentSessions(): SessionMeta[] {
  try {
    const data = localStorage.getItem("algolens-sessions");
    if (!data) return [];
    return JSON.parse(data) as SessionMeta[];
  } catch {
    return [];
  }
}

function getTitle(code: string): string {
  // Extract function name from code
  const match = code.match(/def\s+(\w+)/);
  return match ? match[1] : "Untitled";
}
