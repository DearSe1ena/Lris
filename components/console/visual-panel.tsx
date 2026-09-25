"use client";

import { useConsoleStore } from "@/store/console-store";
import { characterConfig, type Portrait } from "@/config/character.config";
import { cn } from "@/lib/utils";

/** 主视觉媒体：支持静态图（Ken Burns 缓慢推近拉远 / 完整显示）与动态立绘（视频循环 / 动图） */
function PortraitMedia({ portrait }: { portrait: Portrait }) {
  const className = "absolute inset-0 h-full w-full object-cover";
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(portrait.motion ?? "");
  const fit = portrait.fit ?? "cover";

  if (isVideo && portrait.motion) {
    return (
      <video
        src={portrait.motion}
        autoPlay
        muted
        loop
        playsInline
        className={className}
      />
    );
  }

  if (fit === "contain") {
    return (
      <>
        {/* 模糊衬底：填充完整显示时两侧的留白 */}
        <img
          src={portrait.src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 animate-ken-burns object-cover blur-2xl opacity-40"
        />
        {/* 整张完整显示：头、腿全部可见 */}
        <img
          src={portrait.src}
          alt={portrait.alt}
          className="absolute inset-0 h-full w-full object-contain"
        />
      </>
    );
  }

  return (
    <img
      src={portrait.motion ?? portrait.src}
      alt={portrait.alt}
      className={cn(className, !portrait.motion && "animate-ken-burns")}
    />
  );
}

/**
 * 左侧人物视觉展示区（桌面端占 40% 宽度）：
 * 全屏大图（微动效）+ 呼吸氛围光 + 左上品牌区 + 左下标题区 + 底部立绘缩略图切换（默认 3 个，自适应均分）。
 */
export function VisualPanel() {
  const portraitId = useConsoleStore((s) => s.portraitId);
  const setPortrait = useConsoleStore((s) => s.setPortrait);
  const portrait =
    characterConfig.portraits.find((p) => p.id === portraitId) ??
    characterConfig.portraits[0];

  return (
    <section className="relative h-[42dvh] w-full shrink-0 overflow-hidden lg:h-auto lg:w-[28%] lg:rounded-3xl lg:border lg:border-white/10 lg:shadow-2xl lg:shadow-black/40">
      {/* 主视觉大图（object-cover 自适应裁切 + 微动效） */}
      <div key={portrait.id} className="absolute inset-0 animate-fade-in">
        <PortraitMedia portrait={portrait} />
      </div>

      {/* 呼吸氛围光（缓慢明暗） */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-glow-breathe bg-[radial-gradient(ellipse_at_50%_35%,hsl(var(--primary)/0.16),transparent_62%)]"
      />

      {/* 遮罩渐变，保证文字可读（底部略柔和，避免遮住完整显示的腿部） */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30" />

      {/* 左上品牌区 */}
      <header className="absolute left-6 top-6 z-10 lg:left-8 lg:top-8">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.4em] text-white/55">
          <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-gradient-to-r from-red-400 to-amber-400" />
          A / Persona
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-wide text-white">
          {characterConfig.name}
        </h1>
        <p className="mt-1 text-xs tracking-widest text-white/70">
          {characterConfig.tagline}
        </p>
      </header>

      {/* 左下标题区（轻浮动） */}
      <div className="absolute bottom-32 left-6 z-10 animate-float lg:bottom-36 lg:left-8">
        <h2 className="text-5xl font-bold tracking-wide text-white drop-shadow-lg lg:text-6xl">
          {characterConfig.displayName}
        </h2>
        {characterConfig.companionTitle && (
          <p className="mt-2 text-sm tracking-widest text-white/75">
            {characterConfig.companionTitle}
          </p>
        )}
      </div>

      {/* 底部缩略图切换（居中放大） */}
      <div className="absolute bottom-6 left-6 right-6 z-10 flex justify-center gap-4 lg:left-8 lg:right-8">
        {characterConfig.portraits.map((p) => {
          const active = p.id === portraitId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPortrait(p.id)}
              aria-label={`切换至${p.label}`}
              className={cn(
                "group relative min-w-0 flex-1 overflow-hidden rounded-2xl border transition-all duration-300",
                active
                  ? "border-white/90 shadow-lg shadow-black/40 ring-2 ring-white/40"
                  : "border-white/15 opacity-70 hover:opacity-100",
              )}
            >
              <img
                src={p.src}
                alt={p.alt}
                style={p.thumbPosition ? { objectPosition: p.thumbPosition } : undefined}
                className="h-20 w-full object-cover transition-transform duration-300 group-hover:scale-105 lg:h-24"
              />
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent py-1 text-center text-[11px] font-medium",
                  active ? "text-white" : "text-white/80",
                )}
              >
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
