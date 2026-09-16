"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  /** 页面中填写的 API Key；留空则回退到服务端 .env.local */
  apiKey: string;
  /** 页面中填写的接口地址；留空则回退到服务端默认地址 */
  baseURL: string;
  setApiKey: (value: string) => void;
  setBaseURL: (value: string) => void;
  reset: () => void;
}

/** API 设置：保存在本机浏览器 localStorage（key: rin-settings-v1） */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: "",
      baseURL: "",
      setApiKey: (apiKey) => set({ apiKey }),
      setBaseURL: (baseURL) => set({ baseURL }),
      reset: () => set({ apiKey: "", baseURL: "" }),
    }),
    { name: "rin-settings-v1" },
  ),
);
