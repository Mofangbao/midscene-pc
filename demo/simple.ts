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
    const res = await pcAgent.aiAsk("描述一下当前桌面截图");
    console.log(res);
}

export async function simpleDragAndDrop(pcService: IPCService) {
    const pcDevice = new PCDevice({
        pcService,
        launchOptions: {
            screenArea: {
                preferManual: true,
            },
        },
    });
    await pcDevice.launch();
    const pcAgent = new PCAgent(pcDevice);
    await pcAgent.ai("将桌面上的最后一个文件拖拽到回收站");
}
