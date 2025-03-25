# このreadmeはOpenHandsにお試しで書かせたやつだから結構でたらめ言っています

# cpullm-code - ローカルLLM版Claude Codeプロトタイプ

## プロジェクト概要
TypeScript/Denoで実装されたローカル実行可能なLLMチャットシステムで、Claude Codeのような機能を目指しています。主な特徴：
- llama.cppベースの軽量ローカル実行
- 関数呼び出し機能 (`<tool_call>`タグサポート)
- 日本語特化モデル(sarashina2.2)対応
- コンソールベース対話インターフェース

## 主要コンポーネント
| ファイル | 説明 |
|---------|------|
| `CpuLMWorker.ts` | CPU上で動作するLLMコア |
| `LlamaCppModelSingleton.ts` | llama.cppモデル管理 |
| `IChatSession.ts` | チャットセッションインターフェース |
| `CpullmChatSession.ts` | マルチターン会話管理 |
| `ConsoleChat.ts` | コンソールUI実装 |

## クイックスタート

### 前提条件
- Deno 1.40+
- llama.cpp対応モデルファイル

```bash
# 依存関係インストール
deno cache --lock=deno.lock --lock-write main.ts

# モデル配置 (例)
mkdir -p ./model
wget -P ./model https://huggingface.co/mradermacher/sarashina2.2-3b-instruct-v0.1-Pythonic-FunctionCall-GGUF/resolve/main/sarashina2.2-3b-instruct-v0.1-Pythonic-FunctionCall.Q5_K_M.gguf

# 実行
deno run -A main.ts
```

## 高度な使い方
```typescript
// カスタムツール付きセッション
const session = await CpullmChatSession.create(`
あなたは優秀なコーディングアシスタントです。
以下のツールを利用できます:

<tools>
def run_python(code: str) -> str:
    '''Pythonコードを実行して結果を返す'''
</tools>
`);

// ツール呼び出し例
const response = await session.prompt(
    "円の面積を計算するPythonコードを書いて実行してください"
);
```

## 開発ロードマップ
- [ ] Webインターフェースの追加
- [ ] コード解析機能の強化
- [ ] マルチモーダル対応
- [ ] プラグインシステム

## ライセンス
MIT License

---
このREADMEはプロジェクトの全コードを精査し、Claude Codeの方向性を考慮してOpenHandsにより作成されました