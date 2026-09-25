export interface ResolvedApiConfig {
  apiKey: string | undefined;
  baseURL: string | undefined;
}

/**
 * 解析最终要用的 API 配置，同时封堵 SSRF / Key 泄露风险：
 * - 客户端自带 Key 时，允许其指定 baseURL（自己的 Key 发往自己的地址，无泄露风险）；
 * - 回退到服务端 DEEPSEEK_API_KEY 时，强制忽略客户端 baseURL，改用服务端
 *   DEEPSEEK_BASE_URL（默认 DeepSeek 官方），避免把服务端 Key 发往任意地址。
 */
export function resolveApiConfig(
  clientKey?: string,
  clientUrl?: string,
): ResolvedApiConfig {
  const key = clientKey?.trim();
  const apiKey = key || process.env.DEEPSEEK_API_KEY;
  // undefined → lib/deepseek.ts 会回退到 DEEPSEEK_BASE_URL
  const baseURL = key ? clientUrl?.trim() || undefined : undefined;
  return { apiKey, baseURL };
}
