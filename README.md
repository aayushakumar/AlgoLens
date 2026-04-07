# AlgoLens

> **See your code think.**

AlgoLens turns any Python algorithm into an interactive, step-by-step visual execution replay. Paste code, click **Visualize**, and watch every variable mutation, pointer move, recursion call, and data-structure transformation unfold in real time — entirely in your browser, no backend required.

---

## Demo

| Landing Page | Workspace |
|---|---|
| Hero with example quick-start | 4-panel resizable layout |
| Feature cards | Monaco editor + live trace |
| 8 built-in algorithms | Array / matrix / hashmap / stack visualizations |

---

## Features

- **Browser-native Python execution** — Pyodide runs CPython inside a Web Worker; zero server needed
- **Automatic data-structure detection** — arrays, 2-D matrices, stacks, queues, and hashmaps are detected from variable names and values and rendered with animated SVGs
- **Pointer tracking** — variables named `left`, `right`, `i`, `j`, `lo`, `hi`, etc. automatically appear as arrows over arrays
- **Semantic step explanations** — every step gets a plain-English caption (`"Pointer left moved from 0 to 1."`, `"Swapped indices 2 and 3 in nums."`)
- **Resizable 4-panel workspace** — editor, visualizer, variables/call-stack/output panels, and a timeline scrubber
- **Playback controls** — play, pause, step forward/back, jump to start/end, 4 speed levels (0.5×–4×)
- **Keyboard shortcuts** — `Space` = play/pause, `←` / `→` = step, `Home` / `End` = jump
- **Shareable links** — lz-string URL compression lets you share a full replay in a single link
- **8 built-in examples** — Two Sum, Binary Search, Valid Parentheses, Merge Sort, Climbing Stairs, Sliding Window Maximum, Bubble Sort, Fibonacci
- **Sandbox validation** — forbidden imports (`os`, `subprocess`, `socket`, etc.) and dangerous builtins (`exec`, `eval`, `open`) are blocked before execution

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | React 19, Tailwind CSS v4, Framer Motion |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Python runtime | Pyodide v0.27 (via Web Worker Blob URL) |
| State | Zustand v5 |
| Layout | react-resizable-panels |
| Icons | lucide-react |
| Primitives | Radix UI + class-variance-authority |
| Sharing | lz-string URL compression |
| Testing | Jest 30 + Testing Library + ts-jest |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── workspace/page.tsx    # Main editor + visualizer
│   ├── share/page.tsx        # Shared replay viewer
│   ├── layout.tsx            # Root layout (dark mode, TooltipProvider)
│   └── globals.css           # HSL CSS custom properties + dark theme
├── components/
│   ├── editor/               # CodeEditor (Monaco), TestCaseInput
│   ├── layout/               # Header, WorkspaceLayout (4-panel)
│   ├── panels/               # Variables, CallStack, Output, SidePanels
│   ├── player/               # PlaybackControls, TimelinePlayer
│   ├── ui/                   # Button, Tabs, Tooltip (shadcn/ui pattern)
│   └── visualizer/           # ArrayViz, MatrixViz, StackQueueViz, HashMapViz, VisualizerCanvas
├── hooks/
│   ├── usePyodide.ts         # Pyodide Web Worker lifecycle + execution
│   └── usePlayback.ts        # Auto-advance + keyboard shortcuts
└── lib/
    ├── engine/
    │   └── sandbox.ts        # Python validator, tracer, executor constants + JS safety check
    ├── examples/problems.ts  # 8 built-in example problems
    ├── share/compress.ts     # lz-string compress/decompress + localStorage sessions
    ├── store/
    │   ├── useTraceStore.ts  # Zustand store — trace data, playback state, actions
    │   └── useEditorStore.ts # Zustand store — code and input
    ├── trace/
    │   ├── types.ts          # All TypeScript interfaces
    │   ├── diffEngine.ts     # Variable diff computation between steps
    │   ├── semanticMapper.ts # Raw trace → SemanticStep[] (pointer, DS, call stack detection)
    │   └── explanationGenerator.ts  # SemanticTag[] → plain-English sentences
    └── utils.ts              # cn() helper (tailwind-merge + clsx)
```

---

## Running Locally

### Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm 9+** (comes with Node)
- A modern browser (Chrome 90+, Firefox 90+, Edge 90+, Safari 15.2+)

> The app uses `SharedArrayBuffer` for Pyodide. Your browser needs `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers, which the dev server sets automatically.

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/aayushakumar/AlgoLens.git
cd AlgoLens

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

On first load, clicking **Visualize** triggers a one-time ~7 MB Pyodide download (cached by the browser after that). You'll see a loading indicator in the header while it initialises.

