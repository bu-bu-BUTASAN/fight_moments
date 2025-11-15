# 📸 スクリーンショット撮影ガイド

ハッカソン発表資料用のスクリーンショット撮影手順

## 必要なスクリーンショット（4枚）

### 1. Landing Page（ヒーローセクション）
**ファイル名**: `01_landing.png`

**撮影内容**:
- トップページ全体（ファーストビュー）
- プロジェクトタイトル「Fight Moments NFT」
- キャッチコピーやメインビジュアル
- CTA（Mint開始ボタンなど）

**撮影ポイント**:
- ブラウザ幅: 1920px（デスクトップビュー）
- スクロール位置: ページトップ
- ウォレット接続前の状態でOK

---

### 2. Mint画面（Moment選択 + Mint実行）
**ファイル名**: `02_mint.png`

**撮影内容**:
- Momentカード一覧表示
- 各Momentの情報（動画サムネイル、タイトル、Supply情報）
- Mintボタンが表示されている状態

**撮影ポイント**:
- 2-3個のMomentカードが見える状態
- Supply情報（例: 5/10 Minted）が分かるように
- ウォレット接続後の状態

**理想的な追加要素**:
- ホバー状態のカード（可能であれば）
- Mint実行中のローディング状態（別途撮影推奨）

---

### 3. NFT詳細ページ（Walrus動画再生）
**ファイル名**: `03_nft_detail.png`

**撮影内容**:
- NFT詳細情報（Moment名、シリアルナンバー、説明）
- **Walrus動画プレイヤー（再生中または再生可能状態）**
- メタデータ情報
- Sui ExplorerへのリンクやObject IDなど

**撮影ポイント**:
- **動画が表示されていることが最重要**
- シリアルナンバー（例: #3/10）が見えるように
- Walrus URLやObject IDも含める
- 動画再生ボタンや再生中の状態が分かるとベスト

**技術的アピールポイント**:
- この画面でWalrus統合の成功を証明できます

---

### 4. Marketplace（NFT一覧）
**ファイル名**: `04_marketplace.png`

**撮影内容**:
- Marketplace画面
- 複数のNFTカード表示
- 価格情報や購入ボタン（実装されている場合）
- フィルターやソート機能（あれば）

**撮影ポイント**:
- 2-4個のNFTカードが見える状態
- グリッドレイアウトが分かるように
- 各NFTのサムネイルやタイトル、価格が見やすく

**オプション**:
- NFT詳細モーダル（開いた状態）
- 購入フロー（実装済みの場合）

---

## 撮影手順

### 推奨ツール
- **macOS**: `Cmd + Shift + 4` → スペースキーでウィンドウ全体
- **Windows**: `Win + Shift + S`
- **Chrome拡張**: Awesome Screenshot, Fireshot（フルページ撮影可能）

### 撮影設定
- **解像度**: 1920x1080以上（Retinaディスプレイならそのまま）
- **フォーマット**: PNG（高品質）
- **ブラウザ**: Chrome推奨（DevTools表示なし）
- **ズーム**: 100%（拡大縮小なし）

### 撮影チェックリスト
- [ ] ブラウザのアドレスバーやブックマークバーを非表示（F11フルスクリーン）
- [ ] デベロッパーツールを閉じる
- [ ] 不要なブラウザ拡張のアイコンを隠す
- [ ] ダミーデータが本番らしく見えるか確認
- [ ] テキストが読める解像度か確認

---

## 保存先

すべてのスクリーンショットをこのディレクトリ（`/docs/screenshots/`）に保存してください。

```
docs/
└── screenshots/
    ├── 01_landing.png
    ├── 02_mint.png
    ├── 03_nft_detail.png
    └── 04_marketplace.png
```

---

## オプション: 追加スクリーンショット

余裕があれば以下も撮影しておくと説得力UP:

### 5. Admin画面（Moment登録）
**ファイル名**: `05_admin.png`
- Walrusアップロード画面
- Moment登録フォーム

### 6. ウォレット接続
**ファイル名**: `06_wallet.png`
- Sui Walletとの接続画面

### 7. Transaction Success
**ファイル名**: `07_transaction.png`
- Mint成功時のモーダルやトランザクション確認

---

## 撮影後の確認

✅ 各画像ファイルが存在するか
✅ ファイルサイズが大きすぎないか（1枚あたり < 2MB推奨）
✅ 画像がぼやけていないか
✅ 重要な情報が見切れていないか
✅ Walrus動画が表示されているか（特に03番）

---

撮影完了後、README.mdの該当箇所に以下の形式で埋め込まれます:

```markdown
## 📸 スクリーンショット

### Landing Page
![Landing Page](./docs/screenshots/01_landing.png)

### Mint画面
![Mint Screen](./docs/screenshots/02_mint.png)

### NFT詳細（Walrus動画再生）
![NFT Detail with Walrus Video](./docs/screenshots/03_nft_detail.png)

### Marketplace
![Marketplace](./docs/screenshots/04_marketplace.png)
```

頑張ってください！ 🚀
