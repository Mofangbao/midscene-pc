import {
  AbstractMonitor,
  AbstractWindow,
  IPCService,
  Point,
  Rect,
} from "../interfaces/pc.service.interface.js";

function normalize(base: string) {
  return base.replace(/\/+$/, "");
}
function url(base: string, path: string) {
  return `${normalize(base)}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function getJSON<T>(endpoint: string, path: string): Promise<T> {
  const res = await fetch(url(endpoint, path), {
    method: "GET",
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

async function postJSON<T>(
  endpoint: string,
  path: string,
  body: any
): Promise<T> {
  const res = await fetch(url(endpoint, path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

async function getPNG(endpoint: string, path: string): Promise<Buffer> {
  const res = await fetch(url(endpoint, path), { method: "GET" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export class RemoteMonitor extends AbstractMonitor {
  constructor(private endpoint: string, private data: any) {
    super();
  }
  public get id(): number {
    return this.data.id;
  }
  public get name(): string {
    return this.data.name;
  }
  public get x(): number {
    return this.data.x;
  }
  public get y(): number {
    return this.data.y;
  }
  public get width(): number {
    return this.data.width;
  }
  public get height(): number {
    return this.data.height;
  }
  public get rotation(): number {
    return this.data.rotation;
  }
  public get scaleFactor(): number {
    return this.data.scaleFactor;
  }
  public get frequency(): number {
    return this.data.frequency;
  }
  public get isPrimary(): boolean {
    return this.data.isPrimary;
  }
  public async captureImage(): Promise<Buffer> {
    return await getPNG(this.endpoint, `/monitors/${this.id}/capture`);
  }
}

export class RemoteWindow extends AbstractWindow {
  constructor(private endpoint: string, private data: any) {
    super();
  }
  /** Unique identifier associated with the window. */
  public get id(): number {
    return this.data.id;
  }
  public get appName(): string {
    return this.data.appName;
  }
  public get title(): string {
    return this.data.title;
  }
  public get currentMonitor(): AbstractMonitor {
    return new RemoteMonitor(this.endpoint, this.data.currentMonitor);
  }
  public get x(): number {
    return this.data.x;
  }
  public get y(): number {
    return this.data.y;
  }
  public get width(): number {
    return this.data.width;
  }
  public get height(): number {
    return this.data.height;
  }

  public async captureImage(): Promise<Buffer> {
    return await getPNG(this.endpoint, `/windows/${this.id}/capture`);
  }
}

export function createRemotePCService(endpoint: string): IPCService {
  const base = normalize(endpoint);
  getJSON(base, "/health").then((res: any) => {
    if (res?.ok) {
      console.log("remote pc service is connected");
    }
  });

  const mouse = {
    async setPosition(point: Point) {
      await postJSON(base, "/mouse/set-position", point);
      return mouse;
    },
    async getPosition() {
      return await getJSON<Point>(base, "/mouse/position");
    },
    async click(button: number) {
      await postJSON(base, "/mouse/click", { button });
      return mouse;
    },
    async doubleClick(button: number) {
      await postJSON(base, "/mouse/double-click", { button });
      return mouse;
    },
    async pressButton(button: number) {
      await postJSON(base, "/mouse/press", { button });
      return mouse;
    },
    async releaseButton(button: number) {
      await postJSON(base, "/mouse/release", { button });
      return mouse;
    },
    async move(points: Point[]) {
      await postJSON(base, "/mouse/move", { points });
      return mouse;
    },
    async scrollLeft(distance: number) {
      await postJSON(base, "/mouse/scroll/left", { distance });
      return mouse;
    },
    async scrollRight(distance: number) {
      await postJSON(base, "/mouse/scroll/right", { distance });
      return mouse;
    },
    async scrollDown(distance: number) {
      await postJSON(base, "/mouse/scroll/down", { distance });
      return mouse;
    },
    async scrollUp(distance: number) {
      await postJSON(base, "/mouse/scroll/up", { distance });
      return mouse;
    },
  } as const as any;

  const keyboard = {
    async pressKey(...keys: number[]) {
      await postJSON(base, "/keyboard/press", { keys });
      return keyboard;
    },
    async releaseKey(...keys: number[]) {
      await postJSON(base, "/keyboard/release", { keys });
      return keyboard;
    },
    async type(text: string) {
      await postJSON(base, "/keyboard/type", { text });
      return keyboard;
    },
  } as const as any;

  const clipboard = {
    async setContent(content: string) {
      await postJSON(base, "/clipboard/set", { content });
    },
    async getContent() {
      const res = await getJSON<{ content: string }>(base, "/clipboard/get");
      return res.content;
    },
  };

  return {
    name: "RemotePCService",
    mouse: mouse as any,
    keyboard: keyboard as any,
    clipboard,
    async allMonitors() {
      const arr = await getJSON<any[]>(base, "/monitors");
      return arr.map((m) => new RemoteMonitor(base, m));
    },
    async allWindows() {
      const arr = await getJSON<any[]>(base, "/windows");
      return arr.map((w) => new RemoteWindow(base, w));
    },
    async getMonitorFromPoint(point: Point) {
      const data = await postJSON<any | null>(base, "/monitor/point", point);
      return data ? new RemoteMonitor(base, data) : null;
    },
    async screenShot(saveFileFullPath?: string) {
      const data = await postJSON<
        { rect: Rect; monitor: any | null } | undefined
      >(base, "/screenshot", { saveFileFullPath });
      if (!data) return undefined;
      const monitor = data.monitor
        ? new RemoteMonitor(base, data.monitor)
        : null;
      return { rect: data.rect, monitor };
    },
  } satisfies IPCService;
}
