"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makeId } from "@/lib/id";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  /** 追加一条消息，返回消息 id（流式回复用它做增量拼接） */
  addMessage: (message: { role: "user" | "assistant"; content: string }) => string;
  appendContent: (id: string, delta: string) => void;
  setStreaming: (streaming: boolean) => void;
  clear: () => void;
}

/** 聊天记录持久化到 localStorage（key: rin-chat-v1），刷新不丢 */
export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isStreaming: false,

      addMessage: (message) => {
        const id = makeId();
        set((state) => ({
          messages: [...state.messages, { ...message, id, createdAt: Date.now() }],
        }));
        return id;
      },

      appendContent: (id, delta) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, content: m.content + delta } : m,
          ),
        })),

      setStreaming: (isStreaming) => set({ isStreaming }),

      clear: () => set({ messages: [] }),
    }),
    {
      name: "rin-chat-v1",
      partialize: (state) => ({ messages: state.messages }),
    },
  ),
);
