"use client";

import { create } from "zustand";
import {
  characterConfig,
  backgroundPacks,
  type BackgroundId,
} from "@/config/character.config";
import type { ConnectionStatus } from "@/types";

interface ConsoleState {
  status: ConnectionStatus;
  portraitId: string;
  modelId: string;
  backgroundId: BackgroundId;
  /** 主动联系：连接后同步，不追发未回应的消息 */
  proactive: boolean;
  /** API 设置弹窗开关（供「其他」模型卡片等处打开） */
  settingsOpen: boolean;
  setPortrait: (id: string) => void;
  setModel: (id: string) => void;
  setBackground: (id: BackgroundId) => void;
  toggleProactive: () => void;
  connect: () => void;
  disconnect: () => void;
  setStatus: (status: ConnectionStatus) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useConsoleStore = create<ConsoleState>()((set) => ({
  status: "idle",
  portraitId: characterConfig.defaultPortraitId,
  modelId: "deepseek-flash",
  backgroundId: backgroundPacks[0].id,
  proactive: true,
  settingsOpen: false,

  setPortrait: (portraitId) => set({ portraitId }),
  setModel: (modelId) => set({ modelId }),
  setBackground: (backgroundId) => set({ backgroundId }),
  toggleProactive: () => set((state) => ({ proactive: !state.proactive })),
  connect: () => set({ status: "connected" }),
  disconnect: () => set({ status: "idle" }),
  setStatus: (status) => set({ status }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
