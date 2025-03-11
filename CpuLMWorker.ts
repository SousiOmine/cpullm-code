import { ILMWorker } from "./ILMWorker.ts";
import { IChatSession } from "./IChatSession.ts";
import { CpullmChatSession } from "./CpullmChatSession.ts";


class CpuLMWorker implements ILMWorker {
    private static systemToolFormat = (systemPrompt: string, tools: string): string => {
        return `${systemPrompt}
      
#ツール
ユーザーの要望達成を支援するために、1つ以上のpython関数を呼び出すことができます。
呼び出せるpythonの関数を<tools></tools>タグ内に記します。
      
<tools>
${tools}
</tools>
      
関数を呼び出すには、以下のように関数名と引数を<tool_call></tool_call>タグ内に記述してください。
<tool_call>
function_name(param1=value1, param2=value2)
</tool_call>
`;
    };

    private static system_prompt: string = `あなたは誠実なAIアシスタントで、優秀で頭の回るソフトウェアエンジニアとして採用されました。
あなたはコンピュータのターミナル内で動作しており、作業ディレクトリ内から呼び出されています。関数を呼び出したり要望に答えることによってユーザーを支援してください。
まだ得ていない情報を憶測で伝えてはいけません。知らない情報は知らないと伝えてください。ただしユーザーが知らなそうな知識があれば教えてあげてください。

関数の呼び出しは、ユーザーからの指示がなくとも自主的に行ってください。

# 実行環境の情報：
- 作業ディレクトリ: ${Deno.cwd()}
- OS: ${Deno.build.os}
- アーキテクチャ: ${Deno.build.arch}

# 作業ディレクトリ${Deno.cwd()}にあるフォルダとファイル一覧:
${Array.from(Deno.readDirSync(Deno.cwd())).slice(0, 20).map(file => `- ${file.name}`).join('\n')}
${Array.from(Deno.readDirSync(Deno.cwd())).length > 20 ? `\n...他${Array.from(Deno.readDirSync(Deno.cwd())).length - 20}件` : ''}

`;
    private static tools: string = `

def getCurrentTime() -> str:
    """
    リアルタイムの世界標準時刻をISO 8601形式の文字列として返します。時間を聞かれたときに使うといいでしょう。日本時間はこれに9時間足してください。

    Returns:
        str: ISO 8601形式の現在時刻（例: '2025-03-11T17:06:00.000Z'）。
    """
    pass

def getDirectoryFiles(path: str = "") -> list[str]:
    """
    指定されたフォルダの中にあるファイルを取得します。フォルダの中身を知りたいときに使ってください。
    
    Args:
        path (str): ファイル名を取得するディレクトリの相対パス。省略するとカレントディレクトリの内容を取得。（例："C:\\pg\\netcoredbg"）
    
    Returns:
        list[str]: ディレクトリ内のファイル名のリスト
    """
    pass

def getTextFileContent(path: str) -> str:
    """
    テキストファイルの内容を読むことができます。ファイルの中身を知りたいときに使ってください。
    
    Args:
        path (str): テキストファイルの相対パス。（例1 ライセンスを読みたいとき："LICENSE" 例2 vscode用の設定ファイルを読みたいとき："./vscode/settings.json"）

    Returns:
        str: テキストファイルの内容
    
    """
`;

      
    private chatllm: IChatSession;
    private lastFunctionCall: { name: string; args: string } | null = null;


    constructor(chatllm: IChatSession) 
    {
        this.chatllm = chatllm;
        this.chatllm.push("user", `私は作業ディレクトリを開いています。私からの指示に主語がなければ、作業ディレクトリとその中にあるファイルについて質問している可能性が高いです。
必要であれば、私からの指示がなくとも自主的にcall_funcでpython関数を呼び出してください。関数を呼び出すことであなたはファイルやフォルダを自分で確認できるのです。
ただし、同じpython関数を同じ引数で2回連続で呼び出すと罰を与えます。`);
        this.chatllm.push("model", "了解いたしました。作業ディレクトリに関する質問があれば、私がお手伝いさせていただきますね！");
        this.chatllm.push("user", "その調子です。それじゃあ今の時間を教えてほしいです");
        this.chatllm.push("model", "<tool_call>getCurrentTime()</tool_call>");
        this.chatllm.push("user", "<tool_responce>\n" + "2025-03-11T13:31:13.864Z" + "\n</tool_responce>");
        this.chatllm.push("model", "現在の日本時間は3月11日22時31分13秒です。");
        this.chatllm.push("user", "ありがとうございます");
        this.chatllm.push("model", "どういたしまして！なにかお手伝いできることはありますか？");
    }

    public static async create(): Promise<CpuLMWorker> {
        const system_prompt = this.systemToolFormat(this.system_prompt, this.tools);
        console.log(system_prompt);
        return new CpuLMWorker(await CpullmChatSession.create(system_prompt));
    }

