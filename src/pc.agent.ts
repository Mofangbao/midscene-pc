import { Agent, AgentOpt, type CacheConfig, LocateOption, LocateResultElement, type TUserPrompt } from "@midscene/core";
import PCDevice from "./pc.device.js";
import { LocalStorage } from "node-localstorage";

export interface PCAgentOptions extends AgentOpt {}

export class PCAgent extends Agent<PCDevice> {
    constructor(
        protected device: PCDevice,
        agentOptions?: PCAgentOptions,
    ) {
        if (!device.hasLaunched()) {
            throw new Error("PCDevice not launched, please call launch() first");
        }
        super(device, agentOptions);
        const cacheId =
            agentOptions?.cacheId ?? (agentOptions?.cache as CacheConfig | undefined)?.id;
        if (cacheId) {
            console.info("pc agent cache enabled,cache id:", cacheId);
            this.storage = new LocalStorage(`./cache/${cacheId}`);
        }
    }

    protected storage: LocalStorage | undefined;

    public override async aiTap(locatePrompt: TUserPrompt, opt?: LocateOption & { fileChooserAccept?: string | string[] }): Promise<any> {
        if (this.storage && opt?.cacheable && opt?.xpath?.length) {
            const location = await this.aiLocate(locatePrompt, opt);
            return this.device.click(location as any);
        }
        return super.aiTap(locatePrompt, opt);
    }

    public override async aiLocate(prompt: TUserPrompt, opt?: LocateOption): Promise<Pick<LocateResultElement, "center" | "rect"> & { dpr?: number }> {
        if (opt?.xpath?.length && opt?.cacheable) {
            if (!this.storage) {
                console.warn("PCAgent cache not enabled, please set cacheId in options");
                return super.aiLocate(prompt, opt);
            }
            const cacheKey = `${opt.xpath}`;
            const cachedElement = this.storage?.getItem(cacheKey);
            if (cachedElement) {
                console.log("PCAgent cache hit:", cacheKey);
                return JSON.parse(cachedElement);
            }
        }
        const res = await super.aiLocate(prompt, opt);
        if (opt?.xpath?.length && opt?.cacheable) {
            console.log("PCAgent cache update:" + opt.xpath);
            this.storage?.setItem(opt.xpath, JSON.stringify(res));
        }
        return res;
    }

    public clearCache() {
        if (this.storage) {
            this.storage.clear();
            console.log("PCAgent cache cleared");
        }
    }
}
