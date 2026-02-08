"use client";

import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import type { InsightMessage } from "@/lib/linear/types";
import { AnnotatedText } from "@/components/shared/term-tooltip";
import { cn } from "@/lib/utils";

const INSIGHT_STYLES = {
  success: {
    bg: "bg-emerald-500/5 border-emerald-500/20",
    icon: "text-emerald-500",
    title: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    bg: "bg-amber-500/5 border-amber-500/20",
    icon: "text-amber-500",
    title: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    bg: "bg-rose-500/5 border-rose-500/20",
    icon: "text-rose-500",
    title: "text-rose-600 dark:text-rose-400",
  },
  info: {
    bg: "bg-blue-500/5 border-blue-500/20",
    icon: "text-blue-500",
    title: "text-blue-600 dark:text-blue-400",
  },
} as const;

const INSIGHT_ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
} as const;

interface InsightBannerProps {
  insights: InsightMessage[];
}

export function InsightBanner({ insights }: InsightBannerProps) {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      {insights.map((insight, index) => {
        const style = INSIGHT_STYLES[insight.type];
        const Icon = INSIGHT_ICONS[insight.type];

        return (
          <div
            key={`${insight.type}-${index}`}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-4 py-3",
              style.bg
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.icon)} />
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", style.title)}>
                <AnnotatedText text={insight.title} />
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                <AnnotatedText text={insight.message} />
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
