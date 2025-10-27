import type { Server } from "node:http";
import { startServer } from "./server.js";
import "./logger.js"; // 导入日志配置

let server: Server | null = null;
let restarting = false;
let backoffMs = 1000; // restart backoff starts at 1s, doubles up to 30s
let restartTimer: NodeJS.Timeout | null = null;
let hasStarted = false;
export async function startAutoServer(port?: number, host?: string) {
  try {
    hasStarted = true;
    const { server: srv } = await startServer(port, host);
    server = srv;
    backoffMs = 1000; // reset backoff on successful start
    console.log("[bootstrap] server started");
    srv.on("error", (err: any) => {
      console.error("[bootstrap] server error:", err);
      scheduleRestart("server-error");
    });
  } catch (err: any) {
    console.error("[bootstrap] startServer failed:", err);
    scheduleRestart("start-failed");
  }
}

async function stop() {
  if (!server) return;
  console.log("[bootstrap] stopping server...");
  const s = server;
  server = null;
  await new Promise<void>((resolve) => {
    s.close(() => resolve());
  });
}

function scheduleRestart(reason: string) {
  if (!hasStarted) {
    return;  // 没有启动过服务器，不做重启
  }
  if (restarting) {
    console.warn(`[bootstrap] restart already scheduled. reason=${reason}`);
    return;
  }
  restarting = true;
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }
  console.warn(
    `[bootstrap] scheduling restart in ${backoffMs}ms. reason=${reason}`
  );
  restartTimer = setTimeout(async () => {
    try {
      await stop();
    } catch (err) {
      console.error("[bootstrap] error stopping server:", err);
    }
    restarting = false;
    try {
      await startAutoServer();
      backoffMs = Math.min(backoffMs * 2, 30000);
    } catch (err) {
      console.error("[bootstrap] restart failed:", err);
      // try again with backoff
      scheduleRestart("restart-failed");
    }
  }, backoffMs);
}

process.on("uncaughtException", (err) => {
  console.error("[process] uncaughtException:", err);
  scheduleRestart("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("[process] unhandledRejection:", reason);
  scheduleRestart("unhandledRejection");
});

process.on("SIGINT", async () => {
  console.log("[process] SIGINT received. Shutting down...");
  await stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[process] SIGTERM received. Shutting down...");
  await stop();
  process.exit(0);
});
