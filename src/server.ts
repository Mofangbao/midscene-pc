import express from "express";
import type { Request, Response } from "express";
import { localPCService } from "./services/local.pc.service.js";
import {
  AbstractMonitor,
  AbstractWindow,
  IPCService,
  MouseButton,
  Point,
  Rect,
} from "./interfaces/pc.service.interface.js";
import { Server } from "node:http";
import "./logger.js"; // 导入日志配置

function serializeMonitor(m: AbstractMonitor) {
  return {
    id: m.id,
    name: m.name,
    x: m.x,
    y: m.y,
    width: m.width,
    height: m.height,
    rotation: m.rotation,
    scaleFactor: m.scaleFactor,
    frequency: m.frequency,
    isPrimary: m.isPrimary,
  };
}

function serializeWindow(w: AbstractWindow) {
  return {
    id: w.id,
    appName: w.appName,
    title: w.title,
    x: w.x,
    y: w.y,
    width: w.width,
    height: w.height,
    currentMonitor: serializeMonitor(w.currentMonitor),
  };
}

export function createServer(service: IPCService = localPCService): express.Express {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // Health
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Monitors
  app.get("/monitors", async (_req: Request, res: Response) => {
    try {
      const monitors = await service.allMonitors();
      res.json(monitors.map(serializeMonitor));
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.get("/monitors/:id/capture", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const monitors = await service.allMonitors();
      const target = monitors.find((m) => m.id === id);
      if (!target) return res.status(404).json({ error: "Monitor not found" });
      const png = await target.captureImage();
      res.setHeader("Content-Type", "image/png");
      res.send(png);
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/monitor/point", async (req: Request, res: Response) => {
    try {
      const point = req.body as Point;
      const monitor = await service.getMonitorFromPoint(point);
      res.json(monitor ? serializeMonitor(monitor) : null);
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  // Windows
  app.get("/windows", async (_req: Request, res: Response) => {
    try {
      const windows = await service.allWindows();
      res.json(windows.map(serializeWindow));
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.get("/windows/:id/capture", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const windows = await service.allWindows();
      const target = windows.find((w) => w.id === id);
      if (!target) return res.status(404).json({ error: "Window not found" });
      const png = await target.captureImage();
      res.setHeader("Content-Type", "image/png");
      res.send(png);
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  // Mouse
  app.post("/mouse/set-position", async (req: Request, res: Response) => {
    try {
      const point = req.body as Point;
      await service.mouse.setPosition(point);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.get("/mouse/position", async (_req: Request, res: Response) => {
    try {
      const point = await service.mouse.getPosition();
      res.json(point);
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/mouse/click", async (req: Request, res: Response) => {
    try {
      const { button } = req.body as { button: MouseButton };
      await service.mouse.click(button);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/mouse/double-click", async (req: Request, res: Response) => {
    try {
      const { button } = req.body as { button: MouseButton };
      await service.mouse.doubleClick(button);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/mouse/press", async (req: Request, res: Response) => {
    try {
      const { button } = req.body as { button: MouseButton };
      await service.mouse.pressButton(button);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/mouse/release", async (req: Request, res: Response) => {
    try {
      const { button } = req.body as { button: MouseButton };
      await service.mouse.releaseButton(button);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/mouse/move", async (req: Request, res: Response) => {
    try {
      const { points } = req.body as { points: Point[] };
      await service.mouse.move(points);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/mouse/scroll/left", async (req: Request, res: Response) => {
    try {
      const { distance } = req.body as { distance: number };
      await service.mouse.scrollLeft(distance);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/mouse/scroll/right", async (req: Request, res: Response) => {
    try {
      const { distance } = req.body as { distance: number };
      await service.mouse.scrollRight(distance);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/mouse/scroll/up", async (req: Request, res: Response) => {
    try {
      const { distance } = req.body as { distance: number };
      await service.mouse.scrollUp(distance);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/mouse/scroll/down", async (req: Request, res: Response) => {
    try {
      const { distance } = req.body as { distance: number };
      await service.mouse.scrollDown(distance);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  // Keyboard
  app.post("/keyboard/press", async (req: Request, res: Response) => {
    try {
      const { keys } = req.body as { keys: number[] };
      await service.keyboard.pressKey(...keys);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/keyboard/release", async (req: Request, res: Response) => {
    try {
      const { keys } = req.body as { keys: number[] };
      await service.keyboard.releaseKey(...keys);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/keyboard/type", async (req: Request, res: Response) => {
    try {
      const { text } = req.body as { text: string };
      await service.keyboard.type(text);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  // Clipboard
  app.post("/clipboard/set", async (req: Request, res: Response) => {
    try {
      const { content } = req.body as { content: string };
      await service.clipboard.setContent(content);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.get("/clipboard/get", async (_req: Request, res: Response) => {
    try {
      const content = await service.clipboard.getContent();
      res.json({ content });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  // Screenshot
  app.post("/screenshot", async (req: Request, res: Response) => {
    try {
      const { saveFileFullPath } = req.body as { saveFileFullPath?: string };
      const result = await service.screenShot(saveFileFullPath);
      if (!result) return res.status(404).json({ error: "No screenshot" });
      const { rect, monitor } = result;
      res.json({ rect, monitor: monitor ? serializeMonitor(monitor) : null });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  return app;
}

export async function startServer(
  port: number = Number(process.env.PORT) || 3333,
  host: string = process.env.HOST || "0.0.0.0"
): Promise<{ app: express.Express; server: Server }> {
  const app = createServer(localPCService);
  return new Promise((resolve) => {
    const server = app.listen(port, host, () => {
      console.log(`[server] listening on http://${host}:${port}`);
      resolve({ app, server });
    });
  });
}
