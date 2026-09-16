"use client";

import type { ReactNode } from "react";
import { Sparkles, Zap } from "lucide-react";
import { modelOptions, type ModelId } from "@/config/character.config";
import { useConsoleStore } from "@/store/console-store";
import { RadioGroup } from "@/components/ui/radio-group";

const ICONS: Record<ModelId, ReactNode> = {
  "deepseek-pro": <Sparkles className="h-4 w-4" />,
  "deepseek-flash": <Zap className="h-4 w-4" />,
};

/** 模型选择：卡片式单选组，选中边框高亮 */
export function ModelSelect() {
  const modelId = useConsoleStore((s) => s.modelId);
  const setModel = useConsoleStore((s) => s.setModel);

  return (
    <RadioGroup<ModelId>
      value={modelId}
      onValueChange={setModel}
      options={modelOptions.map((m) => ({
        value: m.id,
        label: m.title,
        description: m.description,
        icon: ICONS[m.id],
        badge: m.badge,
      }))}
    />
  );
}
