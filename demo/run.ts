import "dotenv/config"; // read environment variables from .env file
import {
  createRemotePCService,
  IPCService,
  localPCService,
  startServer,
} from "../src";
import { browserUse } from "./browser.use";
import { writeFile } from "./write.file";
import { simpleDescription } from "./simple";
import { sendChatMsg } from "./send.chat.msg";
import { playMusic } from "./play.music";

const runDemo = async (pcService: IPCService) => {
  console.log(`running pc agent demo with ${pcService.name}`);
  //   await sendChatMsg(pcService);
  //   await browserUse(pcService);
  await writeFile(pcService);
  // await simpleDescription(pcService);
  // await playMusic(pcService);
};

(async () => {
  let pcService: IPCService = undefined as any;
  if (process.argv.includes("--remote")) {
    // await startServer();
    pcService = await createRemotePCService("http://localhost:3333");
  } else {
    pcService = localPCService;
  }
  await runDemo(pcService);
})();
