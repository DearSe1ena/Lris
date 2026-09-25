"use client";

import { MessageSquare, Send, BookHeart } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useMemoryStore } from "@/store/memory-store";

/** 实时统计面板：从本地聊天 / 记忆数据实时计算，不再使用静态占位数据 */
export function StatsPanel() {
  const messages = useChatStore((s) => s.messages);
  const memories = useMemoryStore((s) => s.memories);

  const total = messages.length;
  const mine = messages.filter((m) => m.role === "user").length;

  const stats = [
    { label: "消息总数", value: String(total), hint: "累计", Icon: MessageSquare },
    { label: "我的发言", value: String(mine), hint: "对话轮次", Icon: Send },
    { label: "我的记忆", value: String(memories.length), hint: "长期记忆", Icon: BookHeart },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, hint, Icon }) => (
        <div key={label} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
            <span className="text-xs">{label}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
        </div>
      ))}
    </div>
  );
}
