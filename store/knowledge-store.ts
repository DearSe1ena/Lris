"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

interface KnowledgeState {
  entries: KnowledgeEntry[];
  addEntry: (title: string, content: string) => void;
  removeEntry: (id: string) => void;
  clearEntries: () => void;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 知识库：粘贴文档资料，聊天时自动检索相关内容注入（轻量 RAG） */
export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (title, content) =>
        set((state) => ({
          entries: [
            ...state.entries,
            { id: makeId(), title, content, createdAt: Date.now() },
          ],
        })),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      clearEntries: () => set({ entries: [] }),
    }),
    { name: "rin-knowledge-v1" },
  ),
);
