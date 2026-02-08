"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function LinearLogo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-foreground"
    >
      <path
        d="M1.22541 61.5228C0.444112 60.5535 0.444112 59.1451 1.22541 58.1758L14.3374 42.4311C15.1187 41.4618 16.5271 41.2716 17.4964 42.0529L55.0875 72.6313C56.0568 73.4126 56.247 74.821 55.4657 75.7903L42.3537 91.535C41.5724 92.5043 40.164 92.6945 39.1947 91.9132L1.22541 61.5228Z"
        fill="currentColor"
      />
      <path
        d="M14.6607 19.5749C13.5949 18.7553 13.4046 17.2129 14.2242 16.1471L27.5765 0.162432C28.3962 -0.903381 29.9385 -1.09369 31.0043 -0.274057L98.7747 52.4271C99.8405 53.2468 100.031 54.7891 99.2113 55.8549L85.859 71.8396C85.0393 72.9054 83.497 73.0957 82.4312 72.2761L14.6607 19.5749Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    auth_failed: "認証に失敗しました。もう一度お試しください。",
    token_exchange_failed: "トークンの取得に失敗しました。",
    session_expired: "セッションの有効期限が切れました。",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border shadow-sm">
              <LinearLogo />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Linear Dashboard
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                チームのパフォーマンスを可視化
              </p>
            </div>
          </div>

          {error && (
            <div className="w-full rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">
                {errorMessages[error] ?? "エラーが発生しました。"}
              </p>
            </div>
          )}

          <Button
            className="w-full h-11 font-medium"
            onClick={() => {
              window.location.href = "/api/auth/login";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path
                d="M1.22541 61.5228C0.444112 60.5535 0.444112 59.1451 1.22541 58.1758L14.3374 42.4311C15.1187 41.4618 16.5271 41.2716 17.4964 42.0529L55.0875 72.6313C56.0568 73.4126 56.247 74.821 55.4657 75.7903L42.3537 91.535C41.5724 92.5043 40.164 92.6945 39.1947 91.9132L1.22541 61.5228Z"
                fill="currentColor"
              />
              <path
                d="M14.6607 19.5749C13.5949 18.7553 13.4046 17.2129 14.2242 16.1471L27.5765 0.162432C28.3962 -0.903381 29.9385 -1.09369 31.0043 -0.274057L98.7747 52.4271C99.8405 53.2468 100.031 54.7891 99.2113 55.8549L85.859 71.8396C85.0393 72.9054 83.497 73.0957 82.4312 72.2761L14.6607 19.5749Z"
                fill="currentColor"
              />
            </svg>
            Sign in with Linear
          </Button>

          <p className="text-xs text-muted-foreground/60 text-center">
            Linear アカウントで認証し、チームデータにアクセスします
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
