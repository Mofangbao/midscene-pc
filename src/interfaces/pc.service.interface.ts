// 基础类型定义
export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

// 需要以单例实现
export abstract class AbstractMonitor {
  /** Unique identifier associated with the screen. */
  public abstract get id(): number;
  /** Unique identifier associated with the screen. */
  public abstract get name(): string;
  /** The screen x coordinate. */
  public abstract get x(): number;
  /** The screen y coordinate. */
  public abstract get y(): number;
  /** The screen pixel width. */
  public abstract get width(): number;
  /** The screen pixel height. */
  public abstract get height(): number;
  /** Can be 0, 90, 180, 270, represents screen rotation in clock-wise degrees. */
  public abstract get rotation(): number;
  /** Output device's pixel scale factor. */
  public abstract get scaleFactor(): number;
  /** The screen refresh rate. */
  public abstract get frequency(): number;
  /** Whether the screen is the main screen */
  public abstract get isPrimary(): boolean;
  /** Capture image asynchronously */
  public abstract captureImage(): Promise<PNGBuffer>;
}

// 需要以单例实现
export abstract class AbstractWindow {
  /** Unique identifier associated with the window. */
  public abstract get id(): number;
  /** The window app name */
  public abstract get appName(): string;
  /** The window title */
  public abstract get title(): string;
  /** The window current monitor */
  public abstract get currentMonitor(): AbstractMonitor;
  /** The window x coordinate. */
  public abstract get x(): number;
  /** The window y coordinate. */
  public abstract get y(): number;
  /** The window pixel width. */
  public abstract get width(): number;
  /** The window pixel height. */
  public abstract get height(): number;
  /** Capture image asynchronously */
  public abstract captureImage(): Promise<PNGBuffer>;
}

// 图像数据
export type PNGBuffer = Buffer;

// 键盘按键枚举
export enum KeyCode {
  Escape = 0,
  F1 = 1,
  F2 = 2,
  F3 = 3,
  F4 = 4,
  F5 = 5,
  F6 = 6,
  F7 = 7,
  F8 = 8,
  F9 = 9,
  F10 = 10,
  F11 = 11,
  F12 = 12,
  F13 = 13,
  F14 = 14,
  F15 = 15,
  F16 = 16,
  F17 = 17,
  F18 = 18,
  F19 = 19,
  F20 = 20,
  F21 = 21,
  F22 = 22,
  F23 = 23,
  F24 = 24,
  Print = 25,
  ScrollLock = 26,
  Pause = 27,
  Grave = 28,
  Num1 = 29,
  Num2 = 30,
  Num3 = 31,
  Num4 = 32,
  Num5 = 33,
  Num6 = 34,
  Num7 = 35,
  Num8 = 36,
  Num9 = 37,
  Num0 = 38,
  Minus = 39,
  Equal = 40,
  Backspace = 41,
  Insert = 42,
  Home = 43,
  PageUp = 44,
  NumLock = 45,
  Divide = 46,
  Multiply = 47,
  Subtract = 48,
  Tab = 49,
  Q = 50,
  W = 51,
  E = 52,
  R = 53,
  T = 54,
  Y = 55,
  U = 56,
  I = 57,
  O = 58,
  P = 59,
  LeftBracket = 60,
  RightBracket = 61,
  Backslash = 62,
  Delete = 63,
  End = 64,
  PageDown = 65,
  NumPad7 = 66,
  NumPad8 = 67,
  NumPad9 = 68,
  Add = 69,
  CapsLock = 70,
  A = 71,
  S = 72,
  D = 73,
  F = 74,
  G = 75,
  H = 76,
  J = 77,
  K = 78,
  L = 79,
  Semicolon = 80,
  Quote = 81,
  Return = 82,
  NumPad4 = 83,
  NumPad5 = 84,
  NumPad6 = 85,
  LeftShift = 86,
  Z = 87,
  X = 88,
  C = 89,
  V = 90,
  B = 91,
  N = 92,
  M = 93,
  Comma = 94,
  Period = 95,
  Slash = 96,
  RightShift = 97,
  Up = 98,
  NumPad1 = 99,
  NumPad2 = 100,
  NumPad3 = 101,
  Enter = 102,
  LeftControl = 103,
  LeftSuper = 104,
  LeftWin = 105,
  LeftCmd = 106,
  LeftAlt = 107,
  Space = 108,
  RightAlt = 109,
  RightSuper = 110,
  RightWin = 111,
  RightCmd = 112,
  Menu = 113,
  RightControl = 114,
  Fn = 115,
  Left = 116,
  Down = 117,
  Right = 118,
  NumPad0 = 119,
  Decimal = 120,
  Clear = 121,
  AudioMute = 122,
  AudioVolDown = 123,
  AudioVolUp = 124,
  AudioPlay = 125,
  AudioStop = 126,
  AudioPause = 127,
  AudioPrev = 128,
  AudioNext = 129,
  AudioRewind = 130,
  AudioForward = 131,
  AudioRepeat = 132,
  AudioRandom = 133,
}

// 鼠标按钮枚举
export enum MouseButton {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
}

// 鼠标操作服务接口，需要以单例实现
export interface IMouseService {
  /**
   * 设置鼠标位置
   */
  setPosition(point: Point): Promise<IMouseService>;

  /**
   * 获取鼠标位置
   */
  getPosition(): Promise<Point>;

  /**
   * 鼠标点击
   */
  click(button: MouseButton): Promise<IMouseService>;

  /**
   * 鼠标双击
   */
  doubleClick(button: MouseButton): Promise<IMouseService>;

  /**
   * 鼠标按下
   */
  pressButton(button: MouseButton): Promise<IMouseService>;

  /**
   * 鼠标释放
   */
  releaseButton(button: MouseButton): Promise<IMouseService>;

  /**
   * 鼠标移动
   */
  move(points: Point[]): Promise<IMouseService>;

  /**
   * 鼠标滚轮
   */
  scrollLeft(distance: number): Promise<IMouseService>;

  /**
   * 鼠标滚轮向右滚动
   */
  scrollRight(distance: number): Promise<IMouseService>;
  /**
   * 鼠标滚轮向下滚动
   */
  scrollDown(distance: number): Promise<IMouseService>;

  /**
   * 鼠标滚轮向上滚动
   */
  scrollUp(distance: number): Promise<IMouseService>;
}

// 键盘操作服务接口
export interface IKeyboardService {
  /**
   * 按下按键
   */
  pressKey(...keys: KeyCode[]): Promise<IKeyboardService>;

  /**
   * 释放按键
   */
  releaseKey(...keys: KeyCode[]): Promise<IKeyboardService>;

  /**
   * 输入文本
   */
  type(text: string): Promise<IKeyboardService>;
}

// 剪贴板服务接口
export interface IClipboardService {
  /**
   * 设置剪贴板内容
   */
  setContent(content: string): Promise<void>;

  /**
   * 获取剪贴板内容
   */
  getContent(): Promise<string>;
}

// 综合PC服务接口
export interface IPCService {
  /** The name of the PC service */
  name: string;
  mouse: IMouseService;
  keyboard: IKeyboardService;
  clipboard: IClipboardService;
  /** All monitors */
  allMonitors(): Promise<Array<AbstractMonitor>>;
  /** All windows */
  allWindows(): Promise<Array<AbstractWindow>>;
  getMonitorFromPoint(point: Point): Promise<AbstractMonitor | null>;
  screenShot(saveFileFullPath?: string): Promise<
    | {
        rect: Rect;
        monitor: AbstractMonitor | null;
      }
    | undefined
  >;
}
