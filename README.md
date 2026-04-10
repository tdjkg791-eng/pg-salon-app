# Pg. サロン管理アプリ

Pg. 式ダイエットサロン向けの顧客管理・食事記録・体重トラッキング Web アプリです。
お客様は LINE (LIFF) からログインし、体重記録・食事報告を行えます。
スタッフは管理ダッシュボードから顧客情報・コース・施術・フォローアップを管理します。

## 主な機能

- お客様: 体重ログ (朝/夜/施術前後)、食事報告 (PFC 自動計算)、進捗グラフ
- スタッフ: 顧客・コース管理、施術記録、売上集計、フォローアップ一覧
- 食品 DB: 文部科学省八訂ベース。OK/NG/制限付きを Pg. 式で判定
- LINE Bot + LIFF 連携

## 技術スタック

- Next.js 14 (App Router) + React 18 + TypeScript 5
- Tailwind CSS 3.4
- Supabase (PostgreSQL + RLS + Auth)
- LINE Messaging API (@line/bot-sdk) + LIFF (@line/liff)
- Chart.js + react-chartjs-2

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` を `.env.local` にコピーし、各値を記入してください。

```bash
cp .env.local.example .env.local
```

必要な値:

- Supabase: URL / anon key / service role key
- LINE: Channel ID / Secret / Access Token
- LIFF: LIFF ID

### 3. Supabase マイグレーション

Supabase プロジェクトの SQL Editor で `supabase/migrations/001_initial_schema.sql` を実行してください。9 テーブル + インデックス + RLS + 3 ビューが作成されます。

### 4. 食品マスタの投入

```bash
npm run seed
```

約 40 件の食品データ (OK/NG/制限付き) を `foods` テーブルに upsert します。

### 5. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## ディレクトリ構成

- `app/(customer)` - お客様向けページ (LIFF)
- `app/(admin)` - スタッフ向け管理画面
- `app/api` - API Route / LINE Webhook
- `components` - 共通 UI コンポーネント
- `lib` - Supabase クライアント, LINE, ユーティリティ
- `supabase/migrations` - DB スキーマ
- `scripts` - シード等
