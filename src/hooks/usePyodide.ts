"use client";

import { useCallback, useRef } from "react";
import { useTraceStore } from "@/lib/store/useTraceStore";
import { validateCodeSafety } from "@/lib/engine/sandbox";
import { mapTraceToSemantic } from "@/lib/trace/semanticMapper";
import type { ExecutionResult } from "@/lib/trace/types";

/**
 * Hook to manage Pyodide Web Worker lifecycle and code execution.
 */
export function usePyodide() {
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(false);

  const {
    setTrace,
    setSemanticSteps,
    setIsExecuting,
    setIsPyodideLoading,
    play,
  } = useTraceStore();

  const getWorker = useCallback((): Promise<Worker> => {
    return new Promise((resolve, reject) => {
      if (workerRef.current && readyRef.current) {
        resolve(workerRef.current);
        return;
      }

      setIsPyodideLoading(true);

      // Create worker from blob URL for Next.js compatibility
      const workerCode = `
        importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js");

        let pyodide = null;

        async function initPyodide() {
          if (pyodide) return pyodide;
          pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/",
          });
          return pyodide;
        }

        self.onmessage = async (event) => {
          const { type, code, input, id, tracerCode, executorCode, validatorCode } = event.data;

          if (type === "init") {
            try {
              self.postMessage({ type: "status", status: "loading" });
              await initPyodide();
              self.postMessage({ type: "status", status: "ready" });
            } catch(err) {
              self.postMessage({ type: "error", error: String(err) });
            }
            return;
          }

          if (type === "execute") {
            try {
              const py = await initPyodide();

              // Set up tracer and executor
              await py.runPythonAsync(tracerCode);
              await py.runPythonAsync(validatorCode);

              // Validate
              const valResult = await py.runPythonAsync(
                'import json; json.dumps({"valid": validate_code(' + JSON.stringify(code) + ')[0], "error": validate_code(' + JSON.stringify(code) + ')[1]})'
              );
              const validation = JSON.parse(String(valResult));
              if (!validation.valid) {
                self.postMessage({ type: "result", id, success: false, error: validation.error, trace: [], output: "" });
                return;
              }

              await py.runPythonAsync(executorCode);

              const resultJson = await py.runPythonAsync(
                'execute_user_code(' + JSON.stringify(code) + ', ' + JSON.stringify(input) + ')'
              );
              const result = JSON.parse(String(resultJson));

              self.postMessage({
                type: "result", id,
                success: !result.error,
                trace: result.trace || [],
                output: result.stdout || "",
                returnValue: result.returnValue,
                error: result.error,
              });
            } catch(err) {
              self.postMessage({ type: "result", id, success: false, error: String(err), trace: [], output: "" });
            }
          }
        };
      `;

      const blob = new Blob([workerCode], { type: "application/javascript" });
      const worker = new Worker(URL.createObjectURL(blob));
      workerRef.current = worker;

      worker.onmessage = (event) => {
        if (event.data.type === "status" && event.data.status === "ready") {
          readyRef.current = true;
          setIsPyodideLoading(false);
          resolve(worker);
        }
        if (event.data.type === "error") {
          setIsPyodideLoading(false);
          reject(new Error(event.data.error));
        }
      };

      worker.postMessage({ type: "init" });
    });
  }, [setIsPyodideLoading]);

  const execute = useCallback(
    async (code: string, input: string): Promise<ExecutionResult> => {
      // Client-side validation first
      const safety = validateCodeSafety(code);
      if (!safety.valid) {
        return {
          success: false,
          trace: [],
          output: "",
          error: safety.error,
        };
      }

      setIsExecuting(true);

      try {
        const worker = await getWorker();

        return new Promise<ExecutionResult>((resolve) => {
          const execId = Date.now().toString();

          // 10-second timeout
          timeoutRef.current = setTimeout(() => {
            // Terminate and recreate worker
            worker.terminate();
            workerRef.current = null;
            readyRef.current = false;
            setIsExecuting(false);
            resolve({
              success: false,
              trace: [],
              output: "",
              error: "Execution timed out (10s). Check for infinite loops.",
            });
          }, 10000);

          const handler = (event: MessageEvent) => {
            if (event.data.type === "result" && event.data.id === execId) {
              worker.removeEventListener("message", handler);
              if (timeoutRef.current) clearTimeout(timeoutRef.current);

              const result: ExecutionResult = {
                success: event.data.success,
                trace: event.data.trace,
                output: event.data.output,
                returnValue: event.data.returnValue,
                error: event.data.error,
              };

              // Store trace and compute semantic steps
              setTrace(
                result.trace,
                result.output,
                result.returnValue,
                result.error
              );

              if (result.trace.length > 0) {
                const semantic = mapTraceToSemantic(result.trace);
                setSemanticSteps(semantic);
                // Auto-play so users don't have to press Play manually
                play();
              }

              setIsExecuting(false);
              resolve(result);
            }
          };

          worker.addEventListener("message", handler);

          // Inline the Python code for the worker
          worker.postMessage({
            type: "execute",
            id: execId,
            code,
            input,
            tracerCode: TRACER_CODE,
            executorCode: EXECUTOR_CODE,
            validatorCode: VALIDATOR_CODE,
          });
        });
      } catch (err) {
        setIsExecuting(false);
        return {
          success: false,
          trace: [],
          output: "",
          error: String(err),
        };
      }
    },
    [getWorker, setTrace, setSemanticSteps, setIsExecuting]
  );

  return { execute };
}

