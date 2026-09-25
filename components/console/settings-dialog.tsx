"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  KeyRound,
  Globe,
  RotateCcw,
  Wallet,
  ScanSearch,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useSettingsStore } from "@/store/settings-store";
import { useDialogLock } from "@/hooks/use-dialog-lock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

/** 把余额接口返回解析成可读文本（兼容 DeepSeek 官方格式，其他服务回退为 JSON 摘要） */
function formatBalance(data: unknown): string {
  const d = data as {
    balance_infos?: { total_balance?: string; currency?: string }[];
  };
  if (Array.isArray(d?.balance_infos) && d.balance_infos.length > 0) {
    return d.balance_infos
      .map((b) => `${b.total_balance ?? "?"} ${b.currency ?? ""}`.trim())
      .join(" / ");
  }
  return JSON.stringify(data).slice(0, 160);
}

/** API 设置弹窗：Key/接口/余额查询/模型检测/自定义模型管理（保存在本机浏览器） */
export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const baseURL = useSettingsStore((s) => s.baseURL);
  const customModels = useSettingsStore((s) => s.customModels);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setBaseURL = useSettingsStore((s) => s.setBaseURL);
  const addCustomModels = useSettingsStore((s) => s.addCustomModels);
  const removeCustomModel = useSettingsStore((s) => s.removeCustomModel);
  const reset = useSettingsStore((s) => s.reset);

  const [keyDraft, setKeyDraft] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const [saved, setSaved] = useState(false);

  // 余额
  const [balanceText, setBalanceText] = useState("");
  const [balanceError, setBalanceError] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);

  // 模型检测
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [detectError, setDetectError] = useState("");
  const [manualModel, setManualModel] = useState("");

  // 每次打开时同步当前存储值
  useEffect(() => {
    if (open) {
      setKeyDraft(apiKey);
      setUrlDraft(baseURL);
      setBalanceText("");
      setBalanceError("");
      setDetected([]);
      setPicked([]);
      setDetectError("");
      setSaved(false);
    }
  }, [open, apiKey, baseURL]);

  // Esc 关闭 + 锁定背景滚动（弹窗打开时）
  useDialogLock(open, onClose);

  if (!open) return null;

  const queryBalanceNow = async (key: string, url: string) => {
    setBalanceLoading(true);
    setBalanceError("");
    setBalanceText("");
    try {
      const res = await fetch("/api/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key, baseURL: url || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setBalanceText(formatBalance(data));
    } catch (error) {
      setBalanceError(error instanceof Error ? error.message : String(error));
    } finally {
      setBalanceLoading(false);
    }
  };

  const detectModels = async () => {
    const key = keyDraft.trim();
    if (!key) {
      setDetectError("请先填写 API Key");
      return;
    }
    setDetecting(true);
    setDetectError("");
    setDetected([]);
    setPicked([]);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key, baseURL: urlDraft.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const models: string[] = data.models ?? [];
      setDetected(models);
      setPicked(models);
    } catch (error) {
      setDetectError(error instanceof Error ? error.message : String(error));
    } finally {
      setDetecting(false);
    }
  };

  const togglePick = (m: string) =>
    setPicked((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  const addPicked = () => {
    if (picked.length === 0) return;
    addCustomModels(picked.map((m) => ({ id: `custom-${m}`, title: m, apiModel: m })));
    setDetected([]);
    setPicked([]);
  };

  const addManual = () => {
    const m = manualModel.trim();
    if (!m) return;
    addCustomModels([{ id: `custom-${m}`, title: m, apiModel: m }]);
    setManualModel("");
  };

  const handleSave = () => {
    const key = keyDraft.trim();
    const url = urlDraft.trim();
    setApiKey(key);
    setBaseURL(url);
    setSaved(true);
    if (key) void queryBalanceNow(key, url);
    setTimeout(() => setSaved(false), 2000);
  };

  // 用 portal 渲染到 body：脱离页面滚动容器，修复 iOS Safari 上
  // 弹窗被立绘区遮挡 / 无法滚动的问题
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="glass relative max-h-[88dvh] w-full max-w-md animate-fade-in overflow-y-auto overscroll-contain rounded-3xl p-6">
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
          配置保存在本机浏览器，仅随请求发送到你填写的地址。留空则使用服务端 .env.local 配置。
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
              接口地址（OpenAI 兼容根地址）
            </label>
            <Input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://api.deepseek.com（留空即可）"
              autoComplete="off"
            />
          </div>

          {/* 余额查询 */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" />
                余额查询
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void queryBalanceNow(keyDraft.trim(), urlDraft.trim())}
                disabled={balanceLoading || !keyDraft.trim()}
              >
                {balanceLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                查询余额
              </Button>
            </div>
            {balanceText && (
              <p className="mt-2 text-sm font-medium text-emerald-300">{balanceText}</p>
            )}
            {balanceError && (
              <p className="mt-2 break-all text-xs text-rose-300">{balanceError}</p>
            )}
          </div>

          {/* 模型检测 */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ScanSearch className="h-3.5 w-3.5" />
                检测可用模型
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void detectModels()}
                disabled={detecting}
              >
                {detecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {detecting ? "检测中…" : "检测"}
              </Button>
            </div>

            {detectError && (
              <p className="mt-2 break-all text-xs text-rose-300">{detectError}</p>
            )}

            {detected.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                  {detected.map((m) => {
                    const active = picked.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => togglePick(m)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                          active
                            ? "border-primary/70 bg-primary/15 text-foreground"
                            : "border-white/10 text-muted-foreground hover:border-white/25",
                        )}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
                <Button size="sm" onClick={addPicked} disabled={picked.length === 0}>
                  <Plus className="h-3.5 w-3.5" />
                  添加所选模型（{picked.length}）
                </Button>
              </div>
            )}

            {!detected.length && !detectError && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                接口若未开放 /models，可手动输入模型名添加。
              </p>
            )}

            <div className="mt-2 flex gap-2">
              <Input
                value={manualModel}
                onChange={(e) => setManualModel(e.target.value)}
                placeholder="手动输入模型名，如 deepseek-chat"
                className="h-8 text-xs"
              />
              <Button size="sm" variant="outline" onClick={addManual}>
                添加
              </Button>
            </div>
          </div>

          {/* 已添加的自定义模型 */}
          {customModels.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                已添加的自定义模型
              </p>
              {customModels.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <span className="text-xs">{m.apiModel}</span>
                  <button
                    onClick={() => removeCustomModel(m.id)}
                    className="text-muted-foreground transition-colors hover:text-rose-300"
                    aria-label={`移除 ${m.apiModel}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
          <div className="ml-auto flex items-center gap-2">
            {saved && <span className="text-xs text-emerald-300">已保存 ✓</span>}
            <Button variant="outline" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button size="sm" onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
