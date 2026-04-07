"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VariablesPanel } from "./VariablesPanel";
import { CallStackPanel } from "./CallStackPanel";
import { OutputPanel } from "./OutputPanel";
import { Variable, Layers, Terminal } from "lucide-react";

export function SidePanels() {
  return (
    <div className="h-full flex flex-col bg-card">
      <Tabs defaultValue="variables" className="h-full flex flex-col">
        <TabsList className="mx-2 mt-2 shrink-0">
          <TabsTrigger value="variables" className="text-xs gap-1">
            <Variable className="w-3 h-3" /> Variables
          </TabsTrigger>
          <TabsTrigger value="callstack" className="text-xs gap-1">
            <Layers className="w-3 h-3" /> Call Stack
          </TabsTrigger>
          <TabsTrigger value="output" className="text-xs gap-1">
            <Terminal className="w-3 h-3" /> Output
          </TabsTrigger>
        </TabsList>

        <TabsContent value="variables" className="flex-1 min-h-0 overflow-hidden">
          <VariablesPanel />
        </TabsContent>
        <TabsContent value="callstack" className="flex-1 min-h-0 overflow-hidden">
          <CallStackPanel />
        </TabsContent>
        <TabsContent value="output" className="flex-1 min-h-0 overflow-hidden">
          <OutputPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
