# Linear Dashboard - 仕様書

## 1. プロジェクト概要

### 1.1 目的
Linearのデータを活用し、プロジェクトの進行状況、チームの生産性、ワークフローの健全性を可視化するダッシュボードアプリケーションを構築する。

### 1.2 対象ユーザー
- チーム内の少人数（5〜15名程度）
- エンジニアリングマネージャー、テックリード、チームメンバー

### 1.3 解決する課題
- 誰がどのくらいイシューを捌いているかの可視化
- サイクル中のイシュー作成数と消化数の把握
- プロジェクト全体の進行状況の一目での理解
- ワークフローのボトルネック検出
- データに基づいた振り返り・改善のサポート

---

## 2. 技術スタック

| カテゴリ | 技術 | 理由 |
|---|---|---|
| **フレームワーク** | Next.js 16 (App Router) | API Routes統合、SSR、Turbopackデフォルト、Vercelデプロイとの親和性 |
| **言語** | TypeScript 5+ (strict mode) | 型安全性、any型・型アサーション禁止 |
| **UIライブラリ** | shadcn/ui + Tailwind CSS v4 | カスタマイズ性、モダンデザイン、ダークモード対応 |
| **チャート** | Recharts | Reactネイティブ、shadcn/uiとの統合容易、豊富なチャートタイプ |
| **認証** | Linear OAuth2 (PKCE) | チーム共有向け、セキュア |
| **データフェッチ** | Linear GraphQL API + @linear/sdk | 公式SDK、型定義完備 |
| **状態管理** | TanStack Query (React Query) | サーバーステート管理、キャッシュ、自動リフェッチ |
| **React** | React 19.2 | View Transitions、React Compiler安定版 |
| **ランタイム** | Node.js 20.9+ | Next.js 16の最低要件 |
| **バンドラー** | Turbopack（デフォルト） | 2-5x高速ビルド、最大10x高速なFast Refresh |
| **デプロイ** | Vercel | Next.jsとの親和性最高、CI/CD自動化 |
| **テーマ** | ライト/ダーク切り替え | next-themes |

### 2.1 Next.js 16 の主要な変更点（仕様に影響するもの）

| 変更点 | 影響 |
|---|---|
| `middleware.ts` → `proxy.ts` に改名 | 認証ミドルウェアは `proxy.ts` で実装 |
| `"use cache"` ディレクティブ（Cache Components） | 明示的なキャッシュ制御で Linear API レスポンスをキャッシュ |
| `await params` / `await searchParams` が必須 | 全ての動的ルートで非同期アクセス |
| `await cookies()` / `await headers()` | 認証トークン取得が非同期に |
| `next lint` 削除 | ESLint / Biome を直接使用 |
| React Compiler 安定版 | `reactCompiler: true` で自動メモ化 |
| Turbopack デフォルト | ビルド高速化、webpack は `--webpack` フラグで使用可能 |

---

## 3. 認証・認可

### 3.1 Linear OAuth2 フロー

```
[ユーザー] → [ダッシュボード /login] → [Linear OAuth authorize]
                                              ↓
[ダッシュボード /api/auth/callback] ← [Authorization Code]
                                              ↓
                                    [Token Exchange (PKCE)]
                                              ↓
                                    [Access Token + Refresh Token]
                                              ↓
                                    [セッションCookieに保存]
```

### 3.2 認証の詳細

| 項目 | 値 |
|---|---|
| Authorize URL | `https://linear.app/oauth/authorize` |
| Token URL | `https://api.linear.app/oauth/token` |
| Scopes | `read` (読み取り専用) |
| 認証フロー | Authorization Code + PKCE |
| Token有効期限 | 約24時間 (`expires_in: 86399`) |
| リフレッシュ | Refresh Token で自動更新 |

### 3.3 OAuth アプリケーション作成手順
1. Linear Settings > Administration > API > OAuth applications で新規作成
2. アプリケーション名: "Linear Dashboard"
3. Redirect URI: `http://localhost:3000/api/auth/callback` (開発) / `https://<domain>/api/auth/callback` (本番)
4. Client ID と Client Secret を環境変数に設定

