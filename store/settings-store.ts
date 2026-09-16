"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomModel } from "@/types";

interface SettingsState {
  /** 页面中填写的 API Key；留空则回退到服务端 .env.local */
  apiKey: string;
  /** 页面中填写的接口地址；留空则回退到服务端默认地址 */
  baseURL: string;
  /** 通过「检测可用模型」添加的自定义模型 */
  customModels: CustomModel[];
  setApiKey: (value: string) => void;
  setBaseURL: (value: string) => void;
  addCustomModels: (models: CustomModel[]) => void;
  removeCustomModel: (id: string) => void;
  reset: () => void;
}

/** API 设置：保存在本机浏览器 localStorage（key: rin-settings-v1） */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: "",
      baseURL: "",
      customModels: [],

      setApiKey: (apiKey) => set({ apiKey }),
      setBaseURL: (baseURL) => set({ baseURL }),

      addCustomModels: (models) =>
        set((state) => ({
          customModels: [
            ...state.customModels,
            ...models.filter(
              (m) => !state.customModels.some((e) => e.apiModel === m.apiModel),
            ),
          ],
        })),

      removeCustomModel: (id) =>
        set((state) => ({
          customModels: state.customModels.filter((m) => m.id !== id),
        })),

      reset: () => set({ apiKey: "", baseURL: "", customModels: [] }),
    }),
    { name: "rin-settings-v1" },
  ),
);
