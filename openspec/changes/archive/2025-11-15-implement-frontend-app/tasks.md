# Tasks: implement-frontend-app

実装タスクを小さく、検証可能な単位に分割し、ユーザーに進捗が見えるようにする。

## Phase 1: 基盤構築とセットアップ

### 1.1 依存関係のインストール

**Task**: Sui および Walrus 関連の依存関係をインストールする

**Actions**:
- `@mysten/sui` (v1.15+) をインストール
- `@mysten/dapp-kit` (v0.14+) をインストール
- `@mysten/walrus` (latest) をインストール
- `@tanstack/react-query` (v5) をインストール
- 必要に応じて UI ライブラリ（shadcn/ui など）をインストール

**Validation**:
```bash
cd frontend
bun add @mysten/sui @mysten/dapp-kit @mysten/walrus @tanstack/react-query
bun run build  # ビルドが成功することを確認
```

**Dependencies**: なし

---

### 1.2 環境変数の設定

**Task**: 環境変数テンプレートと型定義を作成する

**Actions**:
- `.env.example` を作成し、必要な環境変数をリスト
  - `NEXT_PUBLIC_SUI_NETWORK` (testnet/devnet)
  - `NEXT_PUBLIC_SUI_RPC_URL`
  - `NEXT_PUBLIC_PACKAGE_ID`
  - `NEXT_PUBLIC_WALRUS_RELAY_URL`
  - `NEXT_PUBLIC_TRANSFER_POLICY_ID`
  - `NEXT_PUBLIC_COLLECTION_ID`
- `src/env.d.ts` に環境変数の型定義を追加

**Validation**:
```bash
# .env.local を作成
cp frontend/.env.example frontend/.env.local
# TypeScript エラーが出ないことを確認
bun run build
```

**Dependencies**: なし

---

### 1.3 Sui クライアントのセットアップ

**Task**: Sui RPC クライアントを設定する

**Actions**:
- `src/lib/sui/client.ts` を作成
- `SuiClient` のインスタンスを作成
- 環境変数から RPC URL を取得
- `src/lib/constants.ts` を作成してパッケージ ID などの定数を定義

**Validation**:
```typescript
// src/lib/sui/client.test.ts
import { suiClient } from './client';

test('Sui client connects to network', async () => {
  const chainId = await suiClient.getChainIdentifier();
  expect(chainId).toBeDefined();
});
```

**Dependencies**: 1.1, 1.2

---

### 1.4 dApp Kit Provider のセットアップ

**Task**: Next.js アプリに dApp Kit Provider を統合する

**Actions**:
- `src/app/layout.tsx` を編集
- `@mysten/dapp-kit` から `SuiClientProvider`, `WalletProvider` をインポート
- `QueryClientProvider` (React Query) をセットアップ
- Sui Wallet Standard 対応のウォレットを設定

**Validation**:
```bash
bun run dev
# ブラウザで http://localhost:3000 を開く
# コンソールエラーがないことを確認
```

**Dependencies**: 1.3

---

### 1.5 TypeScript 型定義の作成

**Task**: Sui オブジェクトとコントラクト型の定義を作成する

**Actions**:
- `src/types/sui.ts` を作成
  - `SuiObjectResponse` のカスタム型
- `src/types/contract.ts` を作成
  - `MintableMoment` 型
  - `FightMomentNFT` 型
  - `MomentType` enum
- `src/types/walrus.ts` を作成
  - `WalrusUploadResult` 型

**Validation**:
```typescript
// TypeScript エラーが出ないことを確認
import type { MintableMoment, FightMomentNFT } from '@/types/contract';

const moment: MintableMoment = {
  id: '0x123',
  match_id: 'UFC300-001',
  // ... other fields
};
```

**Dependencies**: なし

---

## Phase 2: Admin ワークフロー実装

### 2.1 Walrus クライアントのセットアップ

**Task**: Walrus SDK の設定とアップロード関数を作成する

**Actions**:
- `src/lib/walrus/client.ts` を作成
- Walrus SDK の初期化
- `src/lib/walrus/upload.ts` を作成
- Upload Relay 経由のアップロード関数を実装
- リトライロジックの実装

**Validation**:
```typescript
// src/lib/walrus/upload.test.ts
test('uploads file to Walrus', async () => {
  const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
  const result = await uploadToWalrus(file);
  expect(result.uri).toMatch(/^walrus:\/\//);
});
```

