import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PERSONA · Rin — 才不是特意为你准备的",
  description: "你的专属大小姐 · AI 虚拟伴侣控制台",
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
