import { IChatSession } from "./IChatSession.ts";
import { CpullmChatSession } from "./CpullmChatSession.ts";


class ConsoleChat {
    private chatllm: IChatSession;
    constructor(chatllm: IChatSession)
    {
        this.chatllm = chatllm;
    }

    public static async create(): Promise<ConsoleChat> {
        const console_chat = new ConsoleChat(await CpullmChatSession.create());
        return console_chat;
    }

    public async run(): Promise<void> {
        while (true) {
            const query = prompt("User: ");
            if (query === null || query === "exit") {
                console.log("ユーザーが入力をキャンセルしました。");
                process.exit(0);
            }

            const answer = await this.chatllm.prompt(query);
            console.log("Assistant: ", answer);
        }
    }
}

export { ConsoleChat };