"use client";

import { create } from "zustand";
import {
  characterConfig,
  modelOptions,
  backgroundPacks,
  type ModelId,
  type BackgroundId,
} from "@/config/character.config";
import type { ConnectionStatus } from "@/types";

interface ConsoleState {
  status: ConnectionStatus;
  portraitId: string;
  modelId: ModelId;
  backgroundId: BackgroundId;
  /** 主动联系：连接后同步，不追发未回应的消息 */
  proactive: boolean;
  setPortrait: (id: string) => void;
  setModel: (id: ModelId) => void;
  setBackground: (id: BackgroundId) => void;
  toggleProactive: () => void;
  connect: () => void;
  disconnect: () => void;
  setStatus: (status: ConnectionStatus) => void;
}

export const useConsoleStore = create<ConsoleState>()((set) => ({
  status: "idle",
  portraitId: characterConfig.defaultPortraitId,
  modelId: modelOptions[0].id,
  backgroundId: backgroundPacks[0].id,
  proactive: true,

  setPortrait: (portraitId) => set({ portraitId }),
  setModel: (modelId) => set({ modelId }),
  setBackground: (backgroundId) => set({ backgroundId }),
  toggleProactive: () => set((state) => ({ proactive: !state.proactive })),
  connect: () => set({ status: "connected" }),
  disconnect: () => set({ status: "idle" }),
  setStatus: (status) => set({ status }),
}));
