interface ILMWorker {
    generate(prompt: string): Promise<string>;
}

export { ILMWorker }
