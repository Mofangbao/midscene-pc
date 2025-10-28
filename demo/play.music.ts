import { IPCService, PCAgent } from "../src";
import PCDevice from "../src/pc.device";

export async function playMusic(pcService: IPCService) {
  const pcDevice = new PCDevice({ pcService, clickBeforeInput: true });
  await pcDevice.launch();
  const pcAgent = new PCAgent(pcDevice);
  await pcAgent.aiTap("任务栏的QQ音乐");
  await pcAgent.aiAction("搜索 好风吹进生活里");
  await pcAgent.aiAction("播放房东的猫唱的版本");
}
