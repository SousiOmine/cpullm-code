import { IChatSession } from "./IChatSession.ts";
import { CpullmChatSession } from "./CpullmChatSession.ts";
import { ILMWorker } from "./ILMWorker.ts";
import { CpuLMWorker } from "./CpuLMWorker.ts";


class ConsoleChat {
    private chatllm: ILMWorker;
    constructor(lmworker: ILMWorker)
    {
        this.chatllm = lmworker;
    }

    public static async create(): Promise<ConsoleChat> {
        const console_chat = new ConsoleChat(await CpuLMWorker.create());
        return console_chat;
    }

    public async run(): Promise<void> {
        while (true) {
            const query = prompt("User: ");
            if (query === null || query === "exit") {
                console.log("ユーザーが入力をキャンセルしました。");
                process.exit(0);
            }

            const answer = await this.chatllm.generate(query);
            console.log("Assistant: ", answer);
        }
    }
}

export { ConsoleChat };