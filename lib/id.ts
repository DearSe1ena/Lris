/** 生成唯一 id：优先 crypto.randomUUID，回退到时间戳 + 随机串（各 store 共用） */
export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
