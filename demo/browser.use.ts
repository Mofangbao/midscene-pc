import { PCAgent } from "../src";
import PCDevice from "../src/pc.device";
import { localPCService } from "../src/services/local.pc.service";
import { IPCService } from "../src";

export async function browserUse(pcService: IPCService) {
  const pcDevice = new PCDevice({
    pcService,
    launchOptions: {
      windowInfo: {
        appName: "Edge",
      },
    },
  });
  await pcDevice.launch();
  const pcAgent = new PCAgent(pcDevice);
  await pcAgent.aiAction("打开谷歌搜索");
  await pcAgent.aiAction("搜索midscene");
  await pcAgent.aiAction("找到官网打开");
}
