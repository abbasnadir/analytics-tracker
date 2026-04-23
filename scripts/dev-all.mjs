import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const unifiedEnvPath = process.env.METRICFLOW_UNIFIED_ENV
  ? resolve(process.env.METRICFLOW_UNIFIED_ENV)
  : join(rootDir, ".env.unified");

function parseEnv(content) {
  const vars = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
}

function streamWithPrefix(stream, label) {
  let buffer = "";

  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.length > 0) {
        console.log(`[${label}] ${line}`);
      }
    }
  });

  stream.on("end", () => {
    if (buffer.length > 0) {
      console.log(`[${label}] ${buffer}`);
    }
  });
}

let unifiedContent = "";

try {
  unifiedContent = readFileSync(unifiedEnvPath, "utf8");
} catch {
  console.error(`Missing unified env file at ${unifiedEnvPath}`);
  console.error("Create it first: cp .env.unified.example .env.unified");
  process.exit(1);
}

const unifiedEnv = parseEnv(unifiedContent);
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const analyzerDir = join(rootDir, "services", "analyzer");
const analyzerLocalBin = process.platform === "win32"
  ? join(analyzerDir, ".venv", "Scripts", "metricflow-analyzer.exe")
  : join(analyzerDir, ".venv", "bin", "metricflow-analyzer");

const analyzerCmd = existsSync(analyzerLocalBin) ? analyzerLocalBin : "metricflow-analyzer";

const processSpecs = [
  {
    name: "backend",
    command: npmCmd,
    args: ["run", "dev:backend"],
    cwd: rootDir
  },
  {
    name: "dashboard",
    command: npmCmd,
    args: ["run", "dev:dashboard"],
    cwd: rootDir
  },
  {
    name: "analyzer",
    command: analyzerCmd,
    args: [],
    cwd: analyzerDir
  }
];

const children = [];
let shuttingDown = false;

function stopAll(signal = "SIGTERM") {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

for (const spec of processSpecs) {
  const child = spawn(spec.command, spec.args, {
    cwd: spec.cwd,
    env: { ...process.env, ...unifiedEnv },
    stdio: ["ignore", "pipe", "pipe"]
  });

  children.push(child);

  streamWithPrefix(child.stdout, spec.name);
  streamWithPrefix(child.stderr, spec.name);

  child.on("error", (error) => {
    console.error(`[${spec.name}] failed to start: ${error.message}`);
    stopAll();
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.error(`[${spec.name}] stopped by signal ${signal}`);
    } else {
      console.error(`[${spec.name}] exited with code ${code ?? 0}`);
    }

    stopAll();
    process.exit(code ?? 1);
  });
}

console.log("Started backend, dashboard, and analyzer using .env.unified");

process.on("SIGINT", () => {
  stopAll("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll("SIGTERM");
  process.exit(0);
});
