import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlgoLens — See your code think",
  description:
    "Interactive algorithm visualizer that turns pasted Python code into step-by-step visual execution replays. Perfect for LeetCode, DSA practice, and learning.",
  keywords: [
    "algorithm",
    "visualizer",
    "LeetCode",
    "DSA",
    "Python",
    "code execution",
    "data structures",
  ],
  openGraph: {
    title: "AlgoLens — See your code think",
    description:
      "Paste Python code. Watch every iteration, pointer move, and recursion call unfold visually.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
