/**
 * AST-based validation for Python code before execution.
 * Runs as Python inside Pyodide to check for forbidden patterns.
 */
export const SANDBOX_VALIDATOR_PY = `
import ast
import sys

FORBIDDEN_IMPORTS = {
    'os', 'subprocess', 'socket', 'requests', 'shutil', 'pathlib',
    'ctypes', 'signal', 'multiprocessing', 'threading',
    'http', 'urllib', 'ftplib', 'smtplib', 'telnetlib',
    'webbrowser', 'antigravity', 'turtle', 'tkinter',
    'pickle', 'shelve', 'marshal', 'code', 'codeop',
    'compileall', 'py_compile', 'zipimport', 'importlib',
}

FORBIDDEN_BUILTINS = {
    'open', 'exec', 'eval', 'compile', '__import__', 'input',
    'breakpoint', 'exit', 'quit', 'help', 'license', 'credits',
    'copyright', 'globals', 'memoryview',
}

ALLOWED_IMPORTS = {
    'math', 'collections', 'bisect', 'heapq', 'itertools',
    'functools', 'string', 're', 'copy', 'typing', 'operator',
    'decimal', 'fractions', 'random', 'json', 'dataclasses',
    'enum', 'abc', 'sortedcontainers',
}

def validate_code(code):
    """Validate code for safety. Returns (True, '') or (False, error_message)."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"Syntax error: {e.msg} (line {e.lineno})"

    for node in ast.walk(tree):
        # Check imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                module = alias.name.split('.')[0]
                if module in FORBIDDEN_IMPORTS:
                    return False, f"Forbidden import: '{alias.name}'. For safety, modules like os, subprocess, socket are not allowed."
                if module not in ALLOWED_IMPORTS and module != 'sys':
                    return False, f"Unsupported import: '{alias.name}'. Allowed: {', '.join(sorted(ALLOWED_IMPORTS))}"

        if isinstance(node, ast.ImportFrom):
            if node.module:
                module = node.module.split('.')[0]
                if module in FORBIDDEN_IMPORTS:
                    return False, f"Forbidden import: 'from {node.module}'. For safety, this module is not allowed."
                if module not in ALLOWED_IMPORTS and module != 'sys':
                    return False, f"Unsupported import: 'from {node.module}'. Allowed: {', '.join(sorted(ALLOWED_IMPORTS))}"

        # Check dangerous calls
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_BUILTINS:
                return False, f"Forbidden function call: '{node.func.id}()'. This function is not allowed for safety."

    return True, ''
`;

/**
 * Python tracer using sys.settrace — captures line-by-line execution.
 */
