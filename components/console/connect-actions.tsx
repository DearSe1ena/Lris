"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Cable, Unplug, Settings2 } from "lucide-react";
import { useConsoleStore } from "@/store/console-store";
import { characterConfig } from "@/config/character.config";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsDialog } from "@/components/console/settings-dialog";

/** 核心操作区：连接按钮 + 停止连接 + API 设置 + 主动联系开关 */
export function ConnectActions() {
  const router = useRouter();
  const status = useConsoleStore((s) => s.status);
  const proactive = useConsoleStore((s) => s.proactive);
  const toggleProactive = useConsoleStore((s) => s.toggleProactive);
  const connect = useConsoleStore((s) => s.connect);
  const disconnect = useConsoleStore((s) => s.disconnect);
  const settingsOpen = useConsoleStore((s) => s.settingsOpen);
  const openSettings = useConsoleStore((s) => s.openSettings);
  const closeSettings = useConsoleStore((s) => s.closeSettings);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    if (connecting || status === "generating") return;
    setConnecting(true);
    connect();
    // 短暂过渡动画后进入聊天室
    setTimeout(() => {
      setConnecting(false);
      router.push("/chat");
    }, 700);
  };

  const handleDisconnect = () => {
    if (connecting) return;
    disconnect();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="gradient"
          size="lg"
          className="px-8"
          onClick={handleConnect}
          disabled={connecting || status === "generating"}
        >
          {connecting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Cable className="h-5 w-5" />
          )}
          {connecting ? "正在连接…" : `连接 ${characterConfig.name}`}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleDisconnect}
          disabled={connecting || status === "idle"}
          className="hover:border-rose-400/50 hover:text-rose-300"
        >
          <Unplug className="h-5 w-5" />
          停止连接
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="ml-auto h-12 w-12 rounded-2xl"
          onClick={openSettings}
          aria-label="API 设置"
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="glass flex items-center justify-between gap-4 rounded-2xl p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">主动联系</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            连接后同步，不追发未回应的消息
          </p>
        </div>
        <Switch
          checked={proactive}
          onCheckedChange={toggleProactive}
          aria-label="主动联系"
        />
      </div>

      <SettingsDialog open={settingsOpen} onClose={closeSettings} />
    </div>
  );
}
