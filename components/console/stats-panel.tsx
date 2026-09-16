"use client";

import { characterConfig } from "@/config/character.config";
import { MessageSquare, Cpu, Clock } from "lucide-react";

const ICONS = [MessageSquare, Cpu, Clock];

/** 横向数据统计面板（占位数据，来自 character.config.ts 的 stats） */
export function StatsPanel() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {characterConfig.stats.map((stat, index) => {
        const Icon = ICONS[index % ICONS.length];
        return (
          <div key={stat.label} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-xs">{stat.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{stat.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{stat.hint}</p>
          </div>
        );
      })}
    </div>
  );
}