### 3.4 セッション管理
- Access Token は HTTP-Only Cookie に保存
- Refresh Token は暗号化して Cookie に保存
- Token の有効期限を監視し、期限切れ前に自動リフレッシュ

---

## 4. データアーキテクチャ

### 4.1 Linear GraphQL APIから取得するデータ

#### Issue（イシュー）
| フィールド | 型 | 用途 |
|---|---|---|
| id | String | 一意識別子 |
| identifier | String | 表示用ID (例: TEAM-123) |
| title | String | タイトル |
| description | String | 説明 |
| priority | Int | 優先度 (0=None, 1=Urgent, 2=High, 3=Normal, 4=Low) |
| estimate | Float | ストーリーポイント見積もり |
| state | WorkflowState | 現在のステータス |
| assignee | User | 担当者 |
| labels | [IssueLabel] | ラベル一覧 |
| cycle | Cycle | 所属サイクル |
| project | Project | 所属プロジェクト |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |
| startedAt | DateTime | 作業開始日時 |
| completedAt | DateTime | 完了日時 |
| canceledAt | DateTime | キャンセル日時 |
| archivedAt | DateTime | アーカイブ日時 |
| dueDate | String | 期限日 |
| slaBreachesAt | DateTime | SLA違反日時 |

#### Cycle（サイクル/スプリント）
| フィールド | 型 | 用途 |
|---|---|---|
| id | String | 一意識別子 |
| number | Int | サイクル番号 |
| name | String | サイクル名 |
| startsAt | DateTime | 開始日 |
| endsAt | DateTime | 終了日 |
| progress | Float | 全体進捗率 (0.0〜1.0) |
| scopeHistory | [Float] | 日別のスコープ（合計ポイント）履歴 |
| completedScopeHistory | [Float] | 日別の完了ポイント履歴 |
| inProgressScopeHistory | [Float] | 日別の進行中ポイント履歴 |
| issueCountHistory | [Int] | 日別のイシュー数履歴 |
| completedIssueCountHistory | [Int] | 日別の完了イシュー数履歴 |
| issues | [Issue] | サイクル内イシュー一覧 |

#### Project（プロジェクト）
| フィールド | 型 | 用途 |
|---|---|---|
| id | String | 一意識別子 |
| name | String | プロジェクト名 |
| description | String | 説明 |
| state | String | 状態 (planned/started/paused/completed/canceled) |
| progress | Float | 進捗率 |
| startedAt | DateTime | 開始日時 |
| targetDate | String | 目標完了日 |
| completedAt | DateTime | 完了日時 |
| issues | [Issue] | プロジェクト内イシュー一覧 |
| lead | User | プロジェクトリード |
| members | [User] | メンバー一覧 |

#### WorkflowState（ワークフロー状態）
| フィールド | 型 | 用途 |
|---|---|---|
| id | String | 一意識別子 |
| name | String | ステータス名 (例: "Backlog", "In Progress", "Done") |
| type | String | 種別 (triage/backlog/unstarted/started/completed/canceled) |
| color | String | 表示色 |
| position | Float | 表示順序 |

#### User（ユーザー）
| フィールド | 型 | 用途 |
|---|---|---|
| id | String | 一意識別子 |
| name | String | 表示名 |
| email | String | メールアドレス |
| avatarUrl | String | アバター画像URL |
| assignedIssues | [Issue] | 担当イシュー一覧 |

### 4.2 データ更新戦略（ハイブリッド方式）

#### 自動更新
- TanStack Query の `refetchInterval` で **5分間隔** の自動ポーリング
- ダッシュボードがアクティブタブの場合のみ実行 (`refetchIntervalInBackground: false`)
- Stale Time: 2分（2分以内の再アクセスはキャッシュから返す）

#### 手動更新
- ヘッダーに「リフレッシュ」ボタンを配置
- 最終更新日時を表示
- プルダウンリフレッシュ（モバイル対応時）

#### 将来的な拡張: Webhook対応
- Linear Webhooks を Next.js API Routes で受信
- Webhook受信時にクライアント側のキャッシュを無効化（Server-Sent Events経由）
- 対応イベント: Issue, Cycle, Project の create/update/remove

