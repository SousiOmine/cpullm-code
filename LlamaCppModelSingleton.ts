import { getLlama, LlamaChatSession, LlamaContext, LlamaModel } from "node-llama-cpp";

class LlamaCppModelSingleton {
    
    private static instance: LlamaCppModelSingleton;

    private static modelPath: string = "";
    private model: LlamaModel;
    private context: LlamaContext;

    private constructor(model: LlamaModel, context: LlamaContext)
    {
        this.model = model;
        this.context = context;
    }

    public static async getInstance(modelPath: string = ""): Promise<LlamaCppModelSingleton> {
        LlamaCppModelSingleton.modelPath = modelPath;
        if (!LlamaCppModelSingleton.instance || LlamaCppModelSingleton.modelPath != modelPath) {
            const llama = await getLlama();
            const model = await llama.loadModel({
                modelPath: modelPath,
            });
            const context = await model.createContext();
            LlamaCppModelSingleton.instance = new LlamaCppModelSingleton(model, context);
        }
        return LlamaCppModelSingleton.instance;
    }

    public getSession(systemPrompt: string = "あなたは誠実なアシスタントです。"): LlamaChatSession
    {
        return new LlamaChatSession({
            contextSequence: this.context.getSequence(),
            systemPrompt: systemPrompt
        });
    }

    public async dispose() {
        this.context.dispose();
        this.model.dispose();
    }
}

export { LlamaCppModelSingleton };