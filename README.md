# Fight Moments NFT

格闘技の試合中に起きた「決定的瞬間（KO・一本・判定発表など）」を、Sui ブロックチェーン上で NFT として発行・保管するプロジェクトです。ハッカソン提出を想定し、最小構成で動く MvP と、後から拡張しやすい設計方針を整理しています。

---

**目次**
- プロジェクト概要（背景と狙い）
- 技術スタック
- リポジトリ構成
- スマートコントラクト設計（要約）
- 画面構成（MVP）
- データフロー
- メタデータ設計のポイント
- 拡張ポイント
- 審査員向け要約

---

## プロジェクト概要（背景と狙い）

ライブコンテンツで最も価値があるのは数秒〜十数秒の「盛り上がりの瞬間」。現状は以下の課題があります。

- 配信プラットフォームに動画が閉じる
- 選手や主催へ二次的収益が還元されにくい
- ファンが「自分が見たあの瞬間」を公式に所有できない

本プロジェクトは、瞬間をオンチェーンで記録し、意味のあるメタデータを持つ NFT として残すことで、後から参照・売買・配布できる状態を目指します。

---

## 技術スタック

- ブロックチェーン / コントラクト
  - Move（Sui Move 互換, `edition = "2024.beta"`）
  - 構成ファイル: `contracts/Move.toml`
  - テスト雛形: `contracts/tests/contracts_tests.move`
- フロントエンド
  - Next.js 16（App Router） / React 19 / TypeScript
  - Tailwind CSS v4 / PostCSS
  - Lint/Format: Biome
  - プロジェクト: `frontend/package.json`, `frontend/biome.json`
- ツールチェーン（推奨）
  - Node.js 20 以上 もしくは Bun（`frontend/bun.lock` あり）
  - Sui CLI（Move パッケージのビルド・テスト・デプロイ用）

---

## リポジトリ構成

```text
Fight-Moments_internal/
├─ contracts/     # Sui Move コントラクト（NFT定義・mintロジック・アクセス制御）
├─ frontend/      # 瞬間の登録/閲覧 UI（Next.js + Tailwind）
└─ README.md      # 本ドキュメント
```

---



## スマートコントラクト設計（要約）

- コア構造体 `FightMoment`（1つの瞬間NFT）
  - `id` / `match_id` / `fighter_a` / `fighter_b`
  - `moment_type`（"KO" | "SUBMISSION" | "DECISION" | "HIGHLIGHT" など）
  - `timestamp` / `media_uri` / `royalty_info`
- アクセス制御
  - デプロイ時に `admin_cap` を1つだけ生成
  - `mint_moment(...)` は `admin_cap` 所有者のみ実行可
- イベント（任意）
  - mint 時に「新しい瞬間が登録された」を emit し、フロント更新を容易に

---

## 画面構成（MVP）

- Moment 登録（Admin 専用）
  - 入力: Match ID / Fighter A・B / Moment Type / Media URI
  - 実行: Sui へトランザクション送信 → TxID 表示
- Moment 一覧（全員閲覧）
  - 発行済みカード表示、`match_id` フィルタ、サムネイル表示

---

## データフロー

1. Admin がフォーム入力 → フロントから `mint_moment(...)` 呼び出し
2. Move 側で `admin_cap` 検証 → `FightMoment` 生成 → メタデータ格納
3. チェーンに反映 → フロントが一覧取得して表示

---

## メタデータ設計のポイント

- 必須: `match_id`, `moment_type`, `fighters`（2名）, `media_uri`
- 任意: `round`, `duration`, `venue`, `org`（団体）, `royalty_info`
- JSON ライクに整理しておくと外部連携・将来拡張が容易

---

## 拡張ポイント

- 自動トリガー化: Webhook/オペレーション連携で自動 mint
- ファン参加型: 「本日のベストモーメント」投票 → 上位のみ公式発行
- 限定メディア: 保有者限定で高画質/未公開素材を提供
- 収益分配の自動化: 二次流通含む分配ロジックをオンチェーン化

---

## 審査員向け要約

- スポーツの「数秒のピーク」価値を NFT で捉える
- 公式アカウントのみ発行できる設計で品質担保
- 試合構造を意識したメタデータで自動化/連携に強い
- Sui 前提の高速性でほぼリアルタイム記録を想定
