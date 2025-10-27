import gui from "gui";
import { Monitor } from "node-screenshots";
import path from "path";
import fs from "fs";
import { Jimp } from "jimp";
import { PNGBuffer, Rect } from "./interfaces/pc.service.interface.js";
import "./logger.js"; // 导入日志配置

function pointInBounds(point: gui.PointF, bounds: gui.RectF) {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

// 控制点大小
const CONTROL_POINT_SIZE = 8;

// 获取控制点位置
function getControlPoints(
  startPoint: { x: number; y: number },
  currentPoint: { x: number; y: number }
) {
  const rect = {
    x: Math.min(startPoint.x, currentPoint.x),
    y: Math.min(startPoint.y, currentPoint.y),
    width: Math.abs(currentPoint.x - startPoint.x),
    height: Math.abs(currentPoint.y - startPoint.y),
  };

  return {
    top: { x: rect.x + rect.width / 2, y: rect.y },
    bottom: { x: rect.x + rect.width / 2, y: rect.y + rect.height },
    left: { x: rect.x, y: rect.y + rect.height / 2 },
    right: { x: rect.x + rect.width, y: rect.y + rect.height / 2 },
  };
}

// 检查点是否在控制点范围内
function getControlPointAt(
  x: number,
  y: number,
  startPoint: { x: number; y: number },
  currentPoint: { x: number; y: number },
  isRectComplete: boolean
): string | null {
  if (!isRectComplete) return null;

  const controlPoints = getControlPoints(startPoint, currentPoint);
  const threshold = CONTROL_POINT_SIZE + 2;

  for (const [name, point] of Object.entries(controlPoints)) {
    if (
      Math.abs(x - point.x) <= threshold &&
      Math.abs(y - point.y) <= threshold
    ) {
      return name;
    }
  }
  return null;
}

// 检查点是否在确认按钮范围内
function isPointInConfirmButton(
  x: number,
  y: number,
  startPoint: { x: number; y: number },
  currentPoint: { x: number; y: number }
): boolean {
  const rect = {
    x: Math.min(startPoint.x, currentPoint.x),
    y: Math.min(startPoint.y, currentPoint.y),
    width: Math.abs(currentPoint.x - startPoint.x),
    height: Math.abs(currentPoint.y - startPoint.y),
  };

  const buttonWidth = 80;
  const buttonHeight = 30;
  const buttonX = rect.x + rect.width / 2 - buttonWidth / 2;
  const buttonY = rect.y + rect.height / 2 - buttonHeight / 2;

  return (
    x >= buttonX &&
    x <= buttonX + buttonWidth &&
    y >= buttonY &&
    y <= buttonY + buttonHeight
  );
}

export async function screenshot(saveFileFullPath?: string): Promise<
  | {
      rect: Rect;
      monitor: Monitor | null;
    }
  | undefined
> {
  try {
    const cursorPoint = gui.screen.getCursorScreenPoint();
    const displays = gui.screen.getAllDisplays();
    let display: gui.Display = null as any;
    for (const d of displays) {
      if (pointInBounds(cursorPoint, d.bounds)) {
        display = d;
        break;
      }
    }
    if (!display) {
      console.log("cursor point not in any display");
      return;
    }
    const monitor = Monitor.fromPoint(cursorPoint.x, cursorPoint.y);
    const screenImage = await monitor?.captureImage();
    if (!screenImage) {
      console.log("capture image failed");
      return;
    }
    const win = gui.Window.create({ frame: false, transparent: false });
    win.setContentSize({
      width: display.bounds.width,
      height: display.bounds.height,
    });
    win.setBounds(display.bounds);
    //   win.setBackgroundColor(gui.Color.argb(100, 255, 0, 0));
    win.onClose = () => {
      gui.MessageLoop.quit();
    };
    const container = gui.Container.create();
    let startPoint: { x: number; y: number } = { x: 0, y: 0 };
    let currentPoint: { x: number; y: number } = { x: 0, y: 0 };
    let isMonitorSelected = false;
    let isDragging = false;
    let showTips = false;
    let isRectComplete = false; // 矩形绘制完成标记
    let isDraggingControl = false; // 是否正在拖拽控制点
    let activeControlPoint: string | null = null; // 当前激活的控制点 ('top', 'bottom', 'left', 'right')
    let isHoveringButton = false; // 鼠标是否悬停在确认按钮上

    const screenshotPNG = Jimp.fromBuffer(await screenImage.toPng(true));
    (await screenshotPNG).brightness(0.7);
    const image = gui.Image.createFromBuffer(
      (await (await screenshotPNG).getBuffer("image/png")).buffer,
      display.scaleFactor
    );
    container.onMouseLeave = (
      container: gui.Container,
      event: gui.MouseEvent
    ) => {
      if (!isMonitorSelected) {
        win.close();
      }
    };
    container.onDraw = (
      container: gui.Container,
      painter: gui.Painter,
      dirty: any
    ) => {
      painter.clear();
      painter.drawImage(image, {
        x: 0,
        y: 0,
        width: display.bounds.width,
        height: display.bounds.height,
      });
      // 显示ESC键退出提示
      painter.drawText(
        "按ESC键退出截图",
        { x: display.bounds.width / 2 - 200, y: 20, width: 400, height: 50 },
        {
          color: gui.Color.argb(255, 255, 255, 0),
          align: "center",
          font: gui.Font.create("微软雅黑", 24, "bold", "normal"),
        }
      );

      if (showTips) {
        painter.setFillColor(gui.Color.argb(255, 255, 0, 0));
        painter.drawText(
          "请从左上角往右下角拖动！",
          { x: display.bounds.width / 2 - 250, y: 100, width: 500, height: 50 },
          {
            color: gui.Color.argb(255, 255, 255, 0),
            align: "center",
            font: gui.Font.create("微软雅黑", 30, "bold", "normal"),
          }
        );
      } else {
        // 绘制矩形
        painter.setStrokeColor(gui.Color.argb(255, 255, 255, 0));
        const rect = {
          x: Math.min(startPoint.x, currentPoint.x),
          y: Math.min(startPoint.y, currentPoint.y),
          width: Math.abs(currentPoint.x - startPoint.x),
          height: Math.abs(currentPoint.y - startPoint.y),
        };
        painter.strokeRect(rect);

        // 如果矩形绘制完成，绘制控制点
        if (isRectComplete && rect.width > 30 && rect.height > 30) {
          const controlPoints = getControlPoints(startPoint, currentPoint);
          painter.setFillColor(gui.Color.argb(255, 0, 150, 255)); // 蓝色控制点
          painter.setStrokeColor(gui.Color.argb(255, 255, 255, 255)); // 白色边框

          // 绘制四个控制点
          Object.entries(controlPoints).forEach(([name, point]) => {
            const controlRect = {
              x: point.x - CONTROL_POINT_SIZE / 2,
              y: point.y - CONTROL_POINT_SIZE / 2,
              width: CONTROL_POINT_SIZE,
              height: CONTROL_POINT_SIZE,
            };
            painter.fillRect(controlRect);
            painter.strokeRect(controlRect);
          });

          // 绘制确认按钮
          const buttonWidth = 80;
          const buttonHeight = 30;
          const buttonX = rect.x + rect.width / 2 - buttonWidth / 2;
          const buttonY = rect.y + rect.height / 2 - buttonHeight / 2;

          // 按钮背景 - 根据悬停状态改变颜色
          if (isHoveringButton) {
            painter.setFillColor(gui.Color.argb(220, 0, 140, 235)); // 悬停时更亮的蓝色
          } else {
            painter.setFillColor(gui.Color.argb(200, 0, 120, 215)); // 正常的半透明蓝色背景
          }
          painter.fillRect({
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
          });

          // 按钮边框
          painter.setStrokeColor(gui.Color.argb(255, 255, 255, 255)); // 白色边框
          painter.strokeRect({
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
          });

          // 按钮文字
          painter.drawText(
            "确认",
            {
              x: buttonX,
              y: buttonY + buttonHeight / 2 - 10,
              width: buttonWidth,
              height: buttonHeight,
            },
            {
              color: gui.Color.argb(255, 255, 255, 255), // 白色文字
              align: "center",
              font: gui.Font.create("微软雅黑", 14, "bold", "normal"),
            }
          );
        }
      }
    };
    container.onMouseDown = (container: any, event: gui.MouseEvent) => {
      isMonitorSelected = true;
      const mouseX = event.positionInView.x;
      const mouseY = event.positionInView.y;

      if (isRectComplete) {
        // 检查是否点击了确认按钮
        if (isPointInConfirmButton(mouseX, mouseY, startPoint, currentPoint)) {
          console.log("确认按钮被点击，退出截图程序");
          win.close();
          return;
        }

        // 检查是否点击了控制点
        const controlPoint = getControlPointAt(
          mouseX,
          mouseY,
          startPoint,
          currentPoint,
          isRectComplete
        );
        if (controlPoint) {
          isDraggingControl = true;
          activeControlPoint = controlPoint;
          return;
        }

        // 如果点击了其他地方，重新开始绘制
        isRectComplete = false;
        isDraggingControl = false;
        activeControlPoint = null;
      }

      startPoint = { x: mouseX, y: mouseY };
      currentPoint = { x: mouseX, y: mouseY };
      isDragging = true;
    };

    container.onMouseUp = (container: any, event: gui.MouseEvent) => {
      if (isDragging) {
        isDragging = false;
        // 标记矩形绘制完成
        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.y - startPoint.y);
        if (width > 30 && height > 30) {
          isRectComplete = true;
          // 确保startPoint是左上角，currentPoint是右下角
          const minX = Math.min(startPoint.x, currentPoint.x);
          const minY = Math.min(startPoint.y, currentPoint.y);
          const maxX = Math.max(startPoint.x, currentPoint.x);
          const maxY = Math.max(startPoint.y, currentPoint.y);
          startPoint = { x: minX, y: minY };
          currentPoint = { x: maxX, y: maxY };
        }
      }

      if (isDraggingControl) {
        isDraggingControl = false;
        activeControlPoint = null;
      }

      container.schedulePaint();
    };
    container.onMouseMove = (
      container: gui.Container,
      event: gui.MouseEvent
    ) => {
      const mouseX = event.positionInView.x;
      const mouseY = event.positionInView.y;

      // 检查是否悬停在确认按钮上
      const wasHoveringButton = isHoveringButton;
      if (isRectComplete) {
        isHoveringButton = isPointInConfirmButton(
          mouseX,
          mouseY,
          startPoint,
          currentPoint
        );

        // 设置光标样式
        if (isHoveringButton) {
          container.setCursor(gui.Cursor.createWithType("hand"));
        } else {
          container.setCursor(gui.Cursor.createWithType("default"));
        }

        // 如果悬停状态改变，重新绘制
        if (wasHoveringButton !== isHoveringButton) {
          container.schedulePaint();
        }
      } else {
        isHoveringButton = false;
        container.setCursor(gui.Cursor.createWithType("default"));
      }
      if (isDraggingControl && activeControlPoint) {
        // 拖拽控制点调整矩形大小
        switch (activeControlPoint) {
          case "top":
            // 上边控制点：只能垂直拖动，调整上边位置
            startPoint.y = Math.max(0, Math.min(mouseY, currentPoint.y - 30));
            break;
          case "bottom":
            // 下边控制点：只能垂直拖动，调整下边位置
            currentPoint.y = Math.min(
              display.bounds.height,
              Math.max(mouseY, startPoint.y + 30)
            );
            break;
          case "left":
            // 左边控制点：只能水平拖动，调整左边位置
            startPoint.x = Math.max(0, Math.min(mouseX, currentPoint.x - 30));
            break;
          case "right":
            // 右边控制点：只能水平拖动，调整右边位置
            currentPoint.x = Math.min(
              display.bounds.width,
              Math.max(mouseX, startPoint.x + 30)
            );
            break;
        }
        container.schedulePaint();
      } else if (isDragging) {
        if (mouseX < startPoint.x || mouseY < startPoint.y) {
          showTips = true;
          container.schedulePaint();
          return;
        }
        showTips = false;
        currentPoint = {
          x: Math.min(mouseX, display.bounds.width),
          y: Math.min(mouseY, display.bounds.height),
        };
        container.schedulePaint();
      } else {
        showTips = false;
        // 更新鼠标样式（可选）
        const controlPoint = getControlPointAt(
          mouseX,
          mouseY,
          startPoint,
          currentPoint,
          isRectComplete
        );
        if (controlPoint) {
          // 可以在这里设置不同的鼠标样式来指示可拖拽方向
          // 例如：container.setCursor('resize-ns') 或 'resize-ew'
          container.setCursor(gui.Cursor.createWithType("crosshair"));
        }
      }
    };
    win.onKeyDown = (win: any, event: gui.KeyEvent) => {
      console.log("key down", event);
      if (event.key === "Escape") {
        isRectComplete = false;
        // 防止重新执行
        isMonitorSelected = true;
        win.close();
      }
    };
    win.setContentView(container);
    win.setFullscreen(true);
    if (process.platform !== "darwin") {
      win.setMenuBarVisible(false);
      win.setSkipTaskbar(true);
    }
    win.setAlwaysOnTop(true);
    win.activate();
    gui.MessageLoop.run();
    console.debug("message loop quit");
    if (!isMonitorSelected) {
      return screenshot(saveFileFullPath);
    }
    let rect: { x: number; y: number; width: number; height: number } =
      undefined as any;
    if (isRectComplete) {
      rect = {
        x: startPoint.x,
        y: startPoint.y,
        width: currentPoint.x - startPoint.x,
        height: currentPoint.y - startPoint.y,
      };
      if (saveFileFullPath?.length) {
        // 检查文件夹是否存在
        const folderPath = path.dirname(saveFileFullPath);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        const img = await screenImage.crop(
          rect.x,
          rect.y,
          rect.width,
          rect.height
        );
        const buffer = await img.toPng();
        (await Jimp.fromBuffer(buffer)).write(saveFileFullPath as any);
        console.log(`截图已保存到 ${saveFileFullPath}`);
      }
    } else {
      console.log("用户取消了截图");
    }
    return {
      rect,
      monitor,
    };
  } catch (error) {
    console.error("截图失败:", error);
    return undefined;
  }
}
