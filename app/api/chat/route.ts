import { NextRequest } from "next/server";
import { buildSystemPrompt } from "@/config/character.config";
import { streamDeepSeekCompletion } from "@/lib/deepseek";
import type { BackgroundMode, ChatTurn } from "@/types";

/** edge 运行时：Vercel / Cloudflare Pages / 本地 dev 三端通用 */
export const runtime = "edge";

/**
 * POST /api/chat
 * body: { messages: ChatTurn[], model: string, backgroundMode?: "full" | "lite" }
 * 返回 SSE 流：data: {"content":"增量文本"}\n\n
 */
export async function POST(req: NextRequest) {
  let payload: {
    messages?: ChatTurn[];
    model?: string;
    backgroundMode?: BackgroundMode;
    /** 页面「API 设置」传入，优先于服务端环境变量 */
    apiKey?: string;
    baseURL?: string;
    /** 用户本地时间上下文（客户端生成） */
    timeContext?: string;
    /** 长期记忆条目 */
    memories?: string[];
    /** 知识库检索命中的参考资料（轻量 RAG） */
    contexts?: string[];
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "请求体不是合法 JSON" }, 400);
  }

  const {
    messages,
    model,
    backgroundMode = "full",
    apiKey: clientKey,
    baseURL: clientUrl,
    timeContext,
    memories,
    contexts,
  } = payload ?? {};

  const apiKey = clientKey?.trim() || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return json(
      {
        error:
          "未配置 API Key：请在控制台「API 设置」中填写，或在服务端 .env.local 配置 DEEPSEEK_API_KEY",
      },
      500,
    );
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "messages 不能为空" }, 400);
  }
  if (!model) {
    return json({ error: "缺少 model 参数" }, 400);
  }

  try {
    // 组装 System Prompt：人设 + 当前时间 + 长期记忆
    const promptParts: string[] = [buildSystemPrompt(backgroundMode)];

    if (timeContext?.trim()) {
      promptParts.push(
        `【当前时间】${timeContext.trim()}（这是用户本地时间。涉及日期、星期、几点的话题请以此为准，不要臆测。）`,
      );
    }

    if (Array.isArray(memories) && memories.length > 0) {
      const items = memories
        .filter((m) => m.trim())
        .slice(0, 20)
        .map((m) => `- ${m.trim()}`)
        .join("\n");
      if (items) {
        promptParts.push(
          `【关于用户的记忆】（这些是你已经知道的事，请自然地记住并在合适时体现，不要逐条复述或生硬提及）\n${items}`,
        );
      }
    }

    if (Array.isArray(contexts) && contexts.length > 0) {
      const items = contexts
        .filter((c) => c.trim())
        .slice(0, 5)
        .map((c) => c.trim());
      if (items.length) {
        promptParts.push(
          `【参考资料】（与当前话题相关的背景资料，可自然引用其中的信息来回答，但不要提及"资料""检索"等字眼）\n${items.join("\n---\n")}`,
        );
      }
    }

    const upstream = await streamDeepSeekCompletion({
      apiKey,
      model,
      systemPrompt: promptParts.join("\n\n"),
      messages,
      signal: req.signal,
      baseURL: clientUrl?.trim() || undefined,
    });

    const sse = upstream.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          // \u0001ERR: 标记块 → 转成 error 事件，客户端可读取并展示
          const data = text.startsWith("\u0001ERR:")
            ? JSON.stringify({ error: text.slice(5) })
            : JSON.stringify({ content: text });
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        },
      }),
    );

    return new Response(sse, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: `上游模型请求失败：${message}` }, 502);
  }
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
