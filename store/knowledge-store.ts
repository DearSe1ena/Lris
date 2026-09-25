"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makeId } from "@/lib/id";

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
