import { PCAgent } from "../src";
import PCDevice from "../src/pc.device";
import { wechatInstruct } from "./instruct";
import { IPCService } from "../src";

export async function writeFile(pcService: IPCService) {
  const pcDevice = new PCDevice({
    pcService,
    clickBeforeInput: true,
  });
  await pcDevice.launch();
  const pcAgent = new PCAgent(pcDevice);
  const res = await pcAgent.aiOutput(`使用浏览器搜索总结一下南京今天的天气`);
  pcAgent.aiAction(
    `${wechatInstruct}\n先点击底部任务栏，打开微信应用，然后找到'文件传输助手'，发送以下天气信息：\n${res}`
  );
}
