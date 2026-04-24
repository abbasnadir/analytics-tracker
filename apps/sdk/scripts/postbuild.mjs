import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve("dist/index.global.js");
const target = resolve("dist/metricflow.js");

if (!existsSync(source)) {
  throw new Error(`Expected build artifact not found: ${source}`);
}

copyFileSync(source, target);
console.log(`Created drop-in bundle: ${target}`);
