"use client";

import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: ReactNode;
  value: string;
  subtitle?: string;
  previousValue?: number | null;
  currentValue?: number;
  invertTrend?: boolean;
  loading?: boolean;
  accentColor?: "blue" | "green" | "amber" | "rose";
}

const ACCENT_STYLES = {
  blue: "border-l-chart-1",
  green: "border-l-chart-2",
  amber: "border-l-chart-3",
  rose: "border-l-chart-5",
} as const;

function TrendIndicator({
  previousValue,
  currentValue,
  invertTrend = false,
}: {
  previousValue: number | null | undefined;
  currentValue: number | undefined;
  invertTrend?: boolean;
}) {
  if (previousValue == null || currentValue == null) {
    return null;
  }

  const diff = currentValue - previousValue;
  if (Math.abs(diff) < 0.01) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>変化なし</span>
      </div>
    );
  }

  const isPositive = diff > 0;
  const isGood = invertTrend ? !isPositive : isPositive;
  const percentage = previousValue !== 0
    ? Math.abs((diff / previousValue) * 100)
    : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isGood ? "text-emerald-500" : "text-rose-500"
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>
        {percentage > 0 ? `${percentage.toFixed(0)}%` : ""}
        {isPositive ? " 増加" : " 減少"}
      </span>
    </div>
  );
}

export function KpiCard({
  title,
  value,
  subtitle,
  previousValue,
  currentValue,
  invertTrend = false,
  loading = false,
  accentColor = "blue",
}: KpiCardProps) {
  if (loading) {
    return (
      <Card className="border-l-2 border-l-muted py-4">
        <CardContent className="space-y-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-l-2 py-4 transition-colors hover:bg-card/80",
        ACCENT_STYLES[accentColor]
      )}
    >
      <CardContent className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold tracking-tight text-card-foreground">
          {value}
        </p>
        <div className="flex items-center justify-between">
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          <TrendIndicator
            previousValue={previousValue}
            currentValue={currentValue}
            invertTrend={invertTrend}
          />
        </div>
      </CardContent>
    </Card>
  );
}
