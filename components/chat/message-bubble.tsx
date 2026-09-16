"use client";

import type { ChatMessage } from "@/store/chat-store";
import { characterConfig } from "@/config/character.config";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  /** 该消息是否正在流式接收 */
  streaming?: boolean;
}

/** 聊天气泡：用户右侧渐变，AI 左侧玻璃拟态；流式时带打字光标/思考点 */
export function MessageBubble({ message, streaming = false }: MessageBubbleProps) {
  const isUser = message.role === "user";

  // 流式等待中（还没有收到任何文字）：显示三个呼吸点
  if (!message.content && streaming) {
    return (
      <div className="flex items-end gap-2">
        <img
          src={characterConfig.portraits[0].src}
          alt=""
          className="h-7 w-7 rounded-full object-cover"
        />
        <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-white/60" />
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-white/60 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-white/60 [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    );
  }

  if (!message.content) return null;

  return (
    <div className={cn("flex items-end gap-2", isUser && "justify-end")}>
      {!isUser && (
        <img
          src={characterConfig.portraits[0].src}
          alt=""
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
      )}
      <div
        className={cn(
          "max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-br-md bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20"
            : "glass rounded-bl-md",
        )}
      >
        {message.content}
        {streaming && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-blink bg-primary align-text-bottom" />
        )}
      </div>
    </div>
  );
}
