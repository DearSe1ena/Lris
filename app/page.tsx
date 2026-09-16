import { VisualPanel } from "@/components/console/visual-panel";
import { ControlPanel } from "@/components/console/control-panel";

/** 控制台主页：左 40% 人物视觉区 + 右 60% 配置控制区 */
export default function ConsolePage() {
  return (
    <main className="relative mx-auto flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground lg:max-w-[1440px] lg:flex-row lg:gap-4 lg:p-4">
      {/* 背景氛围光 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-[480px] w-[480px] rounded-full bg-primary/15 blur-[160px]"
      />
      <VisualPanel />
      <ControlPanel />
    </main>
  );
}
