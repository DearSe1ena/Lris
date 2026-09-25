import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PERSONA · Iris — 白天高岭之花，回家只做你的网瘾宅女",
  description: "你的合法妻子 简璃 · AI 虚拟伴侣控制台",
  appleWebApp: {
    capable: true,
    title: "简璃",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

/** 移动端（iOS Safari）适配：安全区 + 键盘弹出时收缩视口，避免输入框被键盘遮挡 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
