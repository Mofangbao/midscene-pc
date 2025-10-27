import { PCAgent } from "../src";
import PCDevice from "../src/pc.device";
import { localPCService } from "../src/services/local.pc.service";
import { wechatInstruct } from "./instruct";
import { IPCService } from "../src";

export async function sendChatMsg(pcService: IPCService) {
  const pcDevice = new PCDevice({
    pcService,
    launchOptions: {
      windowInfo: {
        appName: "Weixin",
      },
      /* screenArea: {
                preferManual: true,
            }, */
    },
  });
  await pcDevice.launch();
  const pcAgent = new PCAgent(pcDevice);
  await pcAgent.aiAction(
    `${wechatInstruct}
    给文件传输助手发送当前系统的时间：${new Date().toLocaleString()}。
    `
  );
}