    public async generate(prompt: string): Promise<string> {
        let result = "";
        let generated_text = "";

        const query = `
${prompt}
`;

        generated_text = await this.chatllm.prompt(query);

        

        while(true)
        {
            const tool_results: string[] = [];
            if(generated_text.includes("<tool_call>"))
            {
                console.log(generated_text);
                //関数呼び出しの文字列を抽出
                const formatToolCallText = (input: string): string[] => {
                    const toolCallRegex = /<tool_call>(.*?)<\/tool_call>/gs;
                    const matches = input.match(toolCallRegex);
                      
                    if (!matches) return [];
                      
                    return matches.map(match => {
                        return match.replace(/<\/?tool_call>/g, '').trim();
                    });
                };
                const toolCallTexts = formatToolCallText(generated_text);
        
                
                for(const toolCallText of toolCallTexts)
                {
                        
                    //関数名のみ抽出
                    const extractFunctionName = (str: string): string | null => {
                        const match = str.match(/(\w+)\s*\(/);
                        return match ? match[1] : null;
                    };
                    const functionName = extractFunctionName(toolCallText);
                        
                    switch (functionName) {
                        case 'getCurrentTime':
                            if (this.lastFunctionCall?.name === 'getCurrentTime') {
                                tool_results.push("同じ関数を連続して呼び出さないでください！あなたには罰として60ドルの罰金命令が下されます。");
                            } else {
                                tool_results.push(this.getCurrentTime());
                                this.lastFunctionCall = { name: 'getCurrentTime', args: '' };
                            }
                            break;
        
                        case 'getDirectoryFiles':
                        {
                            // 引数を抽出
                            const extractPath = (str: string): string => {
                                const match = str.match(/path\s*=\s*['"]([^'"]*)['"]/);
                                return match ? match[1].replace(/\\/g, '/') : "";
                            };
                            const path = extractPath(toolCallText);
                            
                            if (this.lastFunctionCall?.name === 'getDirectoryFiles' && this.lastFunctionCall?.args === path) {
                                tool_results.push("同じ関数を連続して呼び出さないでください！あなたには罰として60ドルの罰金命令が下されます。");
                            } else {
                                tool_results.push(this.getDirectoryFiles(path).toString());
                                this.lastFunctionCall = { name: 'getDirectoryFiles', args: path };
                            }
                            break;
                        }
                        case 'getTextFileContent':
                        {
                            // 引数を抽出
                            const extractPath = (str: string): string => {
                                const match = str.match(/path\s*=\s*['"]([^'"]*)['"]/);
                                return match ? match[1].replace(/\\/g, '/') : "";
                            };
                            const path = extractPath(toolCallText);
                            
                            if (this.lastFunctionCall?.name === 'getTextFileContent' && this.lastFunctionCall?.args === path) {
                                tool_results.push("同じ関数を連続して呼び出さないでください！あなたには罰として60ドルの罰金命令が下されます。");
                            } else {
                                tool_results.push(this.getTextFileContent(path));
                                this.lastFunctionCall = { name: 'getTextFileContent', args: path };
                            }
                            break;
                        }
                        default:
                            break;
                    }
                }

                const toolResultsText = tool_results.join(',\n');
                const continuationPrompt = `<tool_responce>\n${toolResultsText}\n\n</tool_responce>`;
                console.log(continuationPrompt);
                generated_text = await this.chatllm.prompt(continuationPrompt);
            }
            else
            {
                result = generated_text;
                break;
            }
        }
        return result;
    }

    // ユーザーに進捗を通知する
    private notifyProgress(progress: string): void {
        console.log(progress);
    }

    // 時間を取得
    private getCurrentTime(): string {
        return new Date().toISOString();
    }

    // 相対パスディレクトリのファイル一覧を取得
    private getDirectoryFiles(path: string = ""): string[] {
        if (path === "") {
            path = ".";
        }
        try {
            const fileInfo = Deno.statSync(path);
            if (!fileInfo.isDirectory) {
                return [`エラー: ${path} はディレクトリではありません。`];
            }
            const files = Deno.readDirSync(path);
            const result: string[] = [];
            for (const file of files) {
                result.push(file.name);
            }
            return result;
        } catch (error) {
            return [`エラー: ${path} にアクセスできません。(${error.message})`];
        }
    }

    // テキストファイルの内容を取得
    private getTextFileContent(path: string): string {
        try {
            // パスの正規化
            const normalizedPath = path.replace(/\//g, '\\');
            
            // ファイルの存在確認
            try {
                Deno.statSync(normalizedPath);
            } catch {
                return `${path}というファイルが見つかりませんでした。`;
            }

            // ファイルの読み込み
            return Deno.readTextFileSync(normalizedPath);
        } catch (error) {
            if (error instanceof Error) {
                return `ファイルの読み込み中にエラーが発生しました: ${error.message}`;
            }
            return `ファイルの読み込み中に予期せぬエラーが発生しました。`;
        }
    }

    
}

export { CpuLMWorker }