---

## 5. ページ構成・UI設計

### 5.1 全体レイアウト

```
┌──────────────────────────────────────────────────┐
│ ヘッダー: ロゴ / チーム選択 / テーマ切替 / ユーザーメニュー │
├────────┬─────────────────────────────────────────┤
│        │                                         │
│  サイド │          メインコンテンツ                   │
│  バー   │                                         │
│        │                                         │
│ ・概要  │                                         │
│ ・サイクル│                                        │
│ ・チーム │                                         │
│ ・フロー │                                         │
│ ・プロジェクト│                                     │
│ ・設定  │                                         │
│        │                                         │
└────────┴─────────────────────────────────────────┘
```

### 5.2 ページ一覧

---

#### 5.2.1 概要ダッシュボード (`/dashboard`)

**目的**: プロジェクトの全体像を一目で把握する

**KPIカード（上部4枚）**:

| KPI | 計算方法 | チャートタイプ |
|---|---|---|
| 今サイクルの完了率 | completedIssues / totalIssues * 100 | 円形プログレス + 数値 |
| 平均サイクルタイム | avg(completedAt - startedAt) | 数値 + 前サイクル比較矢印 |
| 週間スループット | 過去7日間の完了イシュー数 | 数値 + ミニスパークライン |
| キャリーオーバー率 | 前サイクルからの持ち越し / 前サイクル合計 * 100 | 数値 + 警告閾値(20%超で黄、30%超で赤) |

**チャートセクション**:

1. **ベロシティトレンド**（棒グラフ + ローリング平均線）
   - X軸: 過去8サイクル
   - Y軸: 完了ストーリーポイント
   - 7サイクルローリング平均を折れ線で重ねる
   - ツールチップ: サイクル名、完了ポイント、イシュー数

2. **イシューステータス分布**（ドーナツチャート）
   - 現在のアクティブイシューのステータス別割合
   - 中央に合計イシュー数を表示
   - WorkflowState.type の色を使用

3. **優先度別イシュー数**（横棒グラフ）
   - Urgent / High / Normal / Low / None
   - 各バーにイシュー数のラベル
   - Urgent/Highが多い場合は視覚的にハイライト

4. **直近のアクティビティフィード**（リスト）
   - 最近完了/作成されたイシューの一覧（5〜10件）
   - アバター、イシュータイトル、ステータス変更、タイムスタンプ

---

#### 5.2.2 サイクル詳細 (`/dashboard/cycles`)

**目的**: 現在および過去のサイクルの進捗を詳細に分析する

**サイクルセレクター**: ドロップダウンでサイクルを切り替え（デフォルト: 現在のサイクル）

1. **サイクル概要カード**
   - サイクル名、期間、残り日数
   - 進捗バー (progress フィールド)
   - 完了 / 進行中 / 未着手 のイシュー数

2. **バーンダウンチャート**（エリアチャート）
   - X軸: サイクル日数
   - Y軸: 残ストーリーポイント
   - `scopeHistory` - `completedScopeHistory` で残ポイントを算出
   - 理想バーンダウンライン（点線）を重ねる
   - スコープ増加部分をハイライト表示（スコープクリープの検出）

3. **バーンアップチャート**（積み上げエリアチャート）
   - 完了ポイント（`completedScopeHistory`）
   - 進行中ポイント（`inProgressScopeHistory`）
   - 合計スコープ（`scopeHistory`）を折れ線で表示
   - スコープの変化が視覚的に分かる

4. **スコープクリープインジケーター**
   - サイクル開始後に追加されたイシュー数
   - サイクル開始時点のスコープとの差分を%で表示
   - 10%以下: 緑、10〜20%: 黄、20%超: 赤

5. **サイクル内イシューテーブル**
   - ソート・フィルター可能なテーブル
   - カラム: ID, タイトル, 担当者, ステータス, 優先度, 見積もり, 作成日
   - ステータスでグループ化可能

6. **サイクル比較**（棒グラフ）
   - 過去5サイクルの横並び比較
   - 完了ポイント、キャリーオーバー率、スコープクリープ率

---