**Dependencies**: 1.1, 1.2

---

### 2.2 動画長さバリデーション関数の実装

**Task**: ブラウザで動画の長さをチェックする関数を作成する

**Actions**:
- `src/lib/validators/video.ts` を作成
- `validateVideoDuration` 関数を実装
- HTML5 Video API を使用してメタデータを取得
- 30 秒制限をチェック

**Validation**:
```typescript
// src/lib/validators/video.test.ts
test('rejects video longer than 30 seconds', async () => {
  const longVideo = createMockVideo(35); // 35秒
  await expect(validateVideoDuration(longVideo)).rejects.toThrow();
});

test('accepts video shorter than 30 seconds', async () => {
  const shortVideo = createMockVideo(20); // 20秒
  await expect(validateVideoDuration(shortVideo)).resolves.toBe(true);
});
```

**Dependencies**: なし

---

### 2.3 Walrus アップロードフォームの実装

**Task**: 動画とサムネイルをアップロードする UI を作成する

**Actions**:
- `src/components/admin/WalrusUploadForm.tsx` を作成
- ファイル入力フィールド（動画、サムネイル）
- アップロードボタン
- 進捗表示
- エラー表示
- `useWalrusUpload` カスタムフック（`src/hooks/useWalrusUpload.ts`）を作成

**Validation**:
```typescript
// Manual test
// 1. Admin画面でファイルを選択
// 2. "Upload"ボタンをクリック
// 3. 進捗が表示されること
// 4. 成功後にURIが取得されること
```

**Dependencies**: 2.1, 2.2

---

### 2.4 Moment 登録フォームの実装

**Task**: Sui にmomentを登録するフォームを作成する

**Actions**:
- `src/components/admin/MomentRegistrationForm.tsx` を作成
- match_id, fighter_a, fighter_b, moment_type, max_supply の入力フィールド
- Walrus URI を自動入力（アップロード完了後）
- PTB 構築ロジック
- `useSuiContract` カスタムフック（`src/hooks/useSuiContract.ts`）を作成

**Validation**:
```typescript
// Manual test
// 1. ファイルアップロード完了後、フォームが有効化されること
// 2. 必要な情報を入力
// 3. "登録"ボタンをクリック
// 4. トランザクションが成功すること
// 5. Sui Explorerでmomentオブジェクトが確認できること
```

**Dependencies**: 2.3, 1.3

---

### 2.5 Admin 画面の統合

**Task**: `/admin` ページを作成し、アップロードと登録を統合する

**Actions**:
- `src/app/admin/page.tsx` を作成
- `WalrusUploadForm` と `MomentRegistrationForm` を統合
- ステップ表示（アップロード中 → 登録中 → 完了）
- エラー区別（Walrus vs Sui）
- 成功後のリセット機能

**Validation**:
```bash
# Manual test
# 1. /admin にアクセス
# 2. 動画（<30秒）とサムネイルを選択
# 3. アップロード
# 4. moment情報を入力
# 5. 登録
# 6. 全体フローが1画面で完結すること
```

**Dependencies**: 2.3, 2.4

---

## Phase 3: Mint ワークフロー実装

### 3.1 Moment データ取得の実装

**Task**: Sui から moment のリストを取得する関数を作成する

**Actions**:
- `src/hooks/useMoments.ts` を作成
- React Query を使用して moment をキャッシュ
- アクティブな moment のみをフィルタ
- 残り供給数を計算

**Validation**:
```typescript
// src/hooks/useMoments.test.ts
test('fetches active moments only', async () => {
  const { result } = renderHook(() => useMoments());
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  
  result.current.data?.forEach(moment => {
    expect(moment.is_active).toBe(true);
  });
});
```

**Dependencies**: 1.3, 1.5

---

### 3.2 Kiosk 管理ユーティリティの実装

**Task**: Kiosk の検出と作成を行うユーティリティを作成する

**Actions**:
- `src/lib/sui/kiosk.ts` を作成
- `checkUserKiosk` 関数（KioskOwnerCap の検索）
- `createKioskAndMintPTB` 関数（Kiosk作成+mint の PTB）
- `mintAndLockPTB` 関数（既存 Kiosk への mint PTB）

**Validation**:
```typescript
// src/lib/sui/kiosk.test.ts
test('detects existing Kiosk', async () => {
  const kioskCap = await checkUserKiosk(userAddress);
  expect(kioskCap).toBeDefined();
});

test('creates PTB for first mint', () => {
  const tx = createKioskAndMintPTB(momentId);
  expect(tx).toBeDefined();
  // PTBの構造を検証
});
```

