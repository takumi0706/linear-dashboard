"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export const GLOSSARY: Record<string, string> = {
  キャリーオーバー率:
    "前のサイクルで完了できず、次のサイクルに持ち越されたイシューの割合。高いほど見積もり精度やスコープ管理に課題がある可能性があります。",
  スコープクリープ:
    "サイクル開始後にスコープ（対象イシュー数やポイント）が増加すること。計画時より多くの作業が追加された度合いを示します。",
  WIP:
    "Work In Progress の略。現在進行中（In Progress）のイシュー数。多すぎるとマルチタスクによる効率低下を招きます。",
  WIPリミット:
    "同時に進行中にできるイシュー数の上限。一般的にチームメンバー数×2が推奨されます。超過するとコンテキストスイッチが増え生産性が低下します。",
  サイクルタイム:
    "イシューが「着手（In Progress）」になってから「完了（Done）」になるまでの営業日数。短いほど作業効率が高いことを示します。",
  リードタイム:
    "イシューが「作成」されてから「完了」になるまでの営業日数。バックログでの待ち時間も含むため、サイクルタイムより長くなります。",
  スループット:
    "一定期間内に完了したイシューの数。チームの処理能力を示す指標です。",
  ベロシティ:
    "サイクルごとに完了したストーリーポイントの合計。チームの作業キャパシティを測る指標として使われます。",
  バーンダウン:
    "サイクル中の残作業量の推移を示すチャート。理想ライン（直線的に減少）と実際の進捗を比較してスケジュールの遅延を可視化します。",
  バーンアップ:
    "完了済み作業量の累積推移を示すチャート。スコープの変化（増減）と完了の進捗を同時に確認できます。",
  "累積フローダイアグラム（CFD）":
    "各ステータスのイシュー数を積み上げた時系列チャート。バンド幅が一定なら安定したフロー、広がっていればボトルネックの兆候です。",
  滞留時間:
    "イシューが特定のステータスに留まっている平均日数。異常に長い場合はそのステータスがボトルネックになっている可能性があります。",
  完了率:
    "現在のサイクルにおける、全スコープに対する完了済みの割合。サイクルの進捗度合いを示します。",
  パーセンタイル:
    "データを小さい順に並べた時、下から何%の位置にあるかを示す指標。85thなら全体の85%がその値以下であることを意味します。",
};

interface TermTooltipProps {
  term: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export function TermTooltip({
  term,
  children,
  showIcon = true,
}: TermTooltipProps) {
  const description = GLOSSARY[term];

  if (!description) {
    return <>{children ?? term}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-0.5 cursor-help border-b border-dotted border-muted-foreground/40">
            {children ?? term}
            {showIcon && (
              <HelpCircle className="inline h-3 w-3 text-muted-foreground/50 shrink-0" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          <p className="font-medium mb-0.5">{term}</p>
          <p className="text-muted-foreground">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// --- 自動注釈コンポーネント ---
// テキスト中の GLOSSARY 用語を自動検出して TermTooltip で囲む

// 長い用語から先にマッチさせるためソート済みのキー配列
const SORTED_TERMS = Object.keys(GLOSSARY).sort(
  (a, b) => b.length - a.length
);

// 全用語を OR でつないだ正規表現（長い順でマッチ優先）
const TERM_REGEX = new RegExp(`(${SORTED_TERMS.map(escapeRegex).join("|")})`, "g");

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface AnnotatedTextProps {
  text: string;
}

export function AnnotatedText({ text }: AnnotatedTextProps) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = 0;

  // 全マッチを走査
  const regex = new RegExp(TERM_REGEX.source, "g");
  let match = regex.exec(text);

  while (match !== null) {
    const term = match[0];
    const start = match.index;

    // マッチ前のテキスト
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    // 用語をツールチップで囲む
    parts.push(
      <TermTooltip key={`term-${matchIndex}`} term={term} showIcon={false} />
    );

    lastIndex = start + term.length;
    matchIndex += 1;
    match = regex.exec(text);
  }

  // 残りのテキスト
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