export const TRACER_PY = `
import sys
import io
import copy
import json

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
        """Safely get repr of an object, truncating if needed."""
        try:
            r = repr(obj)
            if len(r) > MAX_REPR_LEN:
                return r[:MAX_REPR_LEN] + '...'
            return r
        except Exception:
            return '<error>'

    def capture_locals(self, frame):
        """Capture local variables, excluding internal ones."""
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

        # Only trace user code
        filename = frame.f_code.co_filename
        if filename != self.user_code_file and not filename.startswith('<'):
            return self.trace_callback

        if self.step_count >= MAX_STEPS:
            self._active = False
            raise StopIteration("Execution exceeded maximum steps (10000). Possible infinite loop.")

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

/**
 * Python execution wrapper that sets up the sandbox and runs user code.
 */
export const EXECUTOR_PY = `
def execute_user_code(code, input_str):
    """Execute user code with tracing in a sandboxed environment."""
    import sys
    import io
    import json
    import builtins

    # Set up restricted builtins
    safe_builtins = dict(builtins.__dict__)
    for name in ['open', 'exec', 'eval', 'compile', '__import__', 'input',
                  'breakpoint', 'exit', 'quit', 'help', 'memoryview']:
        safe_builtins.pop(name, None)

    # Allow controlled import
    _real_import = builtins.__import__
    ALLOWED = {
        'math', 'collections', 'bisect', 'heapq', 'itertools',
        'functools', 'string', 're', 'copy', 'typing', 'operator',
        'decimal', 'fractions', 'random', 'json', 'dataclasses',
        'enum', 'abc',
    }

    def safe_import(name, *args, **kwargs):
        base = name.split('.')[0]
        if base not in ALLOWED:
            raise ImportError(f"Import of '{name}' is not allowed")
        return _real_import(name, *args, **kwargs)

    safe_builtins['__import__'] = safe_import
    safe_builtins['__builtins__'] = safe_builtins

    # Create tracer
    tracer = AlgoLensTracer()

    # Parse input
    args = parse_input(input_str)

    # Compile user code
    compiled = compile(code, '<user_code>', 'exec')

    # Set up namespace
    namespace = {'__builtins__': safe_builtins}

    # Redirect stdout
    old_stdout = sys.stdout
    sys.stdout = tracer.stdout_capture

    # Set recursion limit
    old_limit = sys.getrecursionlimit()
    sys.setrecursionlimit(300)

    # Calculate base depth for relative call stack depth
    import traceback
    tracer.base_depth = len(traceback.extract_stack()) + 2

    return_value = None
    error = None

    try:
        # Set trace and execute
        sys.settrace(tracer.trace_callback)
        exec(compiled, namespace)
        sys.settrace(None)

        # Find and call the main function
        func = None
        for name, val in namespace.items():
            if callable(val) and not name.startswith('_'):
                if isinstance(val, type):
                    # It is a class — look for methods
                    instance = val()
                    for method_name in dir(instance):
                        if not method_name.startswith('_'):
                            method = getattr(instance, method_name)
                            if callable(method):
                                func = method
                                break
                else:
                    func = val
                break

        if func is not None and args is not None:
            sys.settrace(tracer.trace_callback)
            try:
                return_value = func(*args)
            except StopIteration as e:
                error = str(e)
            finally:
                sys.settrace(None)
        elif func is not None:
            sys.settrace(tracer.trace_callback)
            try:
                return_value = func()
            except StopIteration as e:
                error = str(e)
            finally:
                sys.settrace(None)

    except StopIteration as e:
        error = str(e)
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


def parse_input(input_str):
    """Parse user input string into function arguments."""
    if not input_str or not input_str.strip():
        return None

    import json as _json
    args = []
    lines = input_str.strip().split('\\n')

    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            # Try JSON parse
            val = _json.loads(line)
            args.append(val)
        except _json.JSONDecodeError:
            # Try Python literal
            try:
                val = eval(line, {"__builtins__": {}}, {})
                args.append(val)
            except Exception:
                args.append(line)

    return args if args else None
`;

/**
 * Validate user code for safety before execution.
 * This runs on the main thread (no Pyodide needed).
 */
export function validateCodeSafety(code: string): { valid: boolean; error?: string } {
  // Basic checks before sending to Pyodide
  const forbidden = [
    { pattern: /import\s+os\b/, msg: "Import of 'os' is not allowed" },
    { pattern: /import\s+subprocess/, msg: "Import of 'subprocess' is not allowed" },
    { pattern: /import\s+socket/, msg: "Import of 'socket' is not allowed" },
    { pattern: /import\s+shutil/, msg: "Import of 'shutil' is not allowed" },
    { pattern: /from\s+os\s+import/, msg: "Import from 'os' is not allowed" },
    { pattern: /from\s+subprocess\s+import/, msg: "Import from 'subprocess' is not allowed" },
    { pattern: /__import__\s*\(/, msg: "__import__() is not allowed" },
    { pattern: /\bopen\s*\(/, msg: "open() is not allowed" },
    { pattern: /\bexec\s*\(/, msg: "exec() is not allowed" },
    { pattern: /\beval\s*\(/, msg: "eval() is not allowed" },
  ];

  for (const { pattern, msg } of forbidden) {
    if (pattern.test(code)) {
      return { valid: false, error: msg };
    }
  }

  if (code.trim().length === 0) {
    return { valid: false, error: "Please enter some code to visualize." };
  }

  return { valid: true };
}
