import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import type { ChatTurn } from "@/types";

/**
 * DeepSeek 接口地址（OpenAI 兼容格式）。
 * 换成任意 OpenAI 兼容服务的 Chat Completions 地址即可无缝切换。
 */
export const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/chat/completions";

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
    baseURL: baseURL ?? DEEPSEEK_BASE_URL,
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
        for await (const text of result.textStream) {
          controller.enqueue(encoder.encode(text));
        }
      } finally {
        controller.close();
      }
    },
  });
}
