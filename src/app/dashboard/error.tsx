"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-sm font-medium text-foreground">
        エラーが発生しました
      </h2>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">
        {error.message || "データの取得中にエラーが発生しました。"}
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={reset}>
        再試行
      </Button>
    </div>
  );
}
