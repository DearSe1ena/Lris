import type { BackgroundMode, ChatTurn } from "@/types";
import { useSettingsStore } from "@/store/settings-store";

export interface StreamChatOptions {
  messages: ChatTurn[];
  model: string;
  backgroundMode: BackgroundMode;
  /** 每收到一段增量文本时回调，用于打字机效果 */
  onDelta: (text: string) => void;
  signal?: AbortSignal;
}

/**
 * 客户端流式请求 /api/chat（SSE 格式：data: {"content":"..."}）。
 * 逐段回调 onDelta，返回完整回复文本。
 */
export async function streamChat(options: StreamChatOptions): Promise<string> {
  const { messages, model, backgroundMode, onDelta, signal } = options;

  // 页面「API 设置」里填写的配置优先；留空则服务端回退到 .env.local
  const settings = useSettingsStore.getState();

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model,
      backgroundMode,
      apiKey: settings.apiKey || undefined,
      baseURL: settings.baseURL || undefined,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    throw new Error(`请求失败（${response.status}）：${detail.slice(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const parsed = JSON.parse(payload) as { content?: string; error?: string };
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        if (parsed.content) {
          full += parsed.content;
          onDelta(parsed.content);
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          // 数据块尚未完整到达，忽略继续等
          continue;
        }
        throw error;
      }
    }
  }

  return full;
}
