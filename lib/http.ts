/** 统一的 JSON 响应构造器（edge 运行时可用），供各 API 路由复用 */
export function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
