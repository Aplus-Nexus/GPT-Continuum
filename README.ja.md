# GPT Continuum

<p align="center"><img src="assets/logo.png" alt="GPT Continuum logo" width="180" /></p>

<p align="center"><strong>作業が終わるまで、ChatGPT を前に進め続けます。</strong></p>

GPT Continuum は、現在の ChatGPT 会話へ設定した follow-up message を一定間隔で送るローカル ChatGPT Plugin / MCP App です。容量制限、一時的な中断、モデルの早期停止から長いタスクを再開するために使えます。

## 機能

- HTTPS サービス、データベース、OpenAI API キーが不要
- ChatGPT 公式の `sendFollowUpMessage` を使用
- 中国語・英語テンプレートとカスタムメッセージ
- 送信間隔と最大送信回数を設定可能
- 開始、停止、1 回だけ送信、PiP 表示に対応
- 会話内容を読み取らず、キーボードやクリップボードも操作しない
- インストール後に自動起動するローカル `stdio` MCP サーバー

## インストール

メンテナーは最初に一度だけ npm パッケージを公開します。

```bash
npm publish --access public
```

ユーザーは Node.js 20 以上をインストールして、次を実行します。

```bash
npx --yes gpt-continuum@latest install
```

ChatGPT デスクトップアプリを再起動し、**Plugins → Personal** から **GPT Continuum** を検索してインストールします。新しい会話でプラグインを開き、メッセージと間隔を設定して **Start** を押してください。

## 開発

```bash
npm install
npm test
npm start
```

`npm start` はローカル MCP stdio サーバーを起動します。標準出力は MCP プロトコル用に予約され、診断情報は標準エラーに出力されます。

## 安全性と制限

このプラグインは時間に基づいてメッセージを送信します。回答を読み取ったり、タスク完了を判断したりはしません。デフォルトメッセージには、タスクが完了している場合は無視するように指示が含まれています。完了したら **Stop** を押してください。

最初は 30–60 秒の間隔をおすすめします。短すぎる間隔は重複リクエストや ChatGPT のレート制限につながる可能性があります。プラグインパネルを閉じるか、ローカルプラグインに対応していない ChatGPT クライアントを使うとタイマーは停止します。

このプロジェクトはローカル `stdio` を使用するため、ユーザーが HTTPS をデプロイする必要はありません。公開 Plugin Directory でローカル MCP を配布する場合は Desktop only と追加審査の要件があります。

## ディレクトリ構成

```text
GPT-Continuum/
├── assets/logo.png
├── public/gpt-continuum.html
├── server.mjs
├── install.mjs
├── mcp.json
└── plugin.json
```

## ライセンス

MIT。詳しくは [LICENSE](LICENSE) を参照してください。