#### 5.2.3 チームメンバー分析 (`/dashboard/team`)

**目的**: チームの作業分布と個人の貢献を健全に可視化する

> **設計原則**: 個人のパフォーマンスランキングや比較を目的としない。
> 作業負荷の偏りを検出し、チームの健全性を維持することが目的。

1. **作業負荷分布**（水平棒グラフ）
   - 各メンバーの担当イシュー数（ステータス別に積み上げ）
   - チーム平均ラインを表示
   - 過負荷のメンバーをハイライト

2. **完了イシュー数トレンド**（積み上げエリアチャート）
   - X軸: 過去4〜8週間
   - Y軸: 週別完了イシュー数
   - 各メンバーを色分け
   - チーム全体のスループットの推移が分かる

3. **メンバー別サマリーカード**
   - アバター、名前
   - 現在の担当イシュー数
   - 今サイクルの完了数
   - 平均サイクルタイム
   - 作業中（In Progress）のイシュー一覧

4. **ラベル別作業内訳**（ドーナツチャート）
   - Feature / Bug / Tech Debt / Improvement などの割合
   - チーム全体の作業バランスを可視化
   - Tech Debtの割合が高い場合の警告

---

#### 5.2.4 ワークフロー分析 (`/dashboard/workflow`)

**目的**: プロセスのボトルネックを検出し、フロー効率を改善する

1. **累積フローダイアグラム（CFD）**（積み上げエリアチャート）
   - X軸: 時間（過去30日）
   - Y軸: イシュー数
   - 各ワークフローステータスを積み上げ
   - バンドの幅が一定 → 安定したフロー
   - バンドが広がる → ボトルネック

2. **ステータス別平均滞留時間**（水平棒グラフ）
   - 各ワークフローステータスでの平均滞留日数
   - 異常値（平均の2倍以上）をハイライト
   - ツールチップにイシュー数を表示

3. **サイクルタイム散布図**（散布図）
   - X軸: 完了日
   - Y軸: サイクルタイム（日数）
   - 各ドット = 1つのイシュー
   - 移動平均線を重ねる
   - 外れ値の検出（平均+2σを超えるもの）

4. **リードタイム分布**（ヒストグラム）
   - イシュー作成から完了までの時間の分布
   - 中央値、85パーセンタイル、95パーセンタイルのラインを表示
   - SLAがある場合はSLAラインも表示

5. **WIPモニター**（カード + バー）
   - 現在の「In Progress」ステータスのイシュー数
   - 推奨WIPリミット（チームメンバー数 * 2）との比較
   - WIPリミット超過時の視覚的アラート

---

#### 5.2.5 プロジェクト健康状態 (`/dashboard/projects`)

**目的**: プロジェクト全体の進捗と健康状態を俯瞰する

1. **プロジェクト一覧カード**
   - 各プロジェクトのカード表示
   - プログレスバー（進捗率）
   - 状態バッジ（Planned / Started / Paused / Completed）
   - リード、目標日、残イシュー数

2. **プロジェクト進捗タイムライン**（ガントチャート風）
   - 各プロジェクトの開始日〜目標日をバーで表示
   - 現在日のマーカー
   - 進捗率に応じたバーの色分け
   - 遅延リスクのあるプロジェクトをハイライト

3. **プロジェクト別イシュー分布**（積み上げ棒グラフ）
   - 各プロジェクトのイシュー数（ステータス別）
   - 完了率でソート

4. **ブロッカー・リスク検出**
   - 期限超過イシューの一覧
   - 長期間 "In Progress" のイシュー（しきい値: 5営業日以上）
   - Urgent/High優先度で未着手のイシュー

---

#### 5.2.6 設定 (`/dashboard/settings`)

**目的**: ダッシュボードのカスタマイズ

1. **チーム選択**
   - ダッシュボードのデフォルト対象チームを選択
   - 複数チームの切り替え

2. **表示設定**
   - テーマ（ライト/ダーク）
   - デフォルトのサイクル（現在/前回）
   - KPIカードのカスタマイズ

3. **データ更新設定**
   - 自動更新間隔（1分/5分/15分/無効）
   - 最終更新日時の表示