**Dependencies**: 1.3, 1.5

---

### 3.3 Moment カードコンポーネントの実装

**Task**: moment を表示するカードコンポーネントを作成する

**Actions**:
- `src/components/moments/MomentCard.tsx` を作成
- サムネイル画像（Walrus から）
- match_id, moment_type, fighters
- 残り供給数表示
- Mint ボタン

**Validation**:
```typescript
// src/components/moments/MomentCard.test.tsx
test('displays moment details', () => {
  render(<MomentCard moment={mockMoment} />);
  expect(screen.getByText('UFC300-001')).toBeInTheDocument();
  expect(screen.getByText('KO')).toBeInTheDocument();
  expect(screen.getByText(/900 \/ 1000/)).toBeInTheDocument();
});
```

**Dependencies**: 3.1

---

### 3.4 Mint ボタンとトランザクション実行の実装

**Task**: Mint ボタンのロジックを実装する

**Actions**:
- `src/components/moments/MintButton.tsx` を作成
- Kiosk 検出ロジック
- 初回 mint と2回目以降の分岐
- トランザクション署名・実行
- ボタン状態管理（有効/無効/ローディング）
- `useKioskManager` カスタムフック（`src/hooks/useKioskManager.ts`）を作成

**Validation**:
```typescript
// Manual test
// 1. Kioskを持たないアカウントでmint
//    → Kiosk作成+mintが1トランザクションで実行されること
// 2. 同じアカウントで2回目のmint
//    → 既存Kioskが使用されること
// 3. 供給切れのmomentでボタンが無効化されること
```

**Dependencies**: 3.2, 3.3

---

### 3.5 Moment 一覧ページの実装

**Task**: `/moments` ページを作成する

**Actions**:
- `src/app/moments/page.tsx` を作成
- `useMoments` で moment リストを取得
- `MomentCard` をグリッド表示
- ローディング状態
- エラー状態
- 空状態

**Validation**:
```bash
# Manual test
# 1. /moments にアクセス
# 2. アクティブなmomentのみが表示されること
# 3. サムネイルが正しく表示されること
# 4. Mintボタンが機能すること
```

**Dependencies**: 3.3, 3.4

---

## Phase 4: My NFTs 表示と出品機能

### 4.1 Kiosk NFT 取得の実装

**Task**: ユーザーの Kiosk 内 NFT を取得する関数を作成する

**Actions**:
- `src/hooks/useMyNFTs.ts` を作成
- KioskOwnerCap から Kiosk ID を取得
- Kiosk 内の FightMomentNFT を取得
- React Query でキャッシュ
- 出品状態も取得

**Validation**:
```typescript
// src/hooks/useMyNFTs.test.ts
test('fetches NFTs from Kiosk only', async () => {
  const { result } = renderHook(() => useMyNFTs());
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  
  // Kiosk内のNFTのみが取得されること
  expect(result.current.data).toBeDefined();
});
```

**Dependencies**: 1.3, 1.5, 3.2

---

### 4.2 NFT カードコンポーネントの実装

**Task**: NFT を表示するカードコンポーネントを作成する

**Actions**:
- `src/components/nfts/NFTCard.tsx` を作成
- サムネイル画像（リスト表示用）
- match_id, moment_type, serial_number
- 出品状態バッジ（出品中/未出品）
- 出品価格表示
- クリックで詳細表示

**Validation**:
```typescript
// src/components/nfts/NFTCard.test.tsx
test('displays NFT details', () => {
  render(<NFTCard nft={mockNFT} />);
  expect(screen.getByText('UFC300-001')).toBeInTheDocument();
  expect(screen.getByText('#1 of 1000')).toBeInTheDocument();
});

test('shows listing badge for listed NFT', () => {
  render(<NFTCard nft={mockListedNFT} />);
  expect(screen.getByText('出品中')).toBeInTheDocument();
});
```

**Dependencies**: 4.1

---

### 4.3 NFT 詳細表示の実装

**Task**: NFT の詳細を表示するモーダル/ページを作成する

**Actions**:
- `src/components/nfts/NFTDetailModal.tsx` を作成
- 動画プレイヤー（`video_uri` を使用）
- 完全なメタデータ表示
- 出品/出品解除ボタン
- `src/components/shared/VideoPlayer.tsx` を作成（Walrus 動画プレイヤー）

