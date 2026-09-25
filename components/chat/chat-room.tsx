"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Square, Trash2, Sparkles, BookHeart } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useConsoleStore } from "@/store/console-store";
import { useSettingsStore } from "@/store/settings-store";
import { useMemoryStore } from "@/store/memory-store";
import { useKnowledgeStore } from "@/store/knowledge-store";
import { retrieveTopK } from "@/lib/retrieval";
import {
  characterConfig,
  modelOptions,
  backgroundPacks,
} from "@/config/character.config";
import { streamChat } from "@/lib/api";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MemoryDialog } from "@/components/chat/memory-dialog";
import { cn, formatDateLabel, isSameDay } from "@/lib/utils";
import type { ChatTurn, ConnectionStatus } from "@/types";

const STATUS_PILL: Record<
  ConnectionStatus,
  { text: string; dot: string; wrap: string }
> = {
  idle: { text: "未连接", dot: "bg-zinc-400", wrap: "bg-white/5 text-zinc-400" },
  connected: { text: "已连接", dot: "bg-emerald-400", wrap: "bg-emerald-400/10 text-emerald-300" },
  generating: { text: "生成中", dot: "bg-amber-400", wrap: "bg-amber-400/10 text-amber-300" },
};

/** 根据当前时间生成「主动联系」触发提示（作为隐藏的系统消息发给模型） */
function buildProactiveTrigger(date: Date): string {
  const h = date.getHours();
  let flavor = "主动发起一句话题，用冠冕堂皇的借口，回复保持简短";
  if (h >= 5 && h < 11) {
    flavor = "现在是早晨，请按你人设的早安习惯主动发一条早安消息";
  } else if (h >= 11 && h < 14) {
    flavor = "现在是中午，可以用你的方式催用户按时吃饭";
  } else if (h >= 21 || h < 3) {
    flavor = "夜深了，请按你人设的习惯道晚安并督促用户早点休息";
  }
  return `（系统提示：用户当前没有发言。${flavor}。不要提及本条提示，保持你的人设和称呼习惯。）`;
}

/** 格式化聊天错误；按错误类型附带自查提示 */
function formatChatError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  let hint = "";
  if (/model/i.test(message)) {
    hint = "（提示：该 API 可能不支持此模型名，可到 ⚙「API 设置」→「检测可用模型」查看支持的模型）";
  } else if (/unauthorized|authentication|401/i.test(message)) {
    hint = "（提示：Key 被拒绝，或该模型需要更高权限——请到 ⚙ 检查 Key 是否正确、或改用 Flash 模型）";
  } else if (/load failed|failed to fetch|networkerror|timeout/i.test(message)) {
    hint = "（连接中断或响应超时：可重试一次，或改用 Flash 模型）";
  }
  return `（出错了：${message}）${hint}`;
}

/** 取最近 12 条非空消息作为上下文（排除正在流式占位的空回复） */
function buildHistory(excludeId?: string): ChatTurn[] {
  return useChatStore
    .getState()
    .messages.filter((m) => m.id !== excludeId && m.content.trim().length > 0)
    .slice(-12)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}

