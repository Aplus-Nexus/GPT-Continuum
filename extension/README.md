# GPT Continuum 多会话模式

MCP 插件只能向“当前对话”发消息。这个浏览器扩展用于真正的多会话模式：它列出 Chrome/Edge 中打开的 ChatGPT 对话，让你一次选择多个标签页并同时启动定时器。

## 安装

1. 在 Chrome 或 Edge 打开 `chrome://extensions` 或 `edge://extensions`。
2. 打开右上角 **Developer mode / 开发者模式**。
3. 点击 **Load unpacked / 加载已解压的扩展**，选择这个 `extension/` 文件夹。
4. 打开多个 `https://chatgpt.com` 对话标签页，并保持登录。

## 使用

点击浏览器工具栏中的 GPT Continuum，选择要监听的标签页，设置消息和间隔，点击 **开始选中对话**。每个标签页会显示一个小状态标记。扩展会优先点击当前可见的 **Steer**，没有 Steer 时才点击 **Send / 发送**。

扩展只操作你已打开并选择的标签页，不读取聊天内容、不上传 Cookie，也不需要 OpenAI API Key。关闭标签页或点击停止即可结束对应定时器。

这个模式运行在 ChatGPT 网页版的 Chrome/Edge 标签页中。Codex Desktop 用户应直接使用插件内置的 **Codex 桌面多页面**模式；它通过本机 Codex app-server 选择并发送到多个 Codex 线程。
