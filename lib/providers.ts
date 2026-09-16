import { normalizeBaseURL } from "@/lib/deepseek";

/**
 * 供应商探测/余额工具（服务端使用）：
 * - listModels：调用 OpenAI 兼容的 GET /models，返回该 API 可用模型 id 列表
 * - queryBalance：调用 DeepSeek 风格的 GET /user/balance（其他服务可能不支持，会返回错误信息）
 */

const DEFAULT_BASE = "https://api.deepseek.com";

export async function listModels(
  baseURL: string | undefined,
  apiKey: string,
): Promise<string[]> {
  const base = normalizeBaseURL(baseURL ?? DEFAULT_BASE);
  const res = await fetch(`${base}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`模型列表请求失败（${res.status}）${detail.slice(0, 200)}`);
  }
  const payload = (await res.json()) as { data?: { id?: string }[] };
  return (payload.data ?? [])
    .map((m) => m.id)
    .filter((id): id is string => Boolean(id));
}

export async function queryBalance(
  baseURL: string | undefined,
  apiKey: string,
): Promise<unknown> {
  const base = normalizeBaseURL(baseURL ?? DEFAULT_BASE);
  const res = await fetch(`${base}/user/balance`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`余额查询失败（${res.status}）${detail.slice(0, 200)}`);
  }
  return await res.json();
}