4. **通知設定**（将来拡張）
   - しきい値アラートの設定
   - Slack通知連携

---

## 6. ベストプラクティスの組み込み

### 6.1 DORA メトリクスの近似表示

Linear のデータから近似的に DORA メトリクスを導出し、概要ダッシュボードに表示する。

| DORA メトリクス | Linear での算出方法 | 表示方法 |
|---|---|---|
| デプロイ頻度 | "Done" ステートへの遷移頻度（日別） | スパークライン + 日平均値 |
| リードタイム | イシュー createdAt → completedAt | 中央値 + トレンド |
| 変更失敗率 | "Bug" ラベルイシュー / 全完了イシュー | パーセンテージ + トレンド |
| 復旧時間 | Urgent/Critical バグの createdAt → completedAt | 中央値 + トレンド |

### 6.2 アンチパターンの回避

以下のアンチパターンを設計レベルで排除する:

1. **個人のパフォーマンスランキング禁止**
   - 個人を順位付けするリーダーボードは作成しない
   - チームメンバー分析は「作業負荷の偏り検出」が目的

2. **バニティメトリクスの排除**
   - コミット数、コード行数、PR数は表示しない
   - すべてのメトリクスは「アクションにつながるか」を基準に選定

3. **コンテキストの提供**
   - 数値だけでなく、必ずトレンド（前期比較）を併記
   - しきい値と推奨値を視覚的に表示

4. **メトリクスの過多を避ける**
   - 各ページで表示するチャートは最大5つ
   - 段階的な情報開示（概要 → 詳細へドリルダウン）

### 6.3 アクショナブルインサイト

各メトリクスに対して、異常値を検出した場合のガイダンスを表示する:

| 状況 | ガイダンス例 |
|---|---|
| キャリーオーバー率 > 20% | "見積もり精度の見直しを検討してください" |
| スコープクリープ > 20% | "サイクル中のイシュー追加が多いです。要件整理を検討してください" |
| 特定メンバーのWIP > 5 | "担当タスクが集中しています。再配分を検討してください" |
| サイクルタイム中央値 > 前回の1.5倍 | "作業完了に時間がかかっています。ブロッカーを確認してください" |
| Bug率 > 30% | "バグの割合が高いです。品質改善施策を検討してください" |

---

## 7. チャートタイプ・ビジュアライゼーション設計

### 7.1 チャートタイプ選択基準

| メトリクス | チャートタイプ | Rechartsコンポーネント |
|---|---|---|
| ベロシティトレンド | 棒グラフ + 折れ線 | `ComposedChart` (`Bar` + `Line`) |
| バーンダウン | エリアチャート | `AreaChart` |
| バーンアップ | 積み上げエリア | `AreaChart` (stacked) |
| CFD | 積み上げエリア | `AreaChart` (stacked) |
| 作業負荷分布 | 水平棒グラフ | `BarChart` (layout="vertical") |
| ステータス分布 | ドーナツチャート | `PieChart` (innerRadius) |
| 優先度分布 | 横棒グラフ | `BarChart` (layout="vertical") |
| サイクルタイム散布図 | 散布図 | `ScatterChart` |
| リードタイム分布 | ヒストグラム | `BarChart` |
| KPIカード | 数値 + スパークライン | `LineChart` (mini) |
| サイクル比較 | グループ棒グラフ | `BarChart` (grouped) |

### 7.2 カラーパレット

ダークモード・ライトモード両方で視認性を確保する:

**ステータスカラー**:
- Backlog: `slate-400`
- Todo: `blue-400`
- In Progress: `amber-400`
- In Review: `purple-400`
- Done: `emerald-400`
- Canceled: `red-400`

**優先度カラー**:
- Urgent: `red-500`
- High: `orange-500`
- Normal: `blue-500`
- Low: `slate-400`

**チャートカラー（メンバー識別）**:
- 最大8色のカラーパレットを定義
- 色覚多様性に配慮し、パターン・ラベルを併用

### 7.3 レスポンシブ対応

- デスクトップ（1280px+）: 2〜3カラムグリッド
- タブレット（768px〜1279px）: 1〜2カラムグリッド
- モバイル（〜767px）: 1カラム（KPIカードはスクロール可能）

