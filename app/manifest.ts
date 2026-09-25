import type { MetadataRoute } from "next";

/** PWA manifest：支持「添加到主屏幕」，像 App 一样全屏打开 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PERSONA · Iris — 白天高岭之花，回家只做你的网瘾宅女",
    short_name: "简璃",
    description: "你的合法妻子 简璃 · AI 虚拟伴侣",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0912",
    theme_color: "#0b0912",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
