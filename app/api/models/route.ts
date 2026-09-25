import { NextRequest } from "next/server";
import { listModels } from "@/lib/providers";
import { resolveApiConfig } from "@/lib/security";
import { json } from "@/lib/http";

/** edge 运行时：Vercel / Cloudflare Pages / 本地 dev 三端通用 */
export const runtime = "edge";

/**
 * POST /api/models
 * body: { apiKey?: string, baseURL?: string }
 * 返回该 OpenAI 兼容接口的可用模型 id 列表，用于「其他 → 检测可用模型」。
 */
export async function POST(req: NextRequest) {
  let payload: { apiKey?: string; baseURL?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "请求体不是合法 JSON" }, 400);
  }

  const { apiKey: clientKey, baseURL: clientUrl } = payload ?? {};
  const { apiKey, baseURL } = resolveApiConfig(clientKey, clientUrl);
  if (!apiKey) {
    return json({ error: "未提供 API Key：请先在页面「API 设置」中填写" }, 400);
  }

  try {
    const models = await listModels(baseURL, apiKey);
    return json({ models }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 502);
  }
}
