"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Square, Trash2, Sparkles } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useConsoleStore } from "@/store/console-store";
import {
  characterConfig,
  modelOptions,
  backgroundPacks,
} from "@/config/character.config";
import { streamChat } from "@/lib/api";
import { MessageBubble } from "@/components/chat/message-bubble";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/types";

const STATUS_PILL: Record<
  ConnectionStatus,
  { text: string; dot: string; wrap: string }
> = {
  idle: { text: "未连接", dot: "bg-zinc-400", wrap: "bg-white/5 text-zinc-400" },
  connected: { text: "已连接", dot: "bg-emerald-400", wrap: "bg-emerald-400/10 text-emerald-300" },
  generating: { text: "生成中", dot: "bg-amber-400", wrap: "bg-amber-400/10 text-amber-300" },
};

/** 聊天室：流式打字机效果 + 可中途停止 + localStorage 持久化 */
export function ChatRoom() {
  const router = useRouter();

  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendContent = useChatStore((s) => s.appendContent);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const clear = useChatStore((s) => s.clear);

  const status = useConsoleStore((s) => s.status);
  const setStatus = useConsoleStore((s) => s.setStatus);
  const modelId = useConsoleStore((s) => s.modelId);
  const backgroundId = useConsoleStore((s) => s.backgroundId);

  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 等待客户端水合，避免 localStorage 持久化状态造成水合闪烁
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const model = modelOptions.find((m) => m.id === modelId) ?? modelOptions[0];
  const background =
    backgroundPacks.find((b) => b.id === backgroundId) ?? backgroundPacks[0];

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");

    addMessage({ role: "user", content: text });
    const assistantId = addMessage({ role: "assistant", content: "" });

    // 最近 12 条作为上下文（不含刚创建的空回复占位）
    const history = useChatStore
      .getState()
      .messages.filter((m) => m.id !== assistantId && m.content.trim().length > 0)
      .slice(-12)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setStatus("generating");

    try {
      await streamChat({
        messages: history,
        model: model.apiModel,
        backgroundMode: background.mode,
        signal: controller.signal,
        onDelta: (delta) => appendContent(assistantId, delta),
      });
    } catch (error) {
      const aborted =
        error instanceof DOMException && error.name === "AbortError";
      if (!aborted) {
        appendContent(
          assistantId,
          `（连接中断：${error instanceof Error ? error.message : String(error)}）`,
        );
      }
    } finally {
      setStreaming(false);
      setStatus("connected");
    }
  };

  const handleStop = () => abortRef.current?.abort();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void handleSend();
  };

  if (!mounted) return null;

  const pill = STATUS_PILL[status];

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* 顶栏 */}
      <header className="glass z-10 flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <button
          onClick={() => router.push("/")}
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label="返回控制台"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <img
            src={characterConfig.portraits[0].src}
            alt=""
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10"
          />
          <div>
            <p className="text-sm font-semibold leading-tight">
              {characterConfig.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {characterConfig.tagline}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-xs",
            pill.wrap,
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              pill.dot,
              status !== "idle" && "animate-pulse-dot",
            )}
          />
          {pill.text}
        </span>

        <button
          onClick={clear}
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-rose-300"
          aria-label="清空聊天记录"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-6 pt-14 text-center">
              <img
                src={characterConfig.portraits[1].src}
                alt={characterConfig.displayName}
                className="h-24 w-24 rounded-full object-cover shadow-2xl shadow-primary/20 ring-4 ring-white/10"
              />
              <div className="space-y-2">
                <p className="text-lg font-medium">{characterConfig.greeting}</p>
                <p className="text-sm text-muted-foreground">
                  {characterConfig.companionTitle}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {characterConfig.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="glass rounded-full px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, index) => (
            <MessageBubble
              key={m.id}
              message={m}
              streaming={
                isStreaming &&
                index === messages.length - 1 &&
                m.role === "assistant"
              }
            />
          ))}

          {messages.length > 0 && (
            <div className="flex justify-center gap-2 pt-2 text-[11px] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {model.title} · {background.label}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 输入区 */}
      <form
        onSubmit={onSubmit}
        className="z-10 border-t border-white/5 bg-background/80 p-4 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={1}
            placeholder={`和 ${characterConfig.displayName} 说点什么…`}
            className="glass max-h-40 min-h-[44px] flex-1 resize-none rounded-2xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="glass flex h-11 w-11 items-center justify-center rounded-2xl text-rose-300 transition-colors hover:bg-rose-400/10"
              aria-label="停止生成"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
              aria-label="发送"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
