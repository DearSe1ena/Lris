"use client";

import { useEffect } from "react";

/**
 * 弹窗打开的通用副作用：Esc 关闭 + 锁定背景滚动（关闭时自动还原）。
 * 供 memory-dialog / settings-dialog 等复用，避免重复实现。
 */
export function useDialogLock(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
}
