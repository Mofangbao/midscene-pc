import { type ActionScrollParam, type DeviceAction, getMidsceneLocationSchema, type InterfaceType, LocateResultElement, type Size, z } from "@midscene/core";
import {
    type AbstractInterface,
    ActionDoubleClickParam,
    ActionDragAndDropParam,
    ActionHoverParam,
    ActionInputParam,
    type ActionKeyboardPressParam,
    ActionLongPressParam,
    ActionRightClickParam,
    // type ActionScrollParam,
    ActionSwipeParam,
    type ActionTapParam,
    defineAction,
    defineActionDoubleClick,
    defineActionDragAndDrop,
    defineActionHover,
    defineActionInput,
    defineActionKeyboardPress,
    defineActionLongPress,
    defineActionRightClick,
    defineActionScroll,
    defineActionSwipe,
    defineActionTap,
} from "@midscene/core/device";
import { Jimp, JimpInstance } from "jimp";
import os from "os";
import { AbstractMonitor, AbstractWindow, IPCService, KeyCode, MouseButton, PNGBuffer } from "./interfaces/pc.service.interface.js";
import "./logger.js"; // 导入日志配置
import { straightTo } from "@nut-tree-fork/nut-js";

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export type PCDeviceArea = {
    /**
     * 非手动模式或者手动模式后取消选择时生效。
     * monitorId可以先代码调用一次monitors方法获取所有显示器的信息。
     */
    monitorId?: number;
    /**
     * 第几台显示器，优先级低于monitorId。
     */
    moniterIdx?: number;
    /**
     * The area of the monitor to capture.
     * Priority lower than manual selection.
     * Coordinate relative to the specified monitorId.When no monitorId is specified,
     * the coordinate is relative to the primary monitor.
     * If not specified, the full monitor area will be captured.
     */
    area?: { x: number; y: number; width: number; height: number };
    /**
     * 是否优先让用户手动选择监控区域
     */
    preferManual?: boolean;
};

export interface PCDeviceLaunchOptions {
    /**
     * The area of the screen to capture. Lower priority than windowInfo.
     * If not specified, the full screen area of primary monitor will be captured.
     * If specified as "manual", the user will be prompted to select the screen area.
     */
    screenArea?: PCDeviceArea;
    /**
     * When the window has multiple sub-window,set only for rect to true.
     * Use windows method to get all window info.
     * All conditions are combined using AND logic.
     * Higher priority than screenArea. If specified, the windowInfo will be used to capture the specified window.
     * If none of the specified windowInfo matches, the full screen area of primary monitor will be captured.
     */
    windowInfo?: {
        /**
         * id of the window to capture.
         */
        id?: number;
        /**
         * title of the window to capture.
         */
        title?: string;
        /**
         * app name of the window to capture.
         */
        appName?: string;
        /**
         * only use rect info to capture the window.default true.
         * If the app only has one window,set it to false for performance.
         */
        onlyForRect?: boolean;
        /**
         * Is the window won't move.If true,performance will be improved,but
         * the window must be in the same position as the last time,otherwise the capture will be failed.
         * default true.
         */
        fixedWindow?: boolean;
    };
    /**
     * The full path to save the screenshot when manual mode is enabled.
     * If not specified, the screenshot will not be saved.
     */
    manualScreenshotSaveFullPath?: string;
}

export interface PCDeviceOptions {
    pcService: IPCService;
    launchOptions?: PCDeviceLaunchOptions;
    /**
     * 是否在input之前执行一次点击获取焦点操作，默认false
     */
    clickBeforeInput?: boolean;
}

export type ScreenTargetFinder = () => Promise<{
    rectInGlobal: { x: number; y: number; width: number; height: number };
    rectInMonitor: { x: number; y: number; width: number; height: number };
    scaleFactor: number;
    captureImage: () => Promise<JimpInstance>;
}>;

const actionClearInputParamSchema = z.object({
    locate: getMidsceneLocationSchema().describe("The input field to be cleared"),
});
type ActionClearInputParam = {
    locate: LocateResultElement;
};
interface WindowInfo {
    x: number;
    y: number;
    width: number;
    height: number;
    scaleFactor: number;
    captureImage: () => Promise<PNGBuffer>;
    currentMonitor: AbstractMonitor;
    title: string;
    appName: string;
}