---

## 8. ディレクトリ構成

```
linear-dashboard/
├── .env.local                    # 環境変数（Linear OAuth credentials）
├── .env.example                  # 環境変数テンプレート
├── next.config.ts                # Next.js設定
├── tailwind.config.ts            # Tailwind CSS設定
├── tsconfig.json                 # TypeScript設定
├── package.json
│
├── docs/
│   └── specs/
│       └── linear-dashboard-spec.md  # この仕様書
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # ルートレイアウト
│   │   ├── page.tsx              # ランディング/ログインページ
│   │   ├── login/
│   │   │   └── page.tsx          # ログインページ
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts      # OAuth開始
│   │   │   │   ├── callback/route.ts   # OAuthコールバック
│   │   │   │   ├── refresh/route.ts    # トークンリフレッシュ
│   │   │   │   └── logout/route.ts     # ログアウト
│   │   │   └── linear/
│   │   │       └── [...path]/route.ts  # Linear APIプロキシ
│   │   └── dashboard/
│   │       ├── layout.tsx        # ダッシュボードレイアウト（サイドバー）
│   │       ├── page.tsx          # 概要ダッシュボード
│   │       ├── cycles/
│   │       │   └── page.tsx      # サイクル詳細
│   │       ├── team/
│   │       │   └── page.tsx      # チームメンバー分析
│   │       ├── workflow/
│   │       │   └── page.tsx      # ワークフロー分析
│   │       ├── projects/
│   │       │   └── page.tsx      # プロジェクト健康状態
│   │       └── settings/
│   │           └── page.tsx      # 設定
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/uiコンポーネント
│   │   ├── layout/
│   │   │   ├── header.tsx        # ヘッダー
│   │   │   ├── sidebar.tsx       # サイドバーナビゲーション
│   │   │   └── theme-toggle.tsx  # テーマ切替ボタン
│   │   ├── charts/
│   │   │   ├── velocity-chart.tsx
│   │   │   ├── burndown-chart.tsx
│   │   │   ├── burnup-chart.tsx
│   │   │   ├── cfd-chart.tsx
│   │   │   ├── cycle-time-scatter.tsx
│   │   │   ├── workload-chart.tsx
│   │   │   ├── status-donut.tsx
│   │   │   ├── priority-bar.tsx
│   │   │   └── sparkline.tsx
│   │   ├── cards/
│   │   │   ├── kpi-card.tsx
│   │   │   ├── member-card.tsx
│   │   │   ├── project-card.tsx
│   │   │   └── cycle-summary-card.tsx
│   │   ├── tables/
│   │   │   └── issue-table.tsx
│   │   └── shared/
│   │       ├── loading-skeleton.tsx
│   │       ├── error-boundary.tsx
│   │       ├── empty-state.tsx
│   │       └── insight-banner.tsx  # アクショナブルインサイト表示
│   │
│   ├── lib/
│   │   ├── linear/
│   │   │   ├── client.ts         # Linear GraphQL クライアント
│   │   │   ├── queries.ts        # GraphQL クエリ定義
│   │   │   └── types.ts          # Linear API レスポンス型定義
│   │   ├── auth/
│   │   │   ├── oauth.ts          # OAuth2ヘルパー関数
│   │   │   ├── session.ts        # セッション管理
│   │   │   └── proxy-helpers.ts  # proxy.ts 用ヘルパー関数
│   │   ├── utils/
│   │   │   ├── metrics.ts        # メトリクス計算ロジック
│   │   │   ├── date.ts           # 日付ユーティリティ
│   │   │   └── format.ts         # フォーマットユーティリティ
│   │   └── constants.ts          # 定数定義（閾値、カラーパレット等）
│   │
│   ├── hooks/
│   │   ├── use-linear-issues.ts  # イシューデータ取得フック
│   │   ├── use-linear-cycles.ts  # サイクルデータ取得フック
│   │   ├── use-linear-projects.ts # プロジェクトデータ取得フック
│   │   ├── use-linear-team.ts    # チームデータ取得フック
│   │   ├── use-metrics.ts        # メトリクス計算フック
│   │   └── use-auth.ts           # 認証状態管理フック
│   │
│   ├── providers/
│   │   ├── query-provider.tsx    # TanStack Query Provider
│   │   ├── theme-provider.tsx    # テーマ Provider
│   │   └── auth-provider.tsx     # 認証 Provider
│   │
│   └── proxy.ts                  # Next.js 16 プロキシ（旧middleware.ts、認証チェック）
│
└── public/
    └── favicon.ico
```

