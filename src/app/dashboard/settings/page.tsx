"use client";

import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTeams } from "@/hooks/use-linear-data";
import { useSettings, REFRESH_OPTIONS } from "@/hooks/use-settings";
import { useTeamContext } from "@/contexts/team-context";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: teams } = useTeams();
  const { settings, updateSettings, loaded } = useSettings();
  const { teamId } = useTeamContext();

  if (!loaded) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">設定</h1>
        <p className="text-sm text-muted-foreground">
          ダッシュボードの表示やデータ更新をカスタマイズ
        </p>
      </div>

      {/* Team Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">チーム設定</CardTitle>
          <CardDescription className="text-xs">
            デフォルトで表示するチームを選択します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm">デフォルトチーム</label>
            <Select
              value={settings.defaultTeamId ?? "auto"}
              onValueChange={(v) =>
                updateSettings({ defaultTeamId: v === "auto" ? null : v })
              }
            >
              <SelectTrigger className="w-48 h-9 text-xs">
                <SelectValue placeholder="自動" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto" className="text-xs">
                  自動（最初のチーム）
                </SelectItem>
                {teams?.map((team) => (
                  <SelectItem key={team.id} value={team.id} className="text-xs">
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {teamId && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              現在のチーム:
              <Badge variant="secondary" className="text-[10px]">
                {teams?.find((t) => t.id === teamId)?.name ?? teamId}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">表示設定</CardTitle>
          <CardDescription className="text-xs">
            テーマや外観をカスタマイズします
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <label className="text-sm">テーマ</label>
            <div className="flex gap-1 rounded-lg border border-border p-1">
              <ThemeButton
                icon={<Sun className="h-3.5 w-3.5" />}
                label="ライト"
                active={theme === "light"}
                onClick={() => setTheme("light")}
              />
              <ThemeButton
                icon={<Moon className="h-3.5 w-3.5" />}
                label="ダーク"
                active={theme === "dark"}
                onClick={() => setTheme("dark")}
              />
              <ThemeButton
                icon={<Monitor className="h-3.5 w-3.5" />}
                label="システム"
                active={theme === "system"}
                onClick={() => setTheme("system")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Refresh */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">データ更新</CardTitle>
          <CardDescription className="text-xs">
            自動更新の間隔を設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm">自動更新間隔</label>
            <Select
              value={String(settings.refreshInterval)}
              onValueChange={(v) =>
                updateSettings({ refreshInterval: Number(v) })
              }
            >
              <SelectTrigger className="w-32 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={String(opt.value)}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            ヘッダーのリフレッシュボタンで手動更新も可能です
          </p>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Linear Dashboard v0.1.0</p>
        <p>Next.js 16 + shadcn/ui + Recharts</p>
      </div>
    </div>
  );
}

function ThemeButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
