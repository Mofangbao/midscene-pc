import { Monitor, Window } from "node-screenshots";
import {
  AbstractMonitor,
  AbstractWindow,
  IPCService,
  PNGBuffer,
} from "../interfaces/pc.service.interface.js";
import {
  mouse as nutMouse,
  keyboard as nutKeyboard,
  clipboard as nutClipboard,
} from "@nut-tree-fork/nut-js";
import { screenshot } from "../screeshot.js";

class LocalMonitor extends AbstractMonitor {
  constructor(protected _monitor: Monitor) {
    super();
  }

  public get name(): string {
    return this._monitor.name;
  }
  public get x(): number {
    return this._monitor.x;
  }
  public get y(): number {
    return this._monitor.y;
  }
  public get width(): number {
    return this._monitor.width;
  }
  public get height(): number {
    return this._monitor.height;
  }
  public get rotation(): number {
    return this._monitor.rotation;
  }
  public get scaleFactor(): number {
    return this._monitor.scaleFactor;
  }
  public get frequency(): number {
    return this._monitor.frequency;
  }
  public get isPrimary(): boolean {
    return this._monitor.isPrimary;
  }
  public async captureImage(): Promise<PNGBuffer> {
    const image = await this._monitor.captureImage();
    return image.toPng();
  }
  public get id(): number {
    return this._monitor.id;
  }
}

class LocalWindow extends AbstractWindow {
  constructor(protected _window: Window) {
    super();
  }

  /** Unique identifier associated with the window. */
  public get id(): number {
    return this._window.id;
  }
  public get appName(): string {
    return this._window.appName;
  }
  public get title(): string {
    return this._window.title;
  }
  public get currentMonitor(): AbstractMonitor {
    return new LocalMonitor(this._window.currentMonitor);
  }
  public get x(): number {
    return this._window.x;
  }
  public get y(): number {
    return this._window.y;
  }
  public get width(): number {
    return this._window.width;
  }
  public get height(): number {
    return this._window.height;
  }

  public async captureImage(): Promise<PNGBuffer> {
    const image = await this._window.captureImage();
    return image.toPng();
  }
}

export const localPCService: IPCService = {
  name: "LocalPCService",
  mouse: nutMouse as any,
  keyboard: nutKeyboard as any,
  clipboard: nutClipboard,
  allMonitors: () =>
    Promise.resolve(Monitor.all().map((monitor) => new LocalMonitor(monitor))),
  allWindows: () =>
    Promise.resolve(Window.all().map((window) => new LocalWindow(window))),
  getMonitorFromPoint: async (point) => {
    const monitor = Monitor.fromPoint(point.x, point.y);
    return monitor ? new LocalMonitor(monitor) : null;
  },
  screenShot: async (saveFileFullPath?: string) => {
    const res = await screenshot(saveFileFullPath);
    if (res) {
      return {
        rect: res.rect,
        monitor: res.monitor ? new LocalMonitor(res.monitor) : null,
      };
    }
    return undefined;
  },
};
