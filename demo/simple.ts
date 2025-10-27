import { IPCService, PCAgent } from "../src";
import PCDevice from "../src/pc.device";

export async function simpleDescription(pcService: IPCService) {
  const pcDevice = new PCDevice({
    pcService,
    launchOptions: {
     /*  screenArea: {
        preferManual: true,
      }, */
      /* windowInfo: {
        appName: "Trae",
      }, */
    },
  });
  await pcDevice.launch();
  const pcAgent = new PCAgent(pcDevice);
  const res = await pcAgent.aiOutput("描述一下当前桌面截图");
  console.log(res);
}
