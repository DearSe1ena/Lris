import type { BackgroundMode, ChatTurn } from "@/types";
import { useSettingsStore } from "@/store/settings-store";

export interface StreamChatOptions {
  messages: ChatTurn[];
  model: string;
  backgroundMode: BackgroundMode;
  /** 每收到一段增量文本时回调，用于打字机效果 */
  onDelta: (text: string) => void;
  signal?: AbortSignal;
  /** 长期记忆条目（注入 System Prompt，让简璃跨会话记住） */
  memories?: string[];
  /** 知识库检索命中的参考资料（轻量 RAG 上下文注入） */
  contexts?: string[];
}

/** 生成用户本地时间上下文（让简璃知道现在几月几号、星期几、几点） */
function buildTimeContext(date: Date): string {
  const week = ["日", "一", "二", "三", "四", "五", "六"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 星期${
    week[date.getDay()]
  } ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 客户端流式请求 /api/chat（SSE 格式：data: {"content":"..."}）。
 * 逐段回调 onDelta，返回完整回复文本。
 */
export async function streamChat(options: StreamChatOptions): Promise<string> {
  const { messages, model, backgroundMode, onDelta, signal, memories, contexts } = options;

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
      timeContext: buildTimeContext(new Date()),
      memories: memories ?? [],
      contexts: contexts ?? [],
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
