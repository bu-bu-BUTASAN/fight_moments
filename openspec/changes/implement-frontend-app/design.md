# Design: implement-frontend-app

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   Admin    │  │    Mint      │  │   Marketplace    │    │
│  │   Screen   │  │   Screen     │  │     Screen       │    │
│  └─────┬──────┘  └──────┬───────┘  └────────┬─────────┘    │
│        │                 │                    │              │
│  ┌─────▼─────────────────▼────────────────────▼─────────┐  │
│  │          Sui dApp Kit (@mysten/dapp-kit)             │  │
│  │  - Wallet Connection (Sui Wallet Standard)           │  │
│  │  - Transaction Signing (useSignAndExecuteTransaction)│  │
│  │  - RPC Client (getObject, queryEvents)               │  │
│  └─────┬──────────────────────────────────────┬─────────┘  │
│        │                                       │            │
└────────┼───────────────────────────────────────┼────────────┘
         │                                       │
    ┌────▼──────┐                          ┌────▼─────┐
    │  Walrus   │                          │   Sui    │
    │  Storage  │                          │ Network  │
    │ (via SDK) │                          │   RPC    │
    └───────────┘                          └──────────┘
```

## Technology Stack

### Core Framework
- **Next.js 14+** (App Router): React ベースの SSR/CSR フレームワーク
- **TypeScript**: 型安全性の確保
- **React 19**: UI コンポーネントライブラリ
- **Tailwind CSS**: ユーティリティファーストの CSS フレームワーク

### Sui Integration
- **@mysten/sui** (v1.15+): Sui SDK（RPC クライアント、PTB ビルダー）
- **@mysten/dapp-kit** (v0.14+): React 向け Sui ウォレット接続・署名ライブラリ
  - Sui Wallet Standard 準拠
  - `useSignAndExecuteTransaction` hook による PTB 署名・実行
  - `useSuiClient` hook による RPC アクセス

### Walrus Integration
- **@mysten/walrus** (latest): Walrus TypeScript SDK
  - Upload Relay 経由のファイルアップロード
  - Blob ID、URI、Hash の取得
  - 自動リトライ・バッチ化機能

### State Management & Data Fetching
- **@tanstack/react-query** (v5): サーバー状態管理・キャッシング
  - Sui RPC のデータ取得をキャッシュ
  - Optimistic updates
  - 自動リフェッチ

### UI Components (Optional)
- **shadcn/ui** または類似の UI ライブラリ
- カスタムコンポーネント（Button, Form, Card, Modal など）

## Directory Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Root layout (dApp Kit Provider)
│   │   ├── page.tsx                 # Landing page
│   │   ├── admin/
│   │   │   └── page.tsx             # Admin upload screen
│   │   ├── moments/
│   │   │   └── page.tsx             # Moment list & mint
│   │   ├── my-nfts/
│   │   │   └── page.tsx             # User's NFT display
│   │   └── marketplace/
│   │       └── page.tsx             # Marketplace
│   ├── components/                   # React components
│   │   ├── admin/
│   │   │   ├── WalrusUploadForm.tsx # Video + thumbnail upload
│   │   │   └── MomentRegistrationForm.tsx
│   │   ├── moments/
│   │   │   ├── MomentCard.tsx       # Moment display card
│   │   │   └── MintButton.tsx       # Mint action button
│   │   ├── nfts/
│   │   │   ├── NFTCard.tsx          # NFT display card
│   │   │   └── ListingForm.tsx      # Listing price form
│   │   ├── marketplace/
│   │   │   ├── MarketplaceCard.tsx  # Listed NFT card
│   │   │   └── PurchaseButton.tsx   # Purchase action button
│   │   └── shared/
│   │       ├── WalletConnector.tsx  # Wallet connection UI
│   │       ├── TransactionStatus.tsx # Tx status display
│   │       └── VideoPlayer.tsx      # Walrus video player
│   ├── hooks/                        # Custom React hooks
│   │   ├── useSuiContract.ts        # Sui contract interaction
│   │   ├── useWalrusUpload.ts       # Walrus upload logic
│   │   ├── useKioskManager.ts       # Kiosk management
│   │   └── useMoments.ts            # Moment data fetching
│   ├── lib/                          # Utility libraries
│   │   ├── sui/
│   │   │   ├── client.ts            # Sui RPC client setup
│   │   │   ├── ptb.ts               # PTB builder utilities
│   │   │   └── kiosk.ts             # Kiosk utilities
│   │   ├── walrus/
│   │   │   ├── client.ts            # Walrus SDK setup
│   │   │   └── upload.ts            # Upload relay logic
│   │   └── constants.ts             # Contract addresses, etc.
│   ├── types/                        # TypeScript types
│   │   ├── sui.ts                   # Sui object types
│   │   ├── walrus.ts                # Walrus types
│   │   └── contract.ts              # Contract-specific types
│   └── env.d.ts                      # Environment variable types
├── public/                           # Static assets
├── .env.example                      # Environment variable template
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

## Key Design Decisions

### 1. Client-Side Only Execution

**Decision**: すべてのウォレット操作とトランザクション署名はクライアントコンポーネントで実行する。

**Rationale**:
- Sui Wallet Standard はブラウザ拡張機能としてのウォレットを前提としている
- 秘密鍵はユーザーのウォレットにのみ存在し、サーバーには送信されない
- Next.js の Server Components ではウォレット操作ができない

**Implementation**:
- すべての PTB 実行コンポーネントに `"use client"` ディレクティブを付与
- Server Components は静的コンテンツの表示のみに使用

### 2. Programmable Transaction Block (PTB) Architecture

**Decision**: すべての Sui トランザクションを PTB で構築する。

**Rationale**:
- 複数の操作を 1 トランザクションで実行できる（Kiosk 作成 + mint など）
- ガス効率が良い
- Sui の推奨パターン

**Implementation**:
```typescript
// Example: Create Kiosk and Mint in one PTB
const tx = new Transaction();
const [kiosk, kioskCap] = tx.moveCall({
  target: '0x2::kiosk::new',
  arguments: [],
});
const nft = tx.moveCall({
  target: `${PACKAGE_ID}::fight_moments::mint_and_lock`,
  arguments: [
    tx.object(momentId),
    kiosk,
    kioskCap,
  ],
});
tx.transferObjects([kioskCap], tx.pure.address(address));
```

### 3. Walrus Upload Relay Strategy

**Decision**: 必ず Upload Relay を経由してファイルをアップロードする。

**Rationale**:
- 直接アップロードは約 2,200 リクエストになり、非実用的
- Relay を使用すると 1 リクエストで完了
- Walrus SDK の公式推奨パターン

**Implementation**:
- 環境変数 `NEXT_PUBLIC_WALRUS_RELAY_URL` で Relay エンドポイントを指定
- 動画とサムネイルをそれぞれアップロード（計 2 リクエスト）
- 取得した URI を Sui コントラクトに渡す

### 4. Kiosk Management Pattern

**Decision**: 初回 mint 時に Kiosk を作成し、以降は既存の Kiosk を再利用する。

**Rationale**:
- ユーザーごとに 1 つの Kiosk を持つことで管理が簡素化される
- Kiosk 作成と mint を 1 PTB で実行することで、ユーザー体験が向上する
- 既存の Kiosk がある場合は、Kiosk 作成をスキップできる

**Implementation**:
```typescript
// Check if user has Kiosk
const kioskOwnerCap = await checkUserKiosk(address);

