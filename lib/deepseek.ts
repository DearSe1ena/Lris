import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import type { ChatTurn } from "@/types";

/**
 * DeepSeek 接口地址（OpenAI 兼容格式）。
 * 注意：AI SDK 会自动追加 /chat/completions 路径，这里必须只填根地址。
 * 换成任意 OpenAI 兼容服务的根地址即可无缝切换。
 */
export const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";

/**
 * 防御性修正：去掉用户/配置里可能误带的 /chat/completions、/v1、/models、
 * /user/balance 等尾巴，并在缺省协议时补 https://（空串回退到默认地址）。
 */
export function normalizeBaseURL(input: string): string {
  const cleaned = input
    .trim()
    .replace(/\/(v1\/)?chat\/completions\/?$/i, "")
    .replace(/\/(models|user\/balance)\/?$/i, "")
    .replace(/\/v1\/?$/i, "")
    .replace(/\/+$/, "");

  if (!cleaned) return DEEPSEEK_BASE_URL;
  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
}

export interface DeepSeekStreamOptions {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatTurn[];
  signal?: AbortSignal;
  temperature?: number;
  /** 可选：覆盖接口地址（页面 API 设置传入）；缺省用环境变量/默认值 */
  baseURL?: string;
}

/**
 * 借助 Vercel AI SDK（开源）调用 DeepSeek 流式补全。
 * 返回一个只输出 delta 文本字节的 ReadableStream，供路由层包装成 SSE。
 */
export async function streamDeepSeekCompletion(
  options: DeepSeekStreamOptions,
): Promise<ReadableStream<Uint8Array>> {
  const {
    apiKey,
    model,
    systemPrompt,
    messages,
    signal,
    temperature = 0.9,
    baseURL,
  } = options;

  const provider = createOpenAICompatible({
    name: "deepseek",
    baseURL: normalizeBaseURL(baseURL ?? DEEPSEEK_BASE_URL),
    apiKey,
  });

  const result = streamText({
    model: provider(model),
    system: systemPrompt,
    messages,
    temperature,
    abortSignal: signal,
  });

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            controller.enqueue(encoder.encode(part.text));
          } else if (part.type === "error") {
            // 上游出错（404/401/模型名无效等）：以 \u0001ERR: 标记块发出，
            // 由路由层转成 SSE error 事件、客户端弹给用户，避免静默吞掉。
            const message =
              part.error instanceof Error ? part.error.message : String(part.error);
            controller.enqueue(encoder.encode(`\u0001ERR:${message}`));
            return;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        controller.enqueue(encoder.encode(`\u0001ERR:${message}`));
      } finally {
        controller.close();
      }
    },
  });
}
