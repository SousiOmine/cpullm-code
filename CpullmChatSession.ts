import { LlamaChatSession } from "node-llama-cpp";
import { IChatSession } from "./IChatSession.ts";
import { LlamaCppModelSingleton } from "./LlamaCppModelSingleton.ts";

class CpullmChatSession implements IChatSession {
    private model: LlamaCppModelSingleton;
    private session: LlamaChatSession;
    
    public static async create(systemPrompt: string = "あなたは誠実なアシスタントです。"): Promise<CpullmChatSession> {
        const chat_session = new CpullmChatSession();
        const model = await LlamaCppModelSingleton.getInstance("./model/sarashina2.2-3b-instruct-v0.1-Pythonic-FunctionCall.Q5_K_M.gguf");
        chat_session.session = model.getSession(systemPrompt);
        return chat_session;
    }

    public async prompt(query: string): Promise<string> {
        return this.session.prompt(query).then((response) => {
            return response;
        });
    }
}

export { CpullmChatSession };