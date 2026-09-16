"use client";

import { characterConfig } from "@/config/character.config";
import { useConsoleStore } from "@/store/console-store";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/types";

const STATUS_META: Record<
  ConnectionStatus,
  { label: string; dot: string; text: string; pulse: boolean }
> = {
  idle: { label: "未连接", dot: "bg-zinc-500", text: "text-zinc-400", pulse: false },
  connected: { label: "已连接", dot: "bg-emerald-400", text: "text-emerald-300", pulse: true },
  generating: { label: "生成中", dot: "bg-amber-400", text: "text-amber-300", pulse: true },
};

/** 顶部状态栏：与 [人物名] 的日常 + 连接状态指示器 */
export function StatusBar() {
  const status = useConsoleStore((s) => s.status);
  const meta = STATUS_META[status];

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-wide">
          与 {characterConfig.displayName} 的日常
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          选择人物模型与背景，备好就连接。
        </p>
      </div>
      <div
        className={cn(
          "glass flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
          meta.text,
        )}
      >
        <span
          className={cn("h-2 w-2 rounded-full", meta.dot, meta.pulse && "animate-pulse-dot")}
        />
        {meta.label}
      </div>
    </div>
  );
}