if (!kioskOwnerCap) {
  // First mint: create Kiosk + mint
  await createKioskAndMint(momentId);
} else {
  // Subsequent mint: use existing Kiosk
  await mintAndLock(momentId, kioskOwnerCap);
}
```

### 5. React Query Caching Strategy

**Decision**: Sui RPC のデータ取得に React Query を使用し、適切なキャッシュ戦略を実装する。

**Rationale**:
- RPC 呼び出しのコストを削減
- UI の応答性向上
- Optimistic updates によるユーザー体験の向上

**Implementation**:
```typescript
// Example: Fetch moments with caching
const { data: moments } = useQuery({
  queryKey: ['moments'],
  queryFn: () => fetchMoments(),
  staleTime: 60000, // 1 minute
  cacheTime: 300000, // 5 minutes
});

// Invalidate cache after mutation
const { mutate } = useMutation({
  mutationFn: mintNFT,
  onSuccess: () => {
    queryClient.invalidateQueries(['moments']);
    queryClient.invalidateQueries(['myNFTs']);
  },
});
```

### 6. Video Duration Validation

**Decision**: 動画の長さを 30 秒以内に制限し、フロントエンドでバリデーションを実施する。

**Rationale**:
- コントラクト側では動画の長さをチェックできない（Walrus URI のみを受け取る）
- ユーザーに早期にフィードバックを提供できる
- 無駄な Walrus アップロードを防ぐ

**Implementation**:
```typescript
const validateVideoDuration = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration <= 30);
    };
    video.src = URL.createObjectURL(file);
  });
};
```

## Error Handling Strategy

### Transaction Errors
- Sui トランザクションエラーをキャッチし、ユーザーフレンドリーなメッセージを表示
- エラーコードに基づいて適切なアクションを提示（例: 供給切れの場合は「売り切れ」と表示）

### Walrus Upload Errors
- アップロード失敗時のリトライ機能（最大 3 回）
- 進捗表示とキャンセル機能
- エラー時に詳細なログを表示

### Wallet Connection Errors
- ウォレット未接続時の明確な案内
- 複数のウォレット（Sui Wallet, Suiet, Hana など）への対応
- ネットワーク不一致の検出と通知

## Performance Considerations

### Image Optimization
- サムネイル表示には必ず `thumbnail_uri` を使用
- 詳細表示・再生時のみ `video_uri` を読み込む
- Next.js の `<Image>` コンポーネントを使用

### Code Splitting
- App Router による自動コード分割
- Dynamic imports で重いコンポーネントを遅延読み込み

### Caching
- React Query による RPC データのキャッシュ
- SWR パターンでバックグラウンド更新

## Security Considerations

### Environment Variables
- 機密情報（RPC エンドポイント、Package ID など）は環境変数で管理
- `.env.example` でテンプレートを提供
- クライアント側で使用する変数には `NEXT_PUBLIC_` プレフィックスを付与

### Wallet Security
- トランザクション署名は常にユーザーのウォレットで実行
- フロントエンドは秘密鍵を一切扱わない
- PTB の内容をユーザーに明確に提示

### Input Validation
- すべてのユーザー入力をバリデーション
- ファイルタイプとサイズのチェック
- 動画の長さチェック

## Testing Strategy

### Unit Tests
- Utility functions（PTB builder, Kiosk manager など）
- React hooks のロジック

### Integration Tests
- Walrus アップロードフロー
- Sui トランザクション実行
- Kiosk 管理フロー

### E2E Tests (Optional)
- Admin ワークフロー全体
- Mint フロー
- Marketplace フロー

## Deployment Considerations

### Environment Setup
- Testnet と Devnet の環境変数を分離
- Vercel などの Next.js ホスティングプラットフォームを推奨
- 環境変数は Vercel の環境変数設定で管理

### Build Optimization
- Next.js の production build
- 静的アセットの最適化
- バンドルサイズの削減