**Validation**:
```bash
# Manual test
# 1. NFTカードをクリック
# 2. 詳細モーダルが開くこと
# 3. 動画が再生できること
# 4. メタデータが正しく表示されること
```

**Dependencies**: 4.2

---

### 4.4 出品フォームとトランザクションの実装

**Task**: NFT を出品する機能を実装する

**Actions**:
- `src/components/nfts/ListingForm.tsx` を作成
- 価格入力フィールド（SUI）
- 出品 PTB の構築（`kiosk::list`）
- 出品解除 PTB の構築（`kiosk::delist`）
- 価格変更機能（delist + list）

**Validation**:
```typescript
// Manual test
// 1. NFT詳細で"価格を付ける"をクリック
// 2. 価格（例: 100 SUI）を入力
// 3. トランザクション成功
// 4. NFTカードに"出品中"バッジが表示されること
// 5. Marketplaceに表示されること
```

**Dependencies**: 4.3, 3.2

---

### 4.5 My NFTs ページの実装

**Task**: `/my-nfts` ページを作成する

**Actions**:
- `src/app/my-nfts/page.tsx` を作成
- `useMyNFTs` で NFT リストを取得
- `NFTCard` をグリッド表示
- 空状態（NFT なし、Kiosk なし）
- ローディング・エラー状態
- **禁止ボタンの削除確認**（"Kioskに入れる"、"Kioskから出す"）

**Validation**:
```bash
# Manual test
# 1. /my-nfts にアクセス
# 2. Kiosk内のNFTのみが表示されること
# 3. "Kioskに入れる"ボタンが存在しないこと
# 4. "Kioskから出す"ボタンが存在しないこと
# 5. "価格を付ける"ボタンが表示されること
```

**Dependencies**: 4.2, 4.4

---

## Phase 5: Marketplace 実装

### 5.1 出品 NFT 取得の実装

**Task**: Marketplace に出品されている NFT を取得する関数を作成する

**Actions**:
- `src/hooks/useMarketplace.ts` を作成
- Kiosk の list イベントまたは動的フィールドをクエリ
- collection_id でフィルタ
- React Query でキャッシュ
- ソート・フィルタ機能

**Validation**:
```typescript
// src/hooks/useMarketplace.test.ts
test('fetches only Fight Moment NFTs', async () => {
  const { result } = renderHook(() => useMarketplace());
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  
  result.current.data?.forEach(nft => {
    expect(nft.collection_id).toBe('fight-moments-v1');
  });
});
```

**Dependencies**: 1.3, 1.5

---

### 5.2 Marketplace カードコンポーネントの実装

**Task**: 出品 NFT を表示するカードコンポーネントを作成する

**Actions**:
- `src/components/marketplace/MarketplaceCard.tsx` を作成
- サムネイル画像
- match_id, moment_type, serial_number
- 価格表示（SUI）
- Seller の Kiosk ID（または短縮アドレス）
- Buy ボタン

**Validation**:
```typescript
// src/components/marketplace/MarketplaceCard.test.tsx
test('displays listing details', () => {
  render(<MarketplaceCard listing={mockListing} />);
  expect(screen.getByText('100 SUI')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Buy/ })).toBeInTheDocument();
});
```

**Dependencies**: 5.1

---

### 5.3 購入ボタンとトランザクションの実装

**Task**: NFT を購入する機能を実装する

**Actions**:
- `src/components/marketplace/PurchaseButton.tsx` を作成
- 購入確認モーダル
- 購入 PTB の構築（`kiosk::purchase` + `kiosk::lock`）
- 初回購入時の Kiosk 作成対応
- 残高チェック
- TransferPolicy の確認（`confirm_request`）

**Validation**:
```typescript
// Manual test
// 1. Marketplaceで"Buy"をクリック
// 2. 確認モーダルが表示されること
// 3. トランザクション成功
// 4. NFTがMy NFTsに表示されること
// 5. MarketplaceからNFTが削除されること
```

**Dependencies**: 5.2, 3.2

---

### 5.4 フィルタ・ソート機能の実装

**Task**: Marketplace のフィルタとソート機能を実装する

**Actions**:
- `src/components/marketplace/Filters.tsx` を作成
- Moment Type フィルタ（KO, Submission, Decision）
- Match ID 検索
- 価格ソート（安い順/高い順）
- フィルタ状態管理