/** 当前存储里最后一条用户消息的本地时间戳（用于计算距上次互动隔了多久） */
function getLastInteractionAt(): number | undefined {
  const users = useChatStore
    .getState()
    .messages.filter((m) => m.role === "user");
  return users[users.length - 1]?.createdAt;
}

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
  const proactive = useConsoleStore((s) => s.proactive);
  const customModels = useSettingsStore((s) => s.customModels);
  const memories = useMemoryStore((s) => s.memories);

  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // 主动联系：上次主动发话后用户是否已回应（未回应则不追发）
  const proactiveSentRef = useRef(false);
  const proactiveBusyRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 等待客户端水合，避免 localStorage 持久化状态造成水合闪烁
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const model = [...modelOptions, ...customModels].find(
    (m) => m.id === modelId,
  ) ?? modelOptions[0];
  const background =
    backgroundPacks.find((b) => b.id === backgroundId) ?? backgroundPacks[0];

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");

    // 距上次互动：本条发送前，上一条用户消息的时间戳
    const lastInteractionAt = getLastInteractionAt();

    addMessage({ role: "user", content: text });
    const assistantId = addMessage({ role: "assistant", content: "" });

    // 最近 12 条作为上下文（不含刚创建的空回复占位）
    const history = buildHistory(assistantId);

    // 知识库检索（轻量 RAG）：以本条消息为查询召回相关资料
    const contexts = retrieveTopK(text, useKnowledgeStore.getState().entries);

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
        memories: memories.map((m) => m.content),
        contexts,
        lastInteractionAt,
        onDelta: (delta) => appendContent(assistantId, delta),
      });
    } catch (error) {
      const aborted =
        error instanceof DOMException && error.name === "AbortError";
      if (!aborted) {
        appendContent(assistantId, formatChatError(error));
      }
    } finally {
      setStreaming(false);
      setStatus("connected");
    }
  };

  const handleStop = () => abortRef.current?.abort();

  /** 主动联系：以隐藏系统消息触发模型，让简璃主动发一条消息（不追发未回应的消息） */
  const sendProactive = useCallback(async () => {
    if (!proactive || isStreaming || proactiveBusyRef.current) return;
    if (status === "generating") return;
    if (proactiveSentRef.current) return; // 用户未回应，不追发

    proactiveBusyRef.current = true;
    proactiveSentRef.current = true;

    // 读取最新配置：避免把 model/background/memories 对象放进依赖数组造成频繁重建
    const currentModelId = useConsoleStore.getState().modelId;
    const currentBackgroundId = useConsoleStore.getState().backgroundId;
    const customModels = useSettingsStore.getState().customModels;
    const currentModel =
      [...modelOptions, ...customModels].find((m) => m.id === currentModelId) ??
      modelOptions[0];
    const currentBackground =
      backgroundPacks.find((b) => b.id === currentBackgroundId) ?? backgroundPacks[0];
    const currentMemories = useMemoryStore.getState().memories;

    const assistantId = addMessage({ role: "assistant", content: "" });
    const trigger = buildProactiveTrigger(new Date());

    const history = buildHistory(assistantId);
    // 距上次互动：用户最后一次发言的时间戳
    const lastInteractionAt = getLastInteractionAt();

    // 以最近一条用户消息为查询，召回知识库相关资料
    const lastUser =
      [...history].reverse().find((m) => m.role === "user")?.content ?? "";
    const contexts = retrieveTopK(lastUser, useKnowledgeStore.getState().entries);

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setStatus("generating");

    try {
      await streamChat({
        messages: [...history, { role: "user", content: trigger }],
        model: currentModel.apiModel,
        backgroundMode: currentBackground.mode,
        signal: controller.signal,
        memories: currentMemories.map((m) => m.content),
        contexts,
        lastInteractionAt,
        onDelta: (delta) => appendContent(assistantId, delta),
      });
    } catch (error) {
      const aborted =
        error instanceof DOMException && error.name === "AbortError";
      if (!aborted) {
        appendContent(assistantId, formatChatError(error));
      }
      proactiveSentRef.current = false; // 失败允许下次重试
    } finally {
      setStreaming(false);
      setStatus("connected");
      proactiveBusyRef.current = false;
    }
  }, [
    proactive,
    isStreaming,
    status,
    addMessage,
    appendContent,
    setStreaming,
    setStatus,
  ]);

  // 用户一发言就解除「不追发」限制
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      proactiveSentRef.current = false;
    }
  }, [messages]);

  // 首次进入且无历史：稍候让简璃主动开场
  useEffect(() => {
    if (!mounted || !proactive || messages.length > 0) return;
    const t = setTimeout(() => {
      void sendProactive();
    }, 2500);
    return () => clearTimeout(t);
  }, [mounted, proactive, messages.length, sendProactive]);

  // 空闲一段时间后主动搭话（定时器随消息活动重置；夜晚晚安类需要更久的静默）
  useEffect(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!mounted || !proactive || messages.length === 0 || isStreaming) return;
    const h = new Date().getHours();
    const isNight = h >= 21 || h < 3;
    const delay = isNight
      ? characterConfig.proactiveNightIdleMs
      : characterConfig.proactiveIdleMs;
    idleTimerRef.current = setTimeout(() => {
      void sendProactive();
    }, delay);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [mounted, proactive, messages, isStreaming, sendProactive]);

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
            src={characterConfig.avatar}
            alt=""
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10"
          />
          <div>
            <p className="text-sm font-semibold leading-tight">
              {characterConfig.name}
            </p>
            {characterConfig.tagline && (
              <p className="text-[11px] text-muted-foreground">
                {characterConfig.tagline}
              </p>
            )}
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
          onClick={() => setMemoryOpen(true)}
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label="记忆簿"
        >
          <BookHeart className="h-4 w-4" />
        </button>

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
                src={characterConfig.avatar}
                alt={characterConfig.displayName}
                className="h-24 w-24 rounded-full object-cover shadow-2xl shadow-primary/20 ring-4 ring-white/10"
              />
              <div className="space-y-2">
                <p className="text-lg font-medium">{characterConfig.greeting}</p>
                {characterConfig.companionTitle && (
                  <p className="text-sm text-muted-foreground">
                    {characterConfig.companionTitle}
                  </p>
                )}
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

          {messages.map((m, index) => {
            const prev = messages[index - 1];
            const showDateDivider = !prev || !isSameDay(prev.createdAt, m.createdAt);
            return (
              <Fragment key={m.id}>
                {showDateDivider && (
                  <div className="my-1 flex justify-center">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-muted-foreground">
                      {formatDateLabel(m.createdAt)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={m}
                  streaming={
                    isStreaming &&
                    index === messages.length - 1 &&
                    m.role === "assistant"
                  }
                />
              </Fragment>
            );
          })}

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
            className="glass max-h-40 min-h-[44px] flex-1 resize-none rounded-2xl bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 sm:text-sm"
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

      <MemoryDialog open={memoryOpen} onClose={() => setMemoryOpen(false)} />
    </main>
  );
}
