import type { MetadataRoute } from "next";

/** PWA manifest：支持「添加到主屏幕」，像 App 一样全屏打开 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PERSONA · Rin — 才不是特意为你准备的",
    short_name: "凛",
    description: "你的专属大小姐 · AI 虚拟伴侣",
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