**Validation**:
```typescript
// src/components/marketplace/Filters.test.tsx
test('filters by moment type', () => {
  render(<Filters onFilterChange={mockOnChange} />);
  const typeFilter = screen.getByLabelText('Moment Type');
  fireEvent.change(typeFilter, { target: { value: 'KO' } });
  expect(mockOnChange).toHaveBeenCalledWith({ momentType: 'KO' });
});
```

**Dependencies**: 5.1

---

### 5.5 Marketplace ページの実装

**Task**: `/marketplace` ページを作成する

**Actions**:
- `src/app/marketplace/page.tsx` を作成
- `useMarketplace` で出品 NFT を取得
- `Filters` でフィルタ・ソート
- `MarketplaceCard` をグリッド表示
- 空状態（出品なし）
- ローディング・エラー状態

**Validation**:
```bash
# Manual test
# 1. /marketplace にアクセス
# 2. 出品中のNFTが表示されること
# 3. フィルタが機能すること
# 4. ソートが機能すること
# 5. 購入フローが完了すること
```

**Dependencies**: 5.2, 5.3, 5.4

---

## Phase 6: 統合とテスト

### 6.1 ウォレット接続 UI の実装

**Task**: ウォレット接続ボタンとステータス表示を作成する

**Actions**:
- `src/components/shared/WalletConnector.tsx` を作成
- 接続ボタン（複数ウォレット対応）
- 接続状態表示（アドレス、残高）
- 切断ボタン
- ネットワーク表示

**Validation**:
```bash
# Manual test
# 1. 各ページでウォレット接続できること
# 2. アドレスと残高が表示されること
# 3. 複数のウォレット（Sui Wallet, Suiet等）が選択できること
```

**Dependencies**: 1.4

---

### 6.2 トランザクションステータス表示の実装

**Task**: トランザクションの進行状況を表示するコンポーネントを作成する

**Actions**:
- `src/components/shared/TransactionStatus.tsx` を作成
- トランザクション送信中の表示
- 成功・失敗の表示
- トランザクション digest のリンク（Sui Explorer）
- エラーメッセージの表示

**Validation**:
```typescript
// src/components/shared/TransactionStatus.test.tsx
test('shows success state', () => {
  render(<TransactionStatus status="success" digest="0xABC..." />);
  expect(screen.getByText(/成功/)).toBeInTheDocument();
  expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining('0xABC'));
});
```

**Dependencies**: なし

---

### 6.3 React Query キャッシュ戦略の実装

**Task**: 適切なキャッシュ戦略を設定する

**Actions**:
- `src/lib/react-query.ts` を作成
- QueryClient の設定（staleTime, cacheTime）
- ミューテーション後のキャッシュ無効化
- Optimistic updates（必要に応じて）

**Validation**:
```typescript
// Manual test
// 1. momentをmint後、moment一覧の供給数が更新されること
// 2. NFTを出品後、My NFTsとMarketplaceの両方が更新されること
// 3. NFTを購入後、Marketplaceから削除されること
```

**Dependencies**: 3.1, 4.1, 5.1

---

### 6.4 エラーハンドリングの統合

**Task**: 全体的なエラーハンドリングを実装する

**Actions**:
- `src/lib/errors.ts` を作成
- Sui トランザクションエラーのパース
- Walrus アップロードエラーのハンドリング
- ユーザーフレンドリーなエラーメッセージ
- エラーバウンダリの実装

**Validation**:
```bash
# Manual test
# 1. 供給切れのmomentでmintを試みる → 適切なエラー表示
# 2. 残高不足でNFTを購入 → 適切なエラー表示
# 3. Walrusアップロード失敗 → リトライ提案
```

**Dependencies**: なし

---

### 6.5 ナビゲーションとレイアウトの実装

**Task**: アプリ全体のナビゲーションとレイアウトを作成する

**Actions**:
- `src/components/shared/Navigation.tsx` を作成
- ページリンク（Admin, Moments, My NFTs, Marketplace）
- `src/app/layout.tsx` を更新
- グローバルスタイルの適用
- レスポンシブデザイン

**Validation**:
```bash
# Manual test
# 1. 各ページ間を移動できること
# 2. モバイルとデスクトップで適切に表示されること
# 3. Adminページはadminのみアクセス可能（オプション）
```

**Dependencies**: 1.4

---

### 6.6 E2E テストの作成（オプション）

**Task**: 主要なユーザーフローの E2E テストを作成する

