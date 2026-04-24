import { spawnSync } from "node:child_process";

function run(command, args) {
  try {
    return spawnSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

function findPidsWithLsof(port) {
  const result = run("lsof", ["-tiTCP:" + port, "-sTCP:LISTEN"]);

  if (!result || result.status !== 0) {
    return [];
  }

  return result.stdout
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => /^\d+$/.test(value))
    .map((value) => Number(value));
}

function findPidsWithFuser(port) {
  const result = run("fuser", [port + "/tcp"]);

  if (!result || (result.status !== 0 && result.status !== 1)) {
    return [];
  }

  const output = `${result.stdout}\n${result.stderr}`;

  return output
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => /^\d+$/.test(value))
    .map((value) => Number(value));
}

function unique(values) {
  return Array.from(new Set(values));
}

function findPids(port) {
  const lsofPids = findPidsWithLsof(port);

  if (lsofPids.length > 0) {
    return unique(lsofPids);
  }

  return unique(findPidsWithFuser(port));
}

function killPid(pid) {
  try {
    process.kill(pid, "SIGTERM");
    return true;
  } catch {
    return false;
  }
}

function forceKillPid(pid) {
  try {
    process.kill(pid, "SIGKILL");
    return true;
  } catch {
    return false;
  }
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const portArg = process.argv[2];
const port = Number(portArg || process.env.PORT || 4000);

if (!Number.isInteger(port) || port <= 0) {
  console.error(`[free-port] Invalid port: ${portArg ?? process.env.PORT ?? ""}`);
  process.exit(1);
}

const pids = findPids(port).filter((pid) => pid !== process.pid);

if (pids.length === 0) {
  console.log(`[free-port] Port ${port} is already free`);
  process.exit(0);
}

const killed = pids.filter(killPid);

if (killed.length === 0) {
  console.warn(`[free-port] Found processes on port ${port}, but none could be terminated`);
  process.exit(0);
}

console.log(`[free-port] Sent SIGTERM to PID${killed.length > 1 ? "s" : ""} ${killed.join(", ")} on port ${port}`);

for (let attempt = 0; attempt < 10; attempt += 1) {
  await delay(200);

  if (findPids(port).length === 0) {
    console.log(`[free-port] Port ${port} is now free`);
    process.exit(0);
  }
}

const stubbornPids = findPids(port);

if (stubbornPids.length > 0) {
  const forceKilled = stubbornPids.filter(forceKillPid);

  if (forceKilled.length > 0) {
    console.log(`[free-port] Sent SIGKILL to PID${forceKilled.length > 1 ? "s" : ""} ${forceKilled.join(", ")}`);
  }
}

for (let attempt = 0; attempt < 10; attempt += 1) {
  await delay(100);

  if (findPids(port).length === 0) {
    console.log(`[free-port] Port ${port} is now free`);
    process.exit(0);
  }
}

console.warn(`[free-port] Port ${port} is still busy after cleanup attempts`);
