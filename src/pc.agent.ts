import { Agent, AgentOpt } from "@midscene/core";
import PCDevice from "./pc.device.js";

export interface PCAgentOptions extends AgentOpt {
  foo: string;
}

export class PCAgent extends Agent<PCDevice> {
  constructor(protected device: PCDevice, agentOptions?: PCAgentOptions) {
    if (!device.hasLaunched()) {
      throw new Error("PCDevice not launched, please call launch() first");
    }
    super(device, agentOptions);
  }

  private random32UUID() {
    // 生成一个由字母组成的32位随机数
    const randomChars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomStr = "";
    for (let i = 0; i < 32; i++) {
      const randomIndex = Math.floor(Math.random() * randomChars.length);
      randomStr += randomChars.charAt(randomIndex);
    }
    return randomStr;
  }

  public async aiOutput(task: string) {
    return new Promise((res, rej) => {
      try {
        const uid = this.random32UUID();
        this.device.listenOutput(uid, (output) => {
          res(output);
        });
        const action = `${task}
    ==========以下是本次任务的uuid，与任务内容无关，但在调用工具需要传入uuid的时候务必原样传入===========
    ${uid}
    `;
        this.aiAction(action);
      } catch (error) {
        rej(error);
      }
    });
  }
}