**Actions**:
- Playwright または Cypress をセットアップ
- Admin ワークフロー（アップロード → 登録）のテスト
- Mint ワークフロー（初回/2回目）のテスト
- Marketplace ワークフロー（出品 → 購入）のテスト

**Validation**:
```bash
bun run test:e2e
# すべてのE2Eテストがパスすること
```

**Dependencies**: すべての Phase 完了後

---

### 6.7 ドキュメントの作成

**Task**: フロントエンドの使い方とデプロイ方法のドキュメントを作成する

**Actions**:
- `frontend/README.md` を更新
- セットアップ手順
- 環境変数の説明
- 開発サーバーの起動方法
- ビルドとデプロイ方法
- トラブルシューティング

**Validation**:
```bash
# 新しい環境でドキュメント通りにセットアップできること
```

**Dependencies**: なし

---

## Phase 7: デプロイと最終確認

### 7.1 Production ビルドの最適化

**Task**: Production ビルドを最適化する

**Actions**:
- Next.js の production build を実行
- バンドルサイズの確認と削減
- 画像最適化の確認
- Lighthouse スコアの確認

**Validation**:
```bash
cd frontend
bun run build
bun run start
# Lighthouse で Performance, Accessibility スコアを確認
```

**Dependencies**: 6.5

---

### 7.2 Testnet デプロイ

**Task**: Testnet 環境にデプロイする

**Actions**:
- Vercel または類似のホスティングにデプロイ
- 環境変数を設定（Testnet）
- デプロイ後の動作確認
- URL の共有

**Validation**:
```bash
# デプロイされたURLで全機能が動作することを確認
```

**Dependencies**: 7.1

---

### 7.3 最終動作確認

**Task**: すべての機能が正しく動作することを確認する

**Actions**:
- Admin ワークフロー全体のテスト
- Mint ワークフロー全体のテスト（初回/2回目）
- My NFTs 表示・出品のテスト
- Marketplace 表示・購入のテスト
- エラーケースのテスト

**Validation**:
```markdown
## 確認項目
- [ ] Admin: 動画アップロード → Sui登録が1画面で完結
- [ ] Admin: 30秒超動画がバリデーションで弾かれる
- [ ] Mint: 初回mint時にKioskが自動作成される
- [ ] Mint: 2回目以降のmintで既存Kioskが使用される
- [ ] My NFTs: Kiosk内のNFTのみが表示される
- [ ] My NFTs: "Kioskに入れる"/"Kioskから出す"ボタンが存在しない
- [ ] My NFTs: NFTを出品できる
- [ ] Marketplace: 出品中のNFTのみが表示される
- [ ] Marketplace: NFTを購入できる
- [ ] Marketplace: 購入後にMy NFTsに反映される
```

**Dependencies**: 7.2

---

## タスク依存関係グラフ

```
Phase 1 (基盤)
1.1 → 1.2 → 1.3 → 1.4
             ↓
            1.5

Phase 2 (Admin)
1.1 → 2.1 → 2.3 → 2.5
1.2 → 2.2 ↗     ↗
1.3 → 2.4 ------

Phase 3 (Mint)
1.3 → 3.1 → 3.3 → 3.5
1.5 → 3.2 → 3.4 ↗

Phase 4 (My NFTs)
1.3 → 4.1 → 4.2 → 4.3 → 4.5
3.2 ↗       ↓     ↓
           4.4 ---

Phase 5 (Marketplace)
1.3 → 5.1 → 5.2 → 5.5
1.5 ↗  ↓    ↓    ↗
      5.4 → 5.3 -
      3.2 ↗

Phase 6 (統合)
1.4 → 6.1
     6.2
3.1, 4.1, 5.1 → 6.3
               6.4
1.4 → 6.5
All → 6.6
     6.7

Phase 7 (デプロイ)
6.5 → 7.1 → 7.2 → 7.3
```

## 並列実行可能なタスク

以下のタスクは依存関係がないため、並列に実行できる:

- Phase 1: 1.1, 1.2, 1.5 は同時に開始可能
- Phase 2: 2.1, 2.2, 2.4 は並列実行可能
- Phase 3: 3.1 と 3.2 は並列実行可能
- Phase 4: 4.1 完了後、4.2 と 4.4 は並列実行可能
- Phase 5: 5.1 完了後、5.2 と 5.4 は並列実行可能
- Phase 6: 6.1, 6.2, 6.4, 6.7 は並列実行可能
