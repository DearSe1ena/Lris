import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** 合并 className，支持 Tailwind 冲突覆盖 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** 格式化时间 HH:MM（24 小时制，补零），用于每条消息的时间角标 */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 格式化日期分隔符：跨年显示「YYYY年M月D日」，否则「M月D日」 */
export function formatDateLabel(ts: number): string {
  const d = new Date(ts);
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  return d.getFullYear() === new Date().getFullYear()
    ? md
    : `${d.getFullYear()}年${md}`;
}

/** 判断两个时间戳是否落在同一天（用于聊天里跨天插入日期分隔） */
export function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