---

## 9. 環境変数

```env
# Linear OAuth2
LINEAR_CLIENT_ID=your_client_id
LINEAR_CLIENT_SECRET=your_client_secret
LINEAR_REDIRECT_URI=http://localhost:3000/api/auth/callback

# セッション暗号化
SESSION_SECRET=random_32_char_string

# アプリケーション
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 10. API設計（Next.js API Routes）

### 10.1 認証エンドポイント

| エンドポイント | メソッド | 説明 |
|---|---|---|
| `/api/auth/login` | GET | OAuth認証フロー開始（Linear へリダイレクト） |
| `/api/auth/callback` | GET | OAuthコールバック処理、トークン取得 |
| `/api/auth/refresh` | POST | Access Token リフレッシュ |
| `/api/auth/logout` | POST | セッション破棄 |

### 10.2 Linear APIプロキシ

| エンドポイント | メソッド | 説明 |
|---|---|---|
| `/api/linear/[...path]` | POST | Linear GraphQL APIへのプロキシ |

クライアントから直接Linear APIを叩かず、Next.js API Routes経由でプロキシする。
これにより:
- Access Token をサーバーサイドに保持（セキュリティ向上）
- レート制限の管理
- レスポンスのキャッシュ

---

## 11. メトリクス計算ロジック

### 11.1 サイクルタイム
```
cycleTime = completedAt - startedAt（営業日ベース）
```
- `startedAt` が null の場合は `createdAt` を使用
- 完了済みイシューのみ対象

### 11.2 リードタイム
```
leadTime = completedAt - createdAt（営業日ベース）
```

### 11.3 スループット
```
throughput = count(completedIssues) / timePeriod
```
- 週次: 過去7日間の完了数
- 月次: 過去30日間の完了数

### 11.4 ベロシティ
```
velocity = sum(estimate) of completedIssues in cycle
rollingAverage = avg(velocity) of last 7 cycles
```

### 11.5 キャリーオーバー率
```
carryoverRate = (前サイクルの未完了イシュー数 / 前サイクルの全イシュー数) * 100
```

### 11.6 スコープクリープ率
```
scopeCreep = ((現在のスコープ - 開始時のスコープ) / 開始時のスコープ) * 100
```
- `scopeHistory[0]` が開始時のスコープ
- `scopeHistory[latest]` が現在のスコープ

### 11.7 バグ率
```
bugRate = (bugLabelIssues / totalCompletedIssues) * 100
```

### 11.8 ステータス別滞留時間
```
dwellTime = 各イシューが特定ステータスに滞在した合計時間
```
- イシューの更新履歴（updatedAt の差分）から推定

---

## 12. パフォーマンス最適化

### 12.1 データフェッチ最適化
- GraphQLクエリで必要なフィールドのみ指定（過剰フェッチ防止）
- ページネーション: 一度に最大250件を取得、必要に応じて追加ロード
- TanStack Query のキャッシュを活用（staleTime: 2分、gcTime: 10分）

### 12.2 レンダリング最適化
- React.memo / useMemo でチャートの再レンダリングを最小化
- 動的インポートでチャートコンポーネントの遅延ロード
- Suspense + Loading Skeleton でプログレッシブな表示

### 12.3 ビルド最適化
- Next.js の Server Components を活用
- `"use cache"` ディレクティブで Linear API レスポンスを明示的にキャッシュ
- React Compiler (`reactCompiler: true`) による自動メモ化
- Turbopack（デフォルト）による高速ビルド
- 静的ページ（設定等）はSSG
- ダッシュボードページはCSR（TanStack Query でクライアントフェッチ）

---

## 13. セキュリティ

### 13.1 認証セキュリティ
- OAuth2 PKCE フローでクライアント認証
- Access Token は HTTP-Only Cookie に保存（XSS対策）
- CSRF対策として state パラメータを使用
- Token は暗号化して保存

### 13.2 APIセキュリティ
- すべてのAPIルートで認証チェック
- Linear APIへのアクセスはサーバーサイドプロキシ経由のみ
- Rate Limiting の実装（Linear API のレート制限: 複雑度ベース、最大10,000/時）

### 13.3 データセキュリティ
- クライアント側にAccess Tokenを公開しない
- 環境変数でシークレットを管理
- `.env.local` を `.gitignore` に追加

---

## 14. 実装フェーズ

### Phase 1: 基盤構築（MVP）
- [ ] Next.js プロジェクトセットアップ
- [ ] shadcn/ui + Tailwind CSS 導入
- [ ] Linear OAuth2 認証フロー実装
- [ ] Linear GraphQL クライアント実装
- [ ] ダッシュボードレイアウト（サイドバー + ヘッダー）
- [ ] テーマ切替（ライト/ダーク）
- [ ] 概要ダッシュボード（KPIカード + ベロシティチャート）

### Phase 2: コア機能
- [ ] サイクル詳細ページ（バーンダウン/バーンアップ）
- [ ] チームメンバー分析ページ
- [ ] イシューテーブル（ソート・フィルター）
- [ ] チーム切り替え機能

### Phase 3: 高度な分析
- [ ] ワークフロー分析ページ（CFD、サイクルタイム散布図）
- [ ] プロジェクト健康状態ページ
- [ ] DORA メトリクス近似表示
- [ ] アクショナブルインサイト表示

### Phase 4: 最適化・拡張
- [ ] パフォーマンス最適化
- [ ] レスポンシブ対応
- [ ] 設定ページ
- [ ] Vercelデプロイ・環境設定
- [ ] Webhook対応（リアルタイム更新）

---

## 15. 非機能要件

| 要件 | 目標値 |
|---|---|
| 初回表示速度 (LCP) | < 2.5秒 |
| データ更新間隔 | 5分（自動）+ 手動 |
| 同時接続ユーザー | 〜15人 |
| ブラウザ対応 | Chrome, Firefox, Safari, Edge (最新2バージョン) |
| アクセシビリティ | WCAG 2.1 AA準拠 |
| テスト | 主要コンポーネントの単体テスト |

---

## 16. 参考資料

### Linear API
- [Linear Developers - GraphQL API](https://linear.app/developers/graphql)
- [Linear Developers - OAuth 2.0 Authentication](https://linear.app/developers/oauth-2-0-authentication)
- [Linear Developers - Webhooks](https://linear.app/developers/webhooks)
- [Linear Developers - Filtering](https://linear.app/developers/filtering)
- [Linear Developers - Pagination](https://linear.app/developers/pagination)
- [Linear Docs - Insights](https://linear.app/docs/insights)
- [Linear Docs - Cycle Graph](https://linear.app/docs/cycle-graph)
- [Linear SDK GitHub](https://github.com/linear/linear)

### ベストプラクティス
- [Atlassian - DORA Metrics](https://www.atlassian.com/devops/frameworks/dora-metrics)
- [Atlassian - Five Agile Metrics You Won't Hate](https://www.atlassian.com/agile/project-management/metrics)
- [Cortex - Pocket Guide to Engineering Metrics](https://www.cortex.io/post/the-pocket-guide-to-engineering-metrics)
- [Salesforce - Engineering 360 Dashboard](https://engineering.salesforce.com/engineering-360-dashboard-transforming-complex-data-into-powerful-engineering-insights/)
- [Minware - Cycle Time vs Lead Time](https://www.minware.com/blog/cycle-time-vs-lead-time)

### デザイン
- [Dashboard Design Patterns](https://dashboarddesignpatterns.github.io/)
- [Luzmo - The 34 Best Chart Types](https://www.luzmo.com/blog/chart-types)
- [Datawrapper - Choosing Colors for Data Visualization](https://academy.datawrapper.de/article/140-what-to-consider-when-choosing-colors-for-data-visualization)