export default class PCDevice implements AbstractInterface {
    /**
     * 各类操作之后，等待操作生效的时间。主要让UI有时间进行响应，需要根据不同的应用特点来设置，默认是100ms
     */
    public static ACTION_TRANSFORM_TIME = 100;
    /**
     * 平台特定配置，表示鼠标滚动一次数量的最大值，默认1000，超过的会自动分批发送
     * 不表示像素数量，是一个相对数值
     */
    public static MOUSE_WHEEL_ONCE_MAX = 1000;
    /**
     * 平台特定配置，表示鼠标滚动一次滚动的像素数量，默认1.8，不同平台可能不同
     */
    public static MOUSE_WHEEL_TO_PIXEL = 1.6;
    private launched = false;
    interfaceType: InterfaceType = "pc";
    private options: PCDeviceOptions;
    private targetFinder: ScreenTargetFinder = undefined as any;
    private outputListeners: Map<string, ((output: string) => void)[]> = new Map();

    constructor(options?: PCDeviceOptions) {
        if (!options?.pcService) {
            throw new Error("pcService in options is required");
        }
        this.options = options;
        if (this.options.launchOptions?.windowInfo) {
            this.options.launchOptions.windowInfo.onlyForRect = this.options.launchOptions?.windowInfo?.onlyForRect ?? true;
            this.options.launchOptions.windowInfo.fixedWindow = this.options.launchOptions?.windowInfo?.fixedWindow ?? true;
        }
    }

    private async getScreenPos(regionPos: number[]) {
        const target = await this.targetFinder();
        return {
            x: regionPos[0] + target.rectInGlobal.x,
            y: regionPos[1] + target.rectInGlobal.y,
        };
    }

    private mapKeyboard(keyName: string): KeyCode | undefined {
        if (keyName in KeyCode) {
            return (KeyCode as any)[keyName] as KeyCode;
        }
        return undefined;
    }

