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
  NumPadEqual = 46,
  Divide = 47,
  Multiply = 48,
  Subtract = 49,
  Tab = 50,
  Q = 51,
  W = 52,
  E = 53,
  R = 54,
  T = 55,
  Y = 56,
  U = 57,
  I = 58,
  O = 59,
  P = 60,
  LeftBracket = 61,
  RightBracket = 62,
  Backslash = 63,
  Delete = 64,
  End = 65,
  PageDown = 66,
  NumPad7 = 67,
  NumPad8 = 68,
  NumPad9 = 69,
  Add = 70,
  CapsLock = 71,
  A = 72,
  S = 73,
  D = 74,
  F = 75,
  G = 76,
  H = 77,
  J = 78,
  K = 79,
  L = 80,
  Semicolon = 81,
  Quote = 82,
  Return = 83,
  NumPad4 = 84,
  NumPad5 = 85,
  NumPad6 = 86,
  LeftShift = 87,
  Z = 88,
  X = 89,
  C = 90,
  V = 91,
  B = 92,
  N = 93,
  M = 94,
  Comma = 95,
  Period = 96,
  Slash = 97,
  RightShift = 98,
  Up = 99,
  NumPad1 = 100,
  NumPad2 = 101,
  NumPad3 = 102,
  Enter = 103,
  LeftControl = 104,
  LeftSuper = 105,
  LeftWin = 106,
  LeftCmd = 107,
  LeftAlt = 108,
  LeftMeta = 109,
  RightControl = 110,
  RightSuper = 111,
  RightWin = 112,
  RightAlt = 113,
  RightCmd = 114,
  RightMeta = 115,
  Space = 116,
  Menu = 117,
  Fn = 118,
  Left = 119,
  Down = 120,
  Right = 121,
  NumPad0 = 122,
  Decimal = 123,
  Clear = 124,
  AudioMute = 125,
  AudioVolDown = 126,
  AudioVolUp = 127,
  AudioPlay = 128,
  AudioStop = 129,
  AudioPause = 130,
  AudioPrev = 131,
  AudioNext = 132,
  AudioRewind = 133,
  AudioForward = 134,
  AudioRepeat = 135,
  AudioRandom = 136,
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
