import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-6xl font-bold text-muted-foreground/20">404</p>
        <h1 className="mt-2 text-sm font-medium text-foreground">
          ページが見つかりません
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          リクエストされたページは存在しません。
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/dashboard">ダッシュボードに戻る</Link>
        </Button>
      </div>
    </div>
  );
}
