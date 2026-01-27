import { sleep } from "@midscene/core/utils";
import { createRemotePCService, PCAgent } from "../src";
import PCDevice from "../src/pc.device";

export async function remoteMonitor() {
  const service = createRemotePCService("http://192.168.0.107:3333");
  const pcDevice = new PCDevice({ pcService: service });
  await pcDevice.launch();
  const pcAgent = new PCAgent(pcDevice);
  await pcAgent.aiTap("左上角的'活动'按钮");
  await sleep(500);
  await pcAgent.aiTap("左侧的显示所有应用程序按钮（九个点点的的图标）");
  await sleep(500);
  await pcAgent.aiTap("系统监视器");
  await sleep(1000);
  const output = await pcAgent.aiAsk(
    "按内存使用排序，找出内存占用率前三的进程，输出详细信息"
  );
  console.log(output);
}
