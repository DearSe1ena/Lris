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
  /** 上次与用户互动的本地时间戳（毫秒），用于生成「距上次对话隔了多久」的时间上下文 */
  lastInteractionAt?: number;
}

/** 生成用户本地时间上下文：现在几点几分 +（可选）距上次互动隔了多久 */
function buildTimeContext(date: Date, lastInteractionAt?: number): string {
  const week = ["日", "一", "二", "三", "四", "五", "六"];
  const pad = (n: number) => String(n).padStart(2, "0");
  const now = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 星期${
    week[date.getDay()]
  } ${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (lastInteractionAt == null) return `现在是 ${now}`;

  const diffMs = Math.max(0, date.getTime() - lastInteractionAt);
  const diffMin = Math.floor(diffMs / 60000);
  let elapsed: string;
  if (diffMin < 1) {
    elapsed = "刚刚";
  } else if (diffMin < 60) {
    elapsed = `${diffMin} 分钟`;
  } else if (diffMin < 24 * 60) {
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    elapsed = `${h} 小时${m ? `${m} 分` : ""}`;
  } else {
    const d = Math.floor(diffMin / (24 * 60));
    const h = Math.floor((diffMin % (24 * 60)) / 60);
    elapsed = `${d} 天${h ? `${h} 小时` : ""}`;
  }

  return `现在是 ${now}；距离上次互动已过去约 ${elapsed}`;
}

/**
 * 客户端流式请求 /api/chat（SSE 格式：data: {"content":"..."}）。
 * 逐段回调 onDelta，返回完整回复文本。
 */
export async function streamChat(options: StreamChatOptions): Promise<string> {
  const {
    messages,
    model,
    backgroundMode,
    onDelta,
    signal,
    memories,
    contexts,
    lastInteractionAt,
  } = options;

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
      timeContext: buildTimeContext(new Date(), lastInteractionAt),
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
