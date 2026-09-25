"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makeId } from "@/lib/id";

export interface MemoryEntry {
  id: string;
  content: string;
  createdAt: number;
}

interface MemoryState {
  memories: MemoryEntry[];
  addMemory: (content: string) => void;
  removeMemory: (id: string) => void;
  clearMemories: () => void;
}

/** 长期记忆：保存在本机浏览器 localStorage（key: rin-memories-v1），每次请求注入 System Prompt */
export const useMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      memories: [],
      addMemory: (content) =>
        set((state) => ({
          memories: [
            ...state.memories,
            { id: makeId(), content, createdAt: Date.now() },
          ],
        })),
      removeMemory: (id) =>
        set((state) => ({
          memories: state.memories.filter((m) => m.id !== id),
        })),
      clearMemories: () => set({ memories: [] }),
    }),
    { name: "rin-memories-v1" },
  ),
);
