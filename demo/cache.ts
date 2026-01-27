import { IPCService } from "../src";
import { PCDevice } from "../src";
import { PCAgent } from "../src";

export async function testCache(pcService: IPCService) {
    const pcDevice = new PCDevice({
        pcService,
    });
    await pcDevice.launch();
    const pcAgent = new PCAgent(pcDevice, {
        cache: {
            id: "test-cache",
        },
    });
    console.log("开始点击");
    const res = await pcAgent.aiTap("任务栏上的windows菜单", { xpath: "/taskbar/menu", cacheable: true });
    console.log(res);
}
