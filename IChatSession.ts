interface IChatSession {

    /**
     * ユーザーの入力に対して応答を生成する
     */
    prompt(query: string, options?: { maxTokens?: number, temperature?: number }): Promise<string>;
}

export { IChatSession };