    private async typeText(text: string) {
        const platform = os.platform(); // 'win32' | 'darwin' | 'linux' | ...
        // 安全设置剪贴板
        await this.options.pcService.clipboard.setContent(text);

        switch (platform) {
            case "win32":
                // Windows: Ctrl+V
                await this.pressKey(KeyCode.LeftControl, KeyCode.V);
                break;

            case "darwin":
                // macOS: Command+V
                await this.pressKey(KeyCode.LeftCmd, KeyCode.V);
                break;

            case "linux":
                // Linux 常见两种方式：
                // 1️⃣ 用 nutjs 模拟 Ctrl+V
                await this.pressKey(KeyCode.LeftControl, KeyCode.V);
                break;

            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }

    private async findWindow(): Promise<WindowInfo> {
        const windows = await this.windows();
        const targetWindow = windows.find((w) => {
            const idMatch = !this.options.launchOptions?.windowInfo?.id || w.id === this.options.launchOptions?.windowInfo?.id;
            const titleMatch = !this.options.launchOptions?.windowInfo?.title || w.title.includes(this.options.launchOptions?.windowInfo?.title);
            const appNameMatch = !this.options.launchOptions?.windowInfo?.appName || w.appName.includes(this.options.launchOptions?.windowInfo?.appName);
            return idMatch && titleMatch && appNameMatch;
        });
        if (!targetWindow) {
            return undefined as any;
        }
        return {
            x: Math.max(targetWindow.currentMonitor.x, targetWindow.x),
            y: Math.max(targetWindow.currentMonitor.y, targetWindow.y),
            width: Math.min(targetWindow.width, targetWindow.currentMonitor.width),
            height: Math.min(targetWindow.height, targetWindow.currentMonitor.height),
            scaleFactor: targetWindow.currentMonitor.scaleFactor,
            captureImage: async () => {
                const image = await targetWindow.captureImage();
                return image;
            },
            currentMonitor: targetWindow.currentMonitor,
            title: targetWindow.title,
            appName: targetWindow.appName,
        };
    }

    private async clearInput(pos: { x: number; y: number }, newData?: string) {
        await this.options.pcService.mouse.setPosition({ x: pos.x, y: pos.y });
        await this.options.pcService.mouse.click(MouseButton.LEFT);
        await this.options.pcService.mouse.click(MouseButton.LEFT);
        await this.options.pcService.mouse.click(MouseButton.LEFT);
        await this.typeText(newData ?? "");
    }

    private async mousewheel(direction: "scrollUp" | "scrollDown" | "scrollLeft" | "scrollRight", pixel: number) {
        const distance = pixel * PCDevice.MOUSE_WHEEL_TO_PIXEL;
        if (distance <= PCDevice.MOUSE_WHEEL_ONCE_MAX) {
            await this.options.pcService.mouse[direction](distance);
            return;
        } else {
            let passDistance = 0;
            while (passDistance < Math.abs(distance)) {
                passDistance += PCDevice.MOUSE_WHEEL_ONCE_MAX;
                await this.options.pcService.mouse[direction](Math.min(PCDevice.MOUSE_WHEEL_ONCE_MAX, Math.abs(distance) - passDistance));
                await sleep(50);
            }
        }
    }

    private async pressKey(...keys: KeyCode[]) {
        await this.options.pcService.keyboard.pressKey(...keys);
        await this.options.pcService.keyboard.releaseKey(...keys);
    }

    public hasLaunched(): boolean {
        return this.launched;
    }

    // this is not required by AbstractInterface
    public async launch(): Promise<void> {
        if (this.launched) {
            console.warn("PCDevice already launched, skip");
            return;
        }
        console.log("launching pc device");
        this.launched = true;
        if (this.options.launchOptions?.windowInfo?.appName || this.options.launchOptions?.windowInfo?.title || this.options.launchOptions?.windowInfo?.id) {
            // try use window info
            const targetWindow = await this.findWindow();
            if (targetWindow) {
                const generateTargetInfo = (currentTargetWindow: WindowInfo): ReturnType<ScreenTargetFinder> => {
                    return Promise.resolve({
                        rectInGlobal: {
                            x: currentTargetWindow.x,
                            y: currentTargetWindow.y,
                            width: currentTargetWindow.width,
                            height: currentTargetWindow.height,
                        },
                        rectInMonitor: {
                            x: currentTargetWindow.x - currentTargetWindow.currentMonitor.x,
                            y: currentTargetWindow.y - currentTargetWindow.currentMonitor.y,
                            width: currentTargetWindow.currentMonitor.width,
                            height: currentTargetWindow.currentMonitor.height,
                        },
                        scaleFactor: currentTargetWindow.currentMonitor.scaleFactor,
                        captureImage: async () => {
                            let instance: JimpInstance;
                            if (this.options.launchOptions?.windowInfo?.onlyForRect === false) {
                                const image = await currentTargetWindow.captureImage();
                                instance = (await Jimp.fromBuffer(image)) as any;
                            } else {
                                const image = await currentTargetWindow.currentMonitor.captureImage();
                                instance = (await Jimp.fromBuffer(image)) as any;
                                instance = (await instance.crop({
                                    x: currentTargetWindow.x - currentTargetWindow.currentMonitor.x,
                                    y: currentTargetWindow.y - currentTargetWindow.currentMonitor.y,
                                    w: currentTargetWindow.width,
                                    h: currentTargetWindow.height,
                                })) as any;
                            }
                            return instance;
                        },
                    });
                };
                if (this.options.launchOptions?.windowInfo?.fixedWindow) {
                    this.targetFinder = async () => generateTargetInfo(targetWindow);
                } else {
                    this.targetFinder = async () => {
                        const currentTargetWindow = await this.findWindow();
                        if (!currentTargetWindow) {
                            throw new Error(
                                `Window:\n ${
                                    this.options.launchOptions?.windowInfo?.appName ??
                                    this.options.launchOptions?.windowInfo?.title ??
                                    this.options.launchOptions?.windowInfo?.id
                                }\n not found`,
                            );
                        }
                        return generateTargetInfo(currentTargetWindow);
                    };
                }
                console.debug(`Window ${targetWindow.title} found, use it as screenshot target`);
                return;
            } else {
                console.warn(`Window:\n ${JSON.stringify(this.options.launchOptions?.windowInfo)}\n not found, try use areainfo instead`);
            }
        } else {
            let targetMonitor: AbstractMonitor = undefined as any;
            let area: { x: number; y: number; width: number; height: number } = this.options.launchOptions?.screenArea?.area as any;
            if (this.options.launchOptions?.screenArea?.preferManual) {
                // prompt user to select the screen area
                const areaInfo = await this.options.pcService.screenShot(this.options.launchOptions?.manualScreenshotSaveFullPath);
                if (areaInfo?.monitor) {
                    targetMonitor = areaInfo.monitor;
                    if (areaInfo.rect) {
                        area = areaInfo.rect;
                    }
                    console.debug(`Screen selected`);
                } else {
                    console.warn("user stop select screen area, use primary monitor instead");
                }
            }
            if (!targetMonitor) {
                const allMonitors = await this.monitors();
                if (!allMonitors.length) {
                    throw new Error("No monitors found");
                }
                const targetMonitorId = this.options.launchOptions?.screenArea?.monitorId;
                if (targetMonitorId) {
                    targetMonitor = allMonitors.find((m) => m.id === targetMonitorId) as any;
                }
                if (!targetMonitor && this.options.launchOptions?.screenArea?.moniterIdx !== undefined) {
                    targetMonitor = allMonitors[Math.min(Math.max(this.options.launchOptions?.screenArea?.moniterIdx ?? 0, 0), allMonitors.length - 1)];
                } else {
                    targetMonitor = allMonitors.find((m) => m.isPrimary) ?? allMonitors[0];
                }
            }
            console.debug(`Monitor x:${targetMonitor.x}, y:${targetMonitor.y}, width:${targetMonitor.width}, height:${targetMonitor.height}`);
            const finalArea = area || {
                x: 0,
                y: 0,
                width: targetMonitor.width,
                height: targetMonitor.height,
            };
            // 转换为全局坐标，方便执行action时进行坐标转换
            const areaToGlobal = {
                ...finalArea,
                x: finalArea.x + targetMonitor.x,
                y: finalArea.y + targetMonitor.y,
            };
            this.targetFinder = async () => {
                return {
                    rectInGlobal: areaToGlobal,
                    rectInMonitor: finalArea,
                    scaleFactor: targetMonitor.scaleFactor,
                    captureImage: async () => {
                        let image = await targetMonitor.captureImage();
                        if (area) {
                            let jimImage = await Jimp.fromBuffer(image);
                            // 这里使用屏幕的坐标来裁剪，而不是全局坐标
                            jimImage = (await jimImage.crop({
                                x: area.x,
                                y: area.y,
                                w: area.width,
                                h: area.height,
                            })) as any;
                            return jimImage;
                        } else {
                            return (await Jimp.fromBuffer(image)) as any;
                        }
                    },
                };
            };
        }
    }

    public async click(element: LocateResultElement) {
        if (element?.center) {
            const screenPos = await this.getScreenPos(element.center);
            await this.options.pcService.mouse.setPosition(screenPos);
            await this.options.pcService.mouse.click(MouseButton.LEFT);
            await sleep(PCDevice.ACTION_TRANSFORM_TIME);
        } else {
            console.warn(`Element ${element} not found, skip tap`);
        }
    }

    /**
     * 设备支持的操作空间
     */
    public actionSpace(): DeviceAction<any>[] {
        return [
            defineActionTap(async (param: ActionTapParam) => {
                const element = param.locate;
                await this.click(element);
            }),
            defineActionKeyboardPress(async (param: ActionKeyboardPressParam) => {
                const key = param.keyName;
                // 测试是否先执行了点击操作获得焦点
                const element = param.locate;
                if (element?.center) {
                    const screenPos = await this.getScreenPos(element.center);
                    await this.options.pcService.mouse.setPosition(screenPos);
                    await this.options.pcService.mouse.click(MouseButton.LEFT);
                    await sleep(PCDevice.ACTION_TRANSFORM_TIME);
                }
                if (key.indexOf("+") > 0) {
                    const keys = key.split("+").map((k) => this.mapKeyboard(k));
                    if (keys.includes(undefined)) {
                        throw new Error(`Key ${key} not found`);
                    }
                    await this.pressKey(...(keys as any));
                } else {
                    const nutKey = this.mapKeyboard(key);
                    if (!nutKey) {
                        throw new Error(`Key ${key} not found`);
                    }
                    await this.pressKey(nutKey);
                }
                await sleep(PCDevice.ACTION_TRANSFORM_TIME);
            }),
            defineActionDoubleClick(async (param: ActionDoubleClickParam) => {
                const element = param.locate;
                const screenPos = await this.getScreenPos(element.center);
                await this.options.pcService.mouse.setPosition(screenPos);
                await this.options.pcService.mouse.doubleClick(MouseButton.LEFT);
                await sleep(PCDevice.ACTION_TRANSFORM_TIME);
            }),
            defineActionDragAndDrop(async (param: ActionDragAndDropParam) => {
                const element = param.from;
                const screenPos = await this.getScreenPos(element.center);
                await this.options.pcService.mouse.setPosition(screenPos);
                await this.options.pcService.mouse.pressButton(MouseButton.LEFT);
                const targetPos = await this.getScreenPos(param.to.center);
                await this.options.pcService.mouse.move(await straightTo(targetPos));
                await this.options.pcService.mouse.releaseButton(MouseButton.LEFT);
                await sleep(PCDevice.ACTION_TRANSFORM_TIME);
            }),
            defineActionHover(async (param: ActionHoverParam) => {
                const element = param.locate;
                const screenPos = await this.getScreenPos(element.center);
                await this.options.pcService.mouse.setPosition(screenPos);
                await sleep(2000);
            }),
            defineActionInput(async (param: ActionInputParam) => {
                const element = param.locate;
                if (!element?.center) {
                    console.error(`Element ${element} not found`);
                    await this.typeText(param.value);
                } else {
                    const screenPos = await this.getScreenPos(element.center);
                    if (param.mode === "clear") {
                        await this.clearInput(screenPos);
                    } else if (param.mode === "replace") {
                        await this.clearInput(screenPos, param.value);
                    } else {
                        await this.options.pcService.mouse.setPosition(screenPos);
                        if (this.options.clickBeforeInput) {
                            await this.options.pcService.mouse.click(MouseButton.LEFT);
                            await sleep(PCDevice.ACTION_TRANSFORM_TIME);
                        }
                        await this.typeText(param.value);
                    }
                }
                await sleep(PCDevice.ACTION_TRANSFORM_TIME);
            }),
            defineActionLongPress(async (param: ActionLongPressParam) => {
                const element = param.locate;
                if (element?.center) {
                    const screenPos = await this.getScreenPos(element.center);
                    await this.options.pcService.mouse.setPosition(screenPos);
                    await this.options.pcService.mouse.pressButton(MouseButton.LEFT);
                    await sleep(param.duration ?? 2000);
                    await this.options.pcService.mouse.releaseButton(MouseButton.LEFT);
                } else {
                    console.warn(`Element ${element} not found, skip long press`);
                }
            }),
            defineActionRightClick(async (param: ActionRightClickParam) => {
                const element = param.locate;
                if (element?.center) {
                    const screenPos = await this.getScreenPos(element.center);
                    await this.options.pcService.mouse.setPosition(screenPos);
                    await this.options.pcService.mouse.click(MouseButton.RIGHT);
                } else {
                    console.warn(`Element ${element} not found, skip right click`);
                }
            }),
            defineActionScroll(async (param: ActionScrollParam) => {
                const element = param.locate;
                if (element?.center) {
                    const screenPos = await this.getScreenPos(element.center);
                    await this.options.pcService.mouse.setPosition(screenPos);
                    await sleep(PCDevice.ACTION_TRANSFORM_TIME);
                }
                if (param.scrollType && param.scrollType !== "once") {
                    switch (param.scrollType) {
                        case "untilBottom":
                            await this.pressKey(KeyCode.LeftControl, KeyCode.End);
                            break;
                        case "untilTop":
                            await this.pressKey(KeyCode.LeftControl, KeyCode.Home);
                            break;
                        case "untilLeft":
                            // work around
                            await this.mousewheel("scrollLeft", 20000);
                            break;
                        case "untilRight":
                            // work around
                            await this.mousewheel("scrollRight", 20000);
                            break;
                    }
                } else {
                    switch (param.direction) {
                        case "left":
                            await this.mousewheel("scrollLeft", param.distance ?? 500);
                            break;
                        case "right":
                            await this.mousewheel("scrollRight", param.distance ?? 500);
                            break;
                        case "down":
                            await this.mousewheel("scrollDown", param.distance ?? 500);
                            break;
                        case "up":
                            await this.mousewheel("scrollUp", param.distance ?? 500);
                            break;
                    }
                }
            }),
            defineActionSwipe(async (param: ActionSwipeParam) => {
                const element = param.start;
                if (element?.center && param.end?.center) {
                    const screenPos = await this.getScreenPos(element.center);
                    await this.options.pcService.mouse.setPosition(screenPos);
                    switch (param.direction) {
                        case "left":
                            await this.options.pcService.mouse.scrollLeft(param.end.center[0] - element.center[0]);
                            break;
                        case "right":
                            await this.options.pcService.mouse.scrollRight(param.end.center[0] - element.center[0]);
                            break;
                        case "down":
                            await this.options.pcService.mouse.scrollDown(param.end.center[1] - element.center[1]);
                            break;
                        case "up":
                            await this.options.pcService.mouse.scrollUp(param.end.center[1] - element.center[1]);
                            break;
                    }
                } else {
                    console.warn(`postion ${param.start?.center ? "start not found" : ""} ${param.end?.center ? "end not found" : ""}, skip swipe`);
                }
            }),
            defineAction<typeof actionClearInputParamSchema, ActionClearInputParam>({
                name: "ClearInput",
                description: "Clear the text content of an input field",
                interfaceAlias: "aiClearInput",
                paramSchema: actionClearInputParamSchema,
                call: async (param: ActionClearInputParam) => {
                    const element = param.locate;
                    if (element?.center) {
                        const screenPos = await this.getScreenPos(element.center);
                        await this.clearInput(screenPos);
                    } else {
                        console.warn(`Element ${element} not found, skip clear input`);
                    }
                },
            }),
            defineAction({
                name: "OutputFinalAnwser",
                description: "针对用户的提问，输出最后总结整理好的回答内容。仅当用户原始问题需要输出最终答案时采需要调用。",
                interfaceAlias: "aiOutputFinalAnwser",
                paramSchema: z.object({
                    value: z.string().describe("The final answer to output"),
                    uuid: z.string().describe("The unique id of the output listener，如果用户提供了，务必原样输出，否则可以自定义"),
                }),
                call: async (param: { value: string; uuid: string }) => {
                    if (!param.uuid?.length) {
                        console.debug(`Output listener uuid not provided, skip output`);
                        return;
                    }
                    const listeners = this.outputListeners.get(param.uuid);
                    if (!listeners?.length) {
                        console.debug(`Output listener ${param.uuid} not found, skip output`);
                        return;
                    }
                    listeners!.forEach((listener) => listener(param.value));
                },
            }),
        ];
    }

    public listenOutput(id: string, callback: (output: string) => void) {
        if (this.outputListeners.has(id)) {
            this.outputListeners.get(id)!.push(callback);
        } else {
            this.outputListeners.set(id, [callback]);
        }
        return id;
    }

    public removeOutputListener(id: string, callback: (output: string) => void) {
        if (this.outputListeners.has(id)) {
            this.outputListeners.set(
                id,
                this.outputListeners.get(id)!.filter((listener) => listener !== callback),
            );
        }
        if (this.outputListeners.get(id)!.length === 0) {
            this.outputListeners.delete(id);
        }
    }

    /**
     * 设备描述
     */
    public describe(): string {
        return `This is a pc device for Midscene`;
    }

    /**
     * 设备屏幕大小
     */
    public async size(): Promise<Size> {
        const targetInfo = await this.targetFinder();
        return {
            width: targetInfo.rectInGlobal.width,
            height: targetInfo.rectInGlobal.height,
            dpr: targetInfo.scaleFactor,
        };
    }

    /**
     * 设备屏幕截图
     */
    public async screenshotBase64(): Promise<string> {
        const targetInfo = await this.targetFinder();
        let screenshot = await targetInfo.captureImage();
        const base64Image = await screenshot.getBase64("image/png");
        return base64Image;
    }

    /**
     * 设备支持的显示器
     */
    public async monitors(): Promise<AbstractMonitor[]> {
        return await this.options.pcService.allMonitors();
    }

    /**
     * 设备支持的窗口
     */
    public async windows(): Promise<AbstractWindow[]> {
        return await this.options.pcService.allWindows();
    }

    /**
     * 设备销毁
     */
    public async destroy(): Promise<void> {
        this.outputListeners.clear();
        console.log("device destroyed");
    }
}