// Python code constants (embedded in the hook file for the worker to use)
const VALIDATOR_CODE = `
import ast

FORBIDDEN_IMPORTS = {
    'os', 'subprocess', 'socket', 'requests', 'shutil', 'pathlib',
    'ctypes', 'signal', 'multiprocessing', 'threading',
    'http', 'urllib', 'ftplib', 'smtplib', 'telnetlib',
    'webbrowser', 'antigravity', 'turtle', 'tkinter',
    'pickle', 'shelve', 'marshal', 'code', 'codeop',
    'compileall', 'py_compile', 'zipimport', 'importlib',
}

ALLOWED_IMPORTS = {
    'math', 'collections', 'bisect', 'heapq', 'itertools',
    'functools', 'string', 're', 'copy', 'typing', 'operator',
    'decimal', 'fractions', 'random', 'json', 'dataclasses',
    'enum', 'abc',
}

FORBIDDEN_BUILTINS = {
    'open', 'exec', 'eval', 'compile', '__import__', 'input',
    'breakpoint', 'exit', 'quit', 'help', 'memoryview',
}

def validate_code(code):
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"Syntax error: {e.msg} (line {e.lineno})"
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                module = alias.name.split('.')[0]
                if module in FORBIDDEN_IMPORTS:
                    return False, f"Forbidden import: '{alias.name}'"
                if module not in ALLOWED_IMPORTS and module != 'sys':
                    return False, f"Unsupported import: '{alias.name}'"
        if isinstance(node, ast.ImportFrom):
            if node.module:
                module = node.module.split('.')[0]
                if module in FORBIDDEN_IMPORTS:
                    return False, f"Forbidden import: 'from {node.module}'"
                if module not in ALLOWED_IMPORTS and module != 'sys':
                    return False, f"Unsupported import: 'from {node.module}'"
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_BUILTINS:
                return False, f"Forbidden call: '{node.func.id}()'"
    return True, ''
`;

const TRACER_CODE = `
import sys
import io

MAX_STEPS = 10000
MAX_REPR_LEN = 200
MAX_VARS = 50

class AlgoLensTracer:
    def __init__(self):
        self.trace = []
        self.step_count = 0
        self.stdout_capture = io.StringIO()
        self.user_code_file = '<user_code>'
        self.base_depth = 0
        self._active = True

    def safe_repr(self, obj):
        try:
            r = repr(obj)
            if len(r) > MAX_REPR_LEN:
                return r[:MAX_REPR_LEN] + '...'
            return r
        except Exception:
            return '<error>'

    def capture_locals(self, frame):
        result = {}
        count = 0
        for name, val in frame.f_locals.items():
            if name.startswith('_') or name == 'self':
                continue
            if count >= MAX_VARS:
                break
            result[name] = self.safe_repr(val)
            count += 1
        return result

    def trace_callback(self, frame, event, arg):
        if not self._active:
            return None
        filename = frame.f_code.co_filename
        if filename != self.user_code_file and not filename.startswith('<'):
            return self.trace_callback
        if self.step_count >= MAX_STEPS:
            self._active = False
            return None
        if event in ('line', 'call', 'return', 'exception'):
            self.step_count += 1
            depth = 0
            f = frame
            while f is not None:
                depth += 1
                f = f.f_back
            step = {
                'stepId': self.step_count,
                'eventType': event,
                'lineNo': frame.f_lineno,
                'funcName': frame.f_code.co_name,
                'frameId': str(id(frame)),
                'callStackDepth': max(0, depth - self.base_depth),
                'locals': self.capture_locals(frame),
                'stdout': self.stdout_capture.getvalue(),
            }
            if event == 'return':
                step['returnValue'] = self.safe_repr(arg)
            if event == 'exception':
                exc_type, exc_value, _ = arg
                step['error'] = f"{exc_type.__name__}: {exc_value}"
            self.trace.append(step)
        return self.trace_callback

    def get_results(self):
        return {
            'trace': self.trace,
            'stdout': self.stdout_capture.getvalue(),
        }
`;

