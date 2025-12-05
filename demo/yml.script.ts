import { readFileSync } from "node:fs";
import { IPCService, PCAgent, PCDevice } from "../src";

export async function ymlScriptDemo(pcService: IPCService) {
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
  await pcAgent.runYaml(
    readFileSync("./demo/demo.script.yml", "utf-8")
  );
}
