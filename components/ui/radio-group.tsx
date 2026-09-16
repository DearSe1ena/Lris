"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
  badge?: string;
}

interface RadioGroupProps<T extends string> {
  options: RadioOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}

/** 卡片式单选组：选中项边框高亮 + 右上角勾选圆点 */
export function RadioGroup<T extends string>({
  options,
  value,
  onValueChange,
  className,
}: RadioGroupProps<T>) {
  return (
    <div role="radiogroup" className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "group relative flex flex-col gap-1.5 rounded-2xl border p-4 pr-10 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary/70 bg-primary/10 shadow-lg shadow-primary/10"
                : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]",
            )}
          >
            {option.badge && (
              <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2 py-0.5 text-[10px] font-medium text-white">
                {option.badge}
              </span>
            )}
            <span className="flex items-center gap-2 text-sm font-medium">
              {option.icon && (
                <span className={selected ? "text-primary" : "text-muted-foreground"}>
                  {option.icon}
                </span>
              )}
              {option.label}
            </span>
            {option.description && (
              <span className="text-xs text-muted-foreground">{option.description}</span>
            )}
            <span
              className={cn(
                "absolute bottom-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                selected
                  ? "border-primary bg-primary text-white"
                  : "border-white/20 text-transparent group-hover:border-white/40",
              )}
            >
              <Check className="h-3 w-3" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
