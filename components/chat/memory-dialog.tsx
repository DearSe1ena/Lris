"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, BookHeart, Plus, Trash2, RotateCcw } from "lucide-react";
import { useMemoryStore } from "@/store/memory-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MemoryDialogProps {
  open: boolean;
  onClose: () => void;
}

/** 记忆簿：记录重要的事（生日、喜好、约定），凛在每次聊天时都会记得 */
export function MemoryDialog({ open, onClose }: MemoryDialogProps) {
  const memories = useMemoryStore((s) => s.memories);
  const addMemory = useMemoryStore((s) => s.addMemory);
  const removeMemory = useMemoryStore((s) => s.removeMemory);
  const clearMemories = useMemoryStore((s) => s.clearMemories);
  const [draft, setDraft] = useState("");

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

  const handleAdd = () => {
    const content = draft.trim();
    if (!content) return;
    addMemory(content);
    setDraft("");
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
            <h3 className="text-base font-semibold">记忆簿</h3>
            <span className="text-xs text-muted-foreground">{memories.length} 条</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          在这里记录重要的事（生日、喜好、约定、烦恼），凛会在每次聊天时记得它们，并在合适的时候自然地提起。
        </p>

        {/* 添加 */}
        <div className="mt-4 flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="如：我的生日是 3 月 14 日"
          />
          <Button size="icon" onClick={handleAdd} disabled={!draft.trim()} aria-label="添加记忆">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* 列表 */}
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
      </div>
    </div>,
    document.body,
  );
}