### Available Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start dev server at `localhost:3000` (Turbopack, HMR) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build locally |
| `npm test` | Run all 94 Jest tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Jest with coverage report |
| `npm run lint` | ESLint |

### Running Tests

```bash
npm test
```

Expected output:
```
Test Suites: 7 passed, 7 total
Tests:       94 passed, 94 total
```

The test suites cover:
- `diffEngine` — variable diff computation and Python repr parsing
- `semanticMapper` — trace enrichment, DS detection, pointer detection, call stack building
- `explanationGenerator` — all 16 tag types and fallback messages
- `sandbox` — code safety validation (allowed/blocked imports and builtins)
- `shareCompress` — lz-string round-trip
- `traceStore` — Zustand store actions and state transitions
- `examples` — data integrity of all built-in problems

---

## Deploying Online

### Option A — Vercel (recommended, one-click)

Vercel is the fastest path. The project is pre-configured for it.

1. Push the repo to GitHub (if not already there)
2. Go to [vercel.com](https://vercel.com) and click **Add New Project**
3. Import the `AlgoLens` repository
4. Leave all settings as defaults — Vercel auto-detects Next.js
5. Click **Deploy**

Your app will be live at `https://algolens.vercel.app` (or a custom domain).

**Important:** The COOP/COEP headers required for Pyodide are already configured in [`next.config.ts`](next.config.ts). Vercel respects these automatically.

> No environment variables are required for the base app. Everything runs client-side.

---

### Option B — Railway

Railway works well if you want a persistent server or plan to add a backend later.

1. Create a free account at [railway.app](https://railway.app)
2. Click **New Project → Deploy from GitHub repo** and select AlgoLens
3. Railway detects Next.js automatically
4. Set the **Start command** to `npm run start` and **Build command** to `npm run build`
5. Click **Deploy**

Railway will give you a public URL like `https://algolens.up.railway.app`.

---

### Option C — Self-hosted (VPS / Docker)

```bash
# Build the production bundle
npm run build

# Start the server
npm run start
# Listens on port 3000 by default

# Or use a custom port
PORT=8080 npm run start
```

For Nginx reverse proxy, make sure to forward the COOP/COEP headers:

```nginx
location / {
    proxy_pass http://localhost:3000;
    add_header Cross-Origin-Opener-Policy "same-origin";
    add_header Cross-Origin-Embedder-Policy "require-corp";
}
```

---

### Option D — Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t algolens .
docker run -p 3000:3000 algolens
```

> To use the standalone output, add `output: "standalone"` to `next.config.ts`.

---

## How It Works

```
User pastes Python code
        │
        ▼
validateCodeSafety()       ← blocks os, subprocess, exec, eval, etc.
        │
        ▼
Pyodide Web Worker         ← loads CPython in browser via WebAssembly
        │
        ├─ SANDBOX_VALIDATOR_PY  ← AST-based import/builtin check
        ├─ TRACER_PY             ← sys.settrace captures every line/call/return
        └─ EXECUTOR_PY           ← wraps user function, parses input, runs it
        │
        ▼
TraceStep[]                ← raw steps: {lineNo, locals, eventType, ...}
        │
        ▼
mapTraceToSemantic()       ← the "product moat"
        │
        ├─ computeDiffs()         → VariableDiff[] (added/changed/removed)
        ├─ generateTags()         → SemanticTag[] (pointer_move, swap, list_append, ...)
        ├─ detectDataStructures() → DataStructureState[] (array/matrix/stack/hashmap)
        ├─ detectPointers()       → PointerState[] (left, right, i, j → index positions)
        ├─ buildCallStack()       → CallFrame[]
        └─ generateExplanation()  → plain-English string
        │
        ▼
SemanticStep[]             ← stored in Zustand
        │
        ▼
React components render each step with Framer Motion animations
```

---

## Sandbox Security

All Python execution is:
- **Client-side only** — runs inside a browser Web Worker, never touches a server
- **Pre-validated** with a JavaScript regex check before being sent to Pyodide
- **AST-validated** inside Pyodide using Python's `ast` module before `exec`
- **Restricted builtins** — `open`, `exec`, `eval`, `compile`, `__import__`, `input`, `breakpoint` are removed from the execution namespace
- **Restricted imports** — only `math`, `collections`, `bisect`, `heapq`, `itertools`, `functools`, `string`, `re`, `copy`, `typing`, `operator`, `decimal`, `fractions`, `random`, `json`, `dataclasses`, `enum`, `abc` are allowed
- **Step-limited** — execution halts after 10,000 trace steps to prevent infinite loops
- **Recursion-limited** — `sys.setrecursionlimit(300)` is applied

Because execution is browser-sandboxed, there is no risk of server-side code execution or data exfiltration.

---

## License

[MIT](LICENSE)
