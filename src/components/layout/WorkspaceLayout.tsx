"use client";

import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { TestCaseInput } from "@/components/editor/TestCaseInput";
import { VisualizerCanvas } from "@/components/visualizer/VisualizerCanvas";
import { SidePanels } from "@/components/panels/SidePanels";
import { TimelinePlayer } from "@/components/player/TimelinePlayer";
import { PlaybackControls } from "@/components/player/PlaybackControls";
import { useTraceStore } from "@/lib/store/useTraceStore";

function ResizeHandle({ direction = "horizontal" }: { direction?: "horizontal" | "vertical" }) {
  return (
    <PanelResizeHandle
      className={`
        ${direction === "horizontal" ? "w-1.5 hover:w-2" : "h-1.5 hover:h-2"}
        bg-border hover:bg-blue-500/50 transition-all duration-150
        flex items-center justify-center
      `}
    >
      <div
        className={`
          ${direction === "horizontal" ? "w-0.5 h-8" : "h-0.5 w-8"}
          bg-muted-foreground/30 rounded-full
        `}
      />
    </PanelResizeHandle>
  );
}

export function WorkspaceLayout() {
  const { totalSteps } = useTraceStore();
  const hasTrace = totalSteps > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <PanelGroup orientation="vertical" className="flex-1">
        {/* Main content area */}
        <Panel defaultSize={hasTrace ? 80 : 100} minSize={40}>
          <PanelGroup orientation="horizontal">
            {/* Left: Code Editor + Input */}
            <Panel defaultSize={hasTrace ? 30 : 50} minSize={20}>
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0">
                  <CodeEditor />
                </div>
                <div className="border-t border-border h-[160px] shrink-0">
                  <TestCaseInput />
                </div>
              </div>
            </Panel>

            {hasTrace && (
              <>
                <ResizeHandle />

                {/* Center: Visualization Canvas */}
                <Panel defaultSize={45} minSize={25}>
                  <VisualizerCanvas />
                </Panel>

                <ResizeHandle />

                {/* Right: Side Panels */}
                <Panel defaultSize={25} minSize={15}>
                  <SidePanels />
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>

        {/* Bottom: Timeline + Controls */}
        {hasTrace && (
          <>
            <ResizeHandle direction="vertical" />
            <Panel defaultSize={20} minSize={10} maxSize={35}>
              <div className="h-full flex flex-col bg-card border-t border-border">
                <PlaybackControls />
                <TimelinePlayer />
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
