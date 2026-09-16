"use client";

import { useEffect, useState } from "react";
import { X, KeyRound, Globe, RotateCcw } from "lucide-react";
import { useSettingsStore } from "@/store/settings-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

/** API 设置弹窗：填写不同的 API Key / 接口地址（保存在本机浏览器） */
export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const baseURL = useSettingsStore((s) => s.baseURL);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setBaseURL = useSettingsStore((s) => s.setBaseURL);
  const reset = useSettingsStore((s) => s.reset);

  const [keyDraft, setKeyDraft] = useState("");
  const [urlDraft, setUrlDraft] = useState("");

  // 每次打开时同步当前存储值
  useEffect(() => {
    if (open) {
      setKeyDraft(apiKey);
      setUrlDraft(baseURL);
    }
  }, [open, apiKey, baseURL]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="glass relative w-full max-w-md animate-fade-in rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">API 设置</h3>
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
          配置保存在本机浏览器，仅随聊天请求发送到你填写的地址。留空则使用服务端 .env.local 中的配置。
        </p>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5" />
              API Key
            </label>
            <Input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="sk-..."
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              接口地址（OpenAI 兼容）
            </label>
            <Input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://api.deepseek.com/chat/completions"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setKeyDraft("");
              setUrlDraft("");
              reset();
            }}
            className="text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            恢复默认
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setApiKey(keyDraft.trim());
                setBaseURL(urlDraft.trim());
                onClose();
              }}
            >
              保存
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
