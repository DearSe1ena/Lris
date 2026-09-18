/**
 * 轻量检索增强生成（RAG）——纯客户端、零依赖、无 API 成本：
 * 文档分块 → 二元组关键词打分 → Top-K 检索 → 上下文注入。
 */

/** 按句切块：避免整篇文档过长，也方便精确召回 */
export function chunkText(text: string, maxLen = 200): string[] {
  const sentences = text.split(/(?<=[。！？!?\n；;])/);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > maxLen && cur.trim()) {
      chunks.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

/** 提取字符二元组集合（中文/字母/数字友好，无需分词器） */
export function bigrams(s: string): Set<string> {
  const t = s.toLowerCase().replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, "");
  const set = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) {
    set.add(t.slice(i, i + 2));
  }
  return set;
}

/** 查询与块的相关度得分：命中查询二元组比例 */
export function scoreChunk(query: string, chunk: string): number {
  const q = bigrams(query);
  const c = bigrams(chunk);
  if (q.size === 0 || c.size === 0) return 0;
  let hit = 0;
  q.forEach((g) => {
    if (c.has(g)) hit++;
  });
  return hit / q.size;
}

export interface RetrievableEntry {
  id: string;
  title: string;
  content: string;
}

/** Top-K 检索：从知识库条目中召回与查询最相关的文本块 */
export function retrieveTopK(
  query: string,
  entries: RetrievableEntry[],
  topK = 3,
  maxTotal = 600,
): string[] {
  const scored: { text: string; score: number }[] = [];
  for (const e of entries) {
    for (const chunk of chunkText(e.content)) {
      scored.push({ text: chunk, score: scoreChunk(query, chunk) });
    }
  }
  scored.sort((a, b) => b.score - a.score);

  const result: string[] = [];
  let total = 0;
  for (const s of scored) {
    if (s.score <= 0) break;
    if (result.length >= topK) break;
    if (total + s.text.length > maxTotal) break;
    result.push(s.text);
    total += s.text.length;
  }
  return result;
}
