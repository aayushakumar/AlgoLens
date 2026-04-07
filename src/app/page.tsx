"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  Code2,
  Eye,
  Layers,
  ArrowRight,
  Braces,
  GitBranch,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXAMPLE_PROBLEMS } from "@/lib/examples/problems";
import { useEditorStore } from "@/lib/store/useEditorStore";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: Code2,
    title: "Paste Any Python",
    description:
      "Drop your LeetCode solution or any Python algorithm. No setup, no installs.",
  },
  {
    icon: Eye,
    title: "Watch It Execute",
    description:
      "See every variable change, pointer move, and recursion call unfold step by step.",
  },
  {
    icon: Layers,
    title: "Smart Visualizations",
    description:
      "Arrays, trees, stacks, hashmaps — automatically detected and beautifully rendered.",
  },
  {
    icon: BarChart3,
    title: "Understand, Don't Memorize",
    description:
      "Plain-English explanations for every step help you truly understand the algorithm.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function LandingPage() {
  const router = useRouter();
  const setCode = useEditorStore((s) => s.setCode);
  const setInput = useEditorStore((s) => s.setInput);

  const handleTryExample = (problemId: string) => {
    const problem = EXAMPLE_PROBLEMS.find((p) => p.id === problemId);
    if (problem) {
      setCode(problem.code);
      setInput(problem.input);
    }
    router.push("/workspace");
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="border-b border-border/40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Braces className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">AlgoLens</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <GitBranch className="h-5 w-5" />
            </a>
            <Link href="/workspace">
              <Button size="sm">
                Open Editor
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <motion.div
          className="text-center max-w-3xl"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } },
          }}
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium"
          >
            <Play className="h-3 w-3" />
            Algorithm Visualization Made Simple
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight"
          >
            See your code{" "}
            <span className="text-primary">think</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Paste any Python algorithm and watch it execute step by step.
            Variables, pointers, data structures — all visualized in real time.
            No installs. Runs entirely in your browser.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-8 flex items-center gap-4 justify-center"
          >
            <Link href="/workspace">
              <Button size="lg" className="text-base px-8">
                <Play className="mr-2 h-5 w-5" />
                Start Visualizing
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <feature.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Try an Example */}
      <section className="px-6 py-16 border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">
            Try an example
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Pick a classic problem and see it visualized instantly
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EXAMPLE_PROBLEMS.slice(0, 8).map((problem) => (
              <button
                key={problem.id}
                onClick={() => handleTryExample(problem.id)}
                className="group rounded-lg border border-border hover:border-primary/50 bg-card p-4 text-left transition-all hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      problem.difficulty === "Easy"
                        ? "bg-green-500/10 text-green-400"
                        : problem.difficulty === "Medium"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-medium text-sm mb-1">{problem.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {problem.description}
                </p>
                <div className="mt-2">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    {problem.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <span>AlgoLens — See your code think</span>
          <span>Built with Next.js & Pyodide</span>
        </div>
      </footer>
    </div>
  );
}
