import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
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

function pickEnv(keys, source) {
  const missing = [];
  const lines = [];

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "undefined") {
      missing.push(key);
      continue;
    }

    lines.push(`${key}=${value}`);
  }

  return { lines, missing };
}

function writeEnvFile(targetPath, keys, source) {
  const { lines, missing } = pickEnv(keys, source);
  const final = [
    "# Auto-generated from .env.unified by scripts/sync-env.mjs",
    ...lines,
    ""
  ].join("\n");

  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, final, "utf8");

  return missing;
}

let unifiedContent = "";

try {
  unifiedContent = readFileSync(unifiedEnvPath, "utf8");
} catch {
  console.error(`Missing unified env file at ${unifiedEnvPath}`);
  console.error("Create it first: cp .env.unified.example .env.unified");
  process.exit(1);
}

const unified = parseEnv(unifiedContent);

const backendKeys = [
  "PORT",
  "MONGODB_URI",
  "CORS_ORIGIN",
  "DEFAULT_API_KEY",
  "JSON_BODY_LIMIT",
  "MAX_ANALYZER_EVENTS",
  "EVENTS_TTL_DAYS"
];

const dashboardKeys = [
  "NEXT_PUBLIC_APP_NAME",
  "METRICFLOW_API_URL",
  "METRICFLOW_API_KEY"
];

const analyzerKeys = [
  "BACKEND_URL",
  "ANALYZER_API_KEY",
  "ANALYZER_LOOKBACK_MINUTES",
  "ANALYZER_POLL_SECONDS",
  "ANALYZER_RUN_ONCE",
  "ANALYZER_REQUEST_TIMEOUT"
];

const backendMissing = writeEnvFile(
  join(rootDir, "services", "backend", ".env"),
  backendKeys,
  unified
);
const dashboardMissing = writeEnvFile(
  join(rootDir, "apps", "dashboard", ".env.local"),
  dashboardKeys,
  unified
);
const analyzerMissing = writeEnvFile(
  join(rootDir, "services", "analyzer", ".env"),
  analyzerKeys,
  unified
);

console.log("Generated env files from unified env:");
console.log("- services/backend/.env");
console.log("- apps/dashboard/.env.local");
console.log("- services/analyzer/.env");

const missing = [...backendMissing, ...dashboardMissing, ...analyzerMissing];

if (missing.length > 0) {
  console.warn("Missing keys in .env.unified:", Array.from(new Set(missing)).join(", "));
}
