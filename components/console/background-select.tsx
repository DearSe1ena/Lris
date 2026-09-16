"use client";

import type { ReactNode } from "react";
import { Layers, Feather } from "lucide-react";
import { backgroundPacks, type BackgroundId } from "@/config/character.config";
import { useConsoleStore } from "@/store/console-store";
import { RadioGroup } from "@/components/ui/radio-group";

const ICONS: Record<BackgroundId, ReactNode> = {
  full: <Layers className="h-4 w-4" />,
  lite: <Feather className="h-4 w-4" />,
};

/** 背景包选择：影响请求时传给 API 的 System Prompt 长度 */
export function BackgroundSelect() {
  const backgroundId = useConsoleStore((s) => s.backgroundId);
  const setBackground = useConsoleStore((s) => s.setBackground);

  return (
    <RadioGroup<BackgroundId>
      value={backgroundId}
      onValueChange={setBackground}
      options={backgroundPacks.map((b) => ({
        value: b.id,
        label: b.label,
        description: b.description,
        icon: ICONS[b.id],
      }))}
    />
  );
}
