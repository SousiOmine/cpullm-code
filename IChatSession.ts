interface IChatSession {

    /**
     * ユーザーの入力に対して応答を生成する
     */
    prompt(query: string, options?: { maxTokens?: number, temperature?: number }): Promise<string>;

    /**
     * チャット履歴にメッセージを追加する
     */
    push(type: "user" | "model", message: string): void;
}

export type { IChatSession };