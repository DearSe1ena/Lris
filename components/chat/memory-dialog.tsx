"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, BookHeart, Database, Plus, Trash2, RotateCcw } from "lucide-react";
import { useMemoryStore } from "@/store/memory-store";
import { useKnowledgeStore } from "@/store/knowledge-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MemoryDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 记忆与知识库：
 * - 记忆：重要的事（生日、喜好、约定），凛每次聊天都会记得；
 * - 知识库：粘贴文档资料，聊天时自动检索相关内容作为参考（轻量 RAG）。
 */
export function MemoryDialog({ open, onClose }: MemoryDialogProps) {
  const [tab, setTab] = useState<"memory" | "knowledge">("memory");

  const memories = useMemoryStore((s) => s.memories);
  const addMemory = useMemoryStore((s) => s.addMemory);
  const removeMemory = useMemoryStore((s) => s.removeMemory);
  const clearMemories = useMemoryStore((s) => s.clearMemories);

  const entries = useKnowledgeStore((s) => s.entries);
  const addEntry = useKnowledgeStore((s) => s.addEntry);
  const removeEntry = useKnowledgeStore((s) => s.removeEntry);
  const clearEntries = useKnowledgeStore((s) => s.clearEntries);

  const [draft, setDraft] = useState("");
  const [kTitle, setKTitle] = useState("");
  const [kContent, setKContent] = useState("");

  // Esc 关闭 + 锁定背景滚动
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleAddMemory = () => {
    const content = draft.trim();
    if (!content) return;
    addMemory(content);
    setDraft("");
  };

  const handleAddKnowledge = () => {
    const title = kTitle.trim();
    const content = kContent.trim();
    if (!content) return;
    addEntry(title || content.slice(0, 20), content);
    setKTitle("");
    setKContent("");
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="glass relative max-h-[88dvh] w-full max-w-md animate-fade-in overflow-y-auto overscroll-contain rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookHeart className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">记忆与知识库</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("memory")}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2 text-sm transition-colors",
              tab === "memory"
                ? "border-primary/60 bg-primary/10 font-medium"
                : "border-white/10 text-muted-foreground hover:border-white/25",
            )}
          >
            记忆（{memories.length}）
          </button>
          <button
            type="button"
            onClick={() => setTab("knowledge")}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2 text-sm transition-colors",
              tab === "knowledge"
                ? "border-primary/60 bg-primary/10 font-medium"
                : "border-white/10 text-muted-foreground hover:border-white/25",
            )}
          >
            知识库（{entries.length}）
          </button>
        </div>

        {tab === "memory" ? (
          <>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              记录重要的事（生日、喜好、约定、烦恼），凛会在每次聊天时记得它们，并在合适的时候自然地提起。
            </p>

            <div className="mt-3 flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleAddMemory();
                  }
                }}
                placeholder="如：我的生日是 3 月 14 日"
              />
              <Button size="icon" onClick={handleAddMemory} disabled={!draft.trim()} aria-label="添加记忆">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {memories.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  还没有记忆。添加第一条，让凛开始记住你。
                </p>
              ) : (
                memories.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <p className="text-sm leading-relaxed">{m.content}</p>
                    <button
                      onClick={() => removeMemory(m.id)}
                      className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-rose-300"
                      aria-label="删除这条记忆"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {memories.length > 0 && (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMemories}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  清空全部
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              粘贴文档资料。聊天时会自动检索相关内容作为参考（轻量 RAG：分块 → 检索 → 注入），让凛的回答更准确。
            </p>

            <div className="mt-3 space-y-2">
              <Input
                value={kTitle}
                onChange={(e) => setKTitle(e.target.value)}
                placeholder="标题（可选）"
                className="h-9"
              />
              <textarea
                value={kContent}
                onChange={(e) => setKContent(e.target.value)}
                rows={4}
                placeholder="粘贴资料正文…"
                className="glass w-full resize-none rounded-xl bg-transparent px-3 py-2.5 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 sm:text-sm"
              />
              <Button size="sm" onClick={handleAddKnowledge} disabled={!kContent.trim()}>
                <Database className="h-3.5 w-3.5" />
                存入知识库
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {entries.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  知识库是空的。粘贴第一份资料试试。
                </p>
              ) : (
                entries.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      {e.title && <p className="text-sm font-medium">{e.title}</p>}
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {e.content}
                      </p>
                    </div>
                    <button
                      onClick={() => removeEntry(e.id)}
                      className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-rose-300"
                      aria-label="删除这份资料"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {entries.length > 0 && (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearEntries}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  清空知识库
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