const EXECUTOR_CODE = `
def execute_user_code(code, input_str):
    import sys
    import io
    import json
    import builtins as _builtins_module
    import traceback as _tb

    tracer = AlgoLensTracer()
    args = _parse_input(input_str)

    try:
        compiled = compile(code, '<user_code>', 'exec')
    except SyntaxError as e:
        return json.dumps({'trace': [], 'stdout': '', 'returnValue': None, 'error': f"SyntaxError: {e.msg} (line {e.lineno})"})

    safe_builtins = dict(_builtins_module.__dict__)
    for name in ['open', 'exec', 'eval', 'compile', 'input', 'breakpoint', 'exit', 'quit', 'help', 'memoryview']:
        safe_builtins.pop(name, None)

    real_import = _builtins_module.__import__
    ALLOWED = {'math', 'collections', 'bisect', 'heapq', 'itertools', 'functools', 'string', 're', 'copy', 'typing', 'operator', 'decimal', 'fractions', 'random', 'json', 'dataclasses', 'enum', 'abc'}

    def safe_import(name, *a, **kw):
        base = name.split('.')[0]
        if base not in ALLOWED:
            raise ImportError(f"Import of '{name}' is not allowed")
        return real_import(name, *a, **kw)

    safe_builtins['__import__'] = safe_import
    namespace = {'__builtins__': safe_builtins}

    old_stdout = sys.stdout
    sys.stdout = tracer.stdout_capture
    old_limit = sys.getrecursionlimit()
    sys.setrecursionlimit(300)
    tracer.base_depth = len(_tb.extract_stack()) + 2

    return_value = None
    error = None

    try:
        sys.settrace(tracer.trace_callback)
        exec(compiled, namespace)
        sys.settrace(None)

        func = None
        for name, val in namespace.items():
            if name.startswith('_'):
                continue
            if callable(val) and not isinstance(val, type):
                func = val
                break
            if isinstance(val, type):
                instance = val()
                for method_name in dir(instance):
                    if not method_name.startswith('_'):
                        method = getattr(instance, method_name)
                        if callable(method):
                            func = method
                            break
                if func:
                    break

        if func is not None and args is not None:
            sys.settrace(tracer.trace_callback)
            try:
                return_value = func(*args)
            except Exception as e:
                error = f"{type(e).__name__}: {e}"
            finally:
                sys.settrace(None)
        elif func is not None:
            sys.settrace(tracer.trace_callback)
            try:
                return_value = func()
            except Exception as e:
                error = f"{type(e).__name__}: {e}"
            finally:
                sys.settrace(None)
    except Exception as e:
        error = f"{type(e).__name__}: {e}"
        sys.settrace(None)
    finally:
        sys.stdout = old_stdout
        sys.setrecursionlimit(old_limit)

    results = tracer.get_results()
    results['returnValue'] = repr(return_value) if return_value is not None else None
    results['error'] = error
    return json.dumps(results)

def _parse_input(input_str):
    if not input_str or not input_str.strip():
        return None
    import json as _json
    args = []
    for line in input_str.strip().split('\\n'):
        line = line.strip()
        if not line:
            continue
        try:
            val = _json.loads(line)
            args.append(val)
        except _json.JSONDecodeError:
            try:
                val = eval(line, {"__builtins__": {}}, {})
                args.append(val)
            except Exception:
                args.append(line)
    return args if args else None
`;
