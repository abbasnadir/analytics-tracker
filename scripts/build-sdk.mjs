import { spawnSync } from "node:child_process";

const userAgent = process.env.npm_config_user_agent ?? "";
const usesPnpm = userAgent.startsWith("pnpm/");
const command = process.platform === "win32"
  ? usesPnpm ? "pnpm.cmd" : "npm.cmd"
  : usesPnpm ? "pnpm" : "npm";

const args = usesPnpm
  ? ["--filter", "@metricflow/sdk", "build"]
  : ["run", "build", "--workspace", "@metricflow/sdk"];

const result = spawnSync(command, args, {
  stdio: "inherit",
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
