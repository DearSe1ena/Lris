"use client";

import { Info } from "lucide-react";
import { characterConfig } from "@/config/character.config";
import { StatusBar } from "@/components/console/status-bar";
import { StatsPanel } from "@/components/console/stats-panel";
import { ModelSelect } from "@/components/console/model-select";
import { BackgroundSelect } from "@/components/console/background-select";
import { ConnectActions } from "@/components/console/connect-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** 右侧控制与配置区（桌面端占 60% 宽度） */
export function ControlPanel() {
  return (
    <section className="relative z-10 flex-1 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 p-6 lg:justify-center lg:py-10">
        <StatusBar />

        <StatsPanel />

        <Card>
          <CardHeader>
            <CardTitle>选择模型</CardTitle>
            <CardDescription>
              决定 {characterConfig.displayName} 回应的速度与深度
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModelSelect />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>选择背景包</CardTitle>
            <CardDescription>
              完整背景携带完整人格与成长设定；精简背景更省 Token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BackgroundSelect />
          </CardContent>
        </Card>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          同一人物仅保持一条连接；聊天记录保存在本地浏览器中，清除站点数据即清空。
        </p>

        <ConnectActions />
      </div>
    </section>
  );
}
