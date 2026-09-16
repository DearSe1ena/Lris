"use client";

import type { ReactNode } from "react";
import { Sparkles, Zap, Plus } from "lucide-react";
import { modelOptions } from "@/config/character.config";
import { useConsoleStore } from "@/store/console-store";
import { useSettingsStore } from "@/store/settings-store";
import { RadioGroup } from "@/components/ui/radio-group";

const ICONS: Record<string, ReactNode> = {
  "deepseek-pro": <Sparkles className="h-4 w-4" />,
  "deepseek-flash": <Zap className="h-4 w-4" />,
};

/** 模型选择：卡片式单选组 + 自定义模型 + 「其他」检测入口 */
export function ModelSelect() {
  const modelId = useConsoleStore((s) => s.modelId);
  const setModel = useConsoleStore((s) => s.setModel);
  const openSettings = useConsoleStore((s) => s.openSettings);
  const customModels = useSettingsStore((s) => s.customModels);

  const options = [
    ...modelOptions.map((m) => ({
      value: m.id,
      label: m.title,
      description: m.description,
      icon: ICONS[m.id] ?? <Sparkles className="h-4 w-4" />,
      badge: m.badge,
    })),
    ...customModels.map((c) => ({
      value: c.id,
      label: c.title,
      description: "自定义模型",
      icon: <Sparkles className="h-4 w-4" />,
    })),
  ];

  return (
    <div className="space-y-3">
      <RadioGroup<string>
        value={modelId}
        onValueChange={setModel}
        options={options}
      />
      <button
        type="button"
        onClick={openSettings}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-transparent p-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        其他（输入你的 API，检测可用模型）
      </button>
    </div>
  );
}
