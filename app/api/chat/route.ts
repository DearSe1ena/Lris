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
    const upstream = await streamDeepSeekCompletion({
      apiKey,
      model,
      systemPrompt: buildSystemPrompt(backgroundMode),
      messages,
      signal: req.signal,
      baseURL: clientUrl?.trim() || undefined,
    });

    const sse = upstream.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const data = JSON.stringify({ content: text });
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
