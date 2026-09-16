export type Role = "user" | "assistant" | "system";

/** 发送给模型的一段对话 */
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** 背景包模式：完整背景（完整人格） / 精简背景（关键设定） */
export type BackgroundMode = "full" | "lite";

/** 连接状态：未连接 / 已连接 / 生成中 */
export type ConnectionStatus = "idle" | "connected" | "generating";
