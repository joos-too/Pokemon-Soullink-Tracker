import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? (process.env.ComSpec ?? "cmd.exe") : "npm";
const config = readFileSync(
  new URL("../supabase/config.toml", import.meta.url),
  "utf8",
);
const projectId = config.match(/^project_id\s*=\s*"([\w-]+)"/m)?.[1];

if (!projectId) {
  throw new Error("Could not read project_id from supabase/config.toml.");
}

const runProcess = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
  });

const runNpmScript = (script) =>
  runProcess(
    npmCommand,
    isWindows ? ["/d", "/s", "/c", `npm run ${script}`] : ["run", script],
  );

const waitForAuth = async () => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch("http://127.0.0.1:54321/auth/v1/health");
      if (response.ok) return;
    } catch {
      // The gateway or Auth may still be restarting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Local Supabase Auth did not become healthy within 30s.");
};

const stabilizeLocalStack = async () => {
  // Docker Desktop can leave Kong pointing at the replaced Auth container after
  // `supabase db reset`; restarting Kong refreshes its internal DNS entry.
  const gatewayStatus = await runProcess("docker", [
    "restart",
    `supabase_kong_${projectId}`,
  ]);
  if (gatewayStatus !== 0) {
    throw new Error("Could not restart the local Supabase API gateway.");
  }
  await waitForAuth();
};

console.log("Resetting the local Supabase database before browser tests...");
const initialResetStatus = await runNpmScript("supabase:reset");
if (initialResetStatus !== 0) process.exit(initialResetStatus);
await stabilizeLocalStack();

const testStatus = await runNpmScript("test:e2e:run");

console.log("Restoring the local Supabase seed after browser tests...");
const cleanupResetStatus = await runNpmScript("supabase:reset");
if (cleanupResetStatus === 0) await stabilizeLocalStack();

process.exit(testStatus !== 0 ? testStatus : cleanupResetStatus);
