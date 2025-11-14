# Fight Moments NFT フロントエンド要件定義書（Next.js＋Sui dApp Kit＋Walrus）

## 1. 概要

本フロントは、Next.js上で以下を行う dApp UI を提供する。

1. **Admin**が動画をアップロード → Walrusに保存 → 返ってきたURIをそのままSuiのadmin関数に渡して「mint可能moment」を登録する一連の流れ
2. **一般ユーザー**が登録済みmomentを一覧して、自分のウォレットでmintする流れ
3. **ユーザー**が持っているFight Moment NFTを表示し、Kioskに預けたり出品したりできる流れ
4. **簡易マーケット**として、Kioskに出ているFight Moment NFTを一覧して買える流れ

Suiとの接続には、React向けに用意されている`@mysten/dapp-kit`のウォレット接続・署名APIを使う（Sui Wallet Standardに準拠しているため）｡ウォレット接続やトランザクション署名の部分はこのKitと同等のSuiet Wallet Kitなどを併用してもよいが、基本ラインはdapp-kitとする。([docs.sui.io][1])

---

## 2. 技術スタック要件

* フレームワーク: **Next.js 14+** (App Routerを推奨)
* 言語: **TypeScript**
* Sui接続: **`@mysten/sui` + `@mysten/dapp-kit`**

  * RPCでオブジェクトを読む
  * `useSignAndExecuteTransaction`系のhookでPTBを署名・実行する ([Mysten Labs TypeScript SDK Docs][2])
* ウォレット: Sui Wallet Standard対応（Sui Wallet, Suiet, Hanaなど）をdapp-kitでまとめて接続する ([docs.sui.io][1])
* Walrus連携: **Walrus TS SDK** を使用し、**upload relay経由で動画をアップロード**する。ブラウザから直接ノードに書くとリクエストが数千になるため、relay使用が前提。([Mysten Labs TypeScript SDK Docs][3])
* 状態・データ取得: React Query（`@tanstack/react-query`）を推奨
* UI: 好みのUIライブラリ（shadcn/UIなど）。Mint・List・Buyにわかりやすいボタンを配置する。

---

## 3. 画面構成と機能要件

### 3.1 Admin画面（Moment登録＋Walrusアップロード）

**目的**
1回の操作で「動画をWalrusにアップロード → URI/ハッシュ取得 → Suiのadminエントリ呼び出し」を行う。

**入力項目**

* 動画ファイル（必須・MP4など）
* サムネイル画像ファイル（必須・JPG/PNGなど）
* match_id
* fighter_a / fighter_b
* moment_type（セレクト）
* max_supply
* （任意）説明文

**処理フロー**

1. ファイル選択後、フロントがWalrusのupload relayに対して**2ファイル（動画＋サムネイル）をアップロード**する

   * エンドポイント例: `POST ${process.env.NEXT_PUBLIC_WALRUS_RELAY}/upload`（各ファイルごとに1回ずつ）
   * 各成功時に `{ uri: "walrus://...", hash: "...", blobId: "..." }` のようなレスポンスを受け取る（実際のフィールド名はWalrus SDKに合わせる）
   * **動画用URIとサムネイル用URIの両方を取得する**（Suietの`animation_url`→`url`の2段表示に対応）([std.suiet.app][8])
   * Relayを使うのは、公式が「直書きは~2200リクエストになるのでrelayを使え」としているため。([Mysten Labs TypeScript SDK Docs][3])
2. 取得した動画用`video_walrus_uri`とサムネイル用`thumbnail_walrus_uri`、および`walrus_hash`を、同じフォームにあるSuiの登録トランザクション（adminのentry）にそのまま渡す

   * ここで`@mysten/dapp-kit`の `useSignAndExecuteTransaction` を使ってPTBを署名・実行する ([Mysten Labs TypeScript SDK Docs][2])
3. 成功したらTx digestと新しく作られたmoment IDを表示し、一覧に反映させる

**UI要件**

* **動画の長さチェック**: ブラウザで動画ファイルのdurationを取得し、30秒を超える場合はWalrusにアップロードせずエラー表示する（この制限はコントラクト側では行わず、フロント側で実施する）
* アップロード進捗表示（%または「動画アップロード中…」「サムネイルアップロード中…」）
* 2ファイルのアップロード成功後に「Suiに登録中…」というステップ表示
* エラー時は「Walrusアップロード失敗」と「Suiトランザクション失敗」を区別して表示

---

### 3.2 Moment一覧 & Mint画面

**目的**
adminが登録した「mint可能moment」を誰でも見られ、残数があればウォレットでmintできるようにする。

**表示**

* match_id
* moment_type
* 残りmint数（`max_supply - current_supply`）
* Walrusサムネイル（`thumbnail_walrus_uri`を使って`<Image>`で表示）
* 登録時刻

**操作**

* "Mint"ボタンでpublic entryを呼ぶ
* 実行はユーザーウォレットの署名で行う（dapp-kit）([docs.sui.io][1])
* 成功したらMy NFTsに反映

**Kiosk管理要件**

* **FE-RQ-KIOSK-01**: 初回mint時にKiosk作成とmintを1つのPTB（Programmable Transaction Block）で実行すること
* **FE-RQ-KIOSK-02**: 2回目以降のmintでは既存のKioskを使用すること
* **FE-RQ-KIOSK-03**: mint前にユーザーがKioskを持っているか確認すること

---

### 3.3 My NFTs画面

**目的**
ユーザーのKiosk内にある「Fight Moments NFT」を一覧表示し、動画を閲覧したり、価格を付けて出品できるようにする。

**取得方法**

* ユーザーのKiosk内のNFTをSui RPCクライアントで取得する
* 取得したオブジェクトの中の「video_walrus_uri」「thumbnail_walrus_uri」「match_id」をgetterか直接フィールドから表示する
* 一覧表示ではサムネイルURI、詳細表示では動画URIを使う

**操作**

* 「価格を付ける（list）」ボタン

  * `kiosk::list` 相当のTxを組み、priceを指定する
  * 価格はSUI固定でもいい（ハッカソンなので単一通貨想定）([The Sui Blog][5])

**表示・UI要件**

* **FE-RQ-DISPLAY-01**: ウォレット直接保有ではなく、Kiosk内のNFTを表示すること
* **FE-RQ-DISPLAY-02**: 「Kioskに入れる」ボタンを削除すること（mint時に自動配置されるため不要）
* **FE-RQ-DISPLAY-03**: 「Kioskから出す」ボタンを削除すること（取り出し操作は禁止されているため）
* **FE-RQ-DISPLAY-04**: 「価格を付ける（list）」ボタンは維持すること

---

### 3.4 Marketplace（簡易）

**目的**
Kioskに「list」されたFight Moments NFTだけを一覧化し、Buyできるようにする。

**表示**

* サムネイル（`thumbnail_walrus_uri`を使用）
* match_id / moment_type
* price
* seller（Kiosk owner）

**操作**

* “Buy”ボタンで`kiosk::purchase`系のTxをPTBで組んで実行
* 成功後はMy NFTsをリフェッチして表示を更新

**データ取得**

* KioskオブジェクトやlistイベントをRPCで取得し、コレクションIDでフィルタ
* SuiのKioskは「place → list → purchase」の3手を基本にしており、これをそのまま使えばよい。([mystenlabs.com][4])

---

## 4. Walrus連携の要件

1. **必ずupload relayを使い、2ファイル（動画＋サムネイル）をアップロードすること**

   * WalrusのTS SDK自体が「relayを使えば1リクエストで済む、使わないと~2200リクになる」と明示しているため、フロント（Next.js）からはrelay経由にする。([Mysten Labs TypeScript SDK Docs][3])
   * **動画とサムネイルの両方をアップロードし、それぞれのURIを取得してからSuiのadmin関数を呼び出すこと**
2. **アップロード→Sui登録を1画面で続けて行うこと**

   * Adminは動画とサムネイルを選んで「登録」するだけの体験にする
   * **動画の長さは必ずブラウザでチェックし、30秒以内であることを確認してからWalrusにアップロードすること**（この制限はコントラクト側では行わないため、フロント側で必ず実施する）
3. **返ってきた2つのURI（動画用・サムネイル用）とハッシュをSui側にそのまま渡すこと**

   * コントラクトは「これらはすでにWalrusにあるもの」として扱う（コントラクト側ではURI形式のみをチェックし、実体確認はしない）
4. **環境変数でWalrusのエンドポイントを切り替えられること**

   * `NEXT_PUBLIC_WALRUS_RELAY_URL`
5. **アップロード失敗時のリトライ**

   * Walrus SDKにはリトライとバッチ化の仕組みが入っているので、それを有効化する（SDKのオプションで指定）([walrus.xyz][6])

---

## 5. Suiトランザクション要件

* すべての書き込み系操作（Admin登録、mint、Kiosk place・list・purchase）は **Programmable Transaction Block (PTB)** で生成し、`useSignAndExecuteTransaction` で送る。複数コマンドを1回で実行できるため。([docs.iota.org][7])
* ウォレットがSui Wallet Standardに準拠していれば、dapp-kitが `sui:signAndExecuteTransaction` をよしなに呼んでくれる。([docs.sui.io][1])
* RPCエンドポイントとpackageIdは.env管理にして、testnet/devnetの切り替えができるようにする。

---

## 6. 非機能要件

* **Next.jsのサーバーアクションは使わず、ウォレット署名が必要な操作はすべてクライアントコンポーネントで行う**（ウォレットはブラウザにあるため）
* **レスポンスのキャッシュ**はReact Queryを標準に、Suiのイベントを拾ったら該当クエリだけinvalidateする
* **型定義**はSuiのObjectResponseをTSで定義しておき、コントラクトのフィールド名変更に気づけるようにする
* **表示パフォーマンス**のため一覧表示では必ずサムネイルURI（`thumbnail_walrus_uri`）を使い、詳細表示や再生時のみ動画URI（`video_walrus_uri`）を使う
* **30秒制限**: 動画アップロード前にブラウザでファイルのdurationを取得し、30秒を超える場合はエラーとしてアップロードを中止する（この制限はコントラクト側では行わないため、フロント側で必ず実施する）

[1]: https://docs.sui.io/standards/wallet-standard?utm_source=chatgpt.com "Wallet Standard"
[2]: https://sdk.mystenlabs.com/typedoc/modules/_mysten_dapp-kit.html?utm_source=chatgpt.com "@mysten/dapp-kit | Documentation"
[3]: https://sdk.mystenlabs.com/walrus?utm_source=chatgpt.com "Walrus SDK | Mysten Labs TypeScript SDK Docs"
[4]: https://www.mystenlabs.com/blog/empowering-creators-with-sui-kiosk?utm_source=chatgpt.com "Empowering Creators with Sui Kiosk"
[5]: https://blog.sui.io/kiosks-nfts-royalties-explained/?utm_source=chatgpt.com "All About Kiosks"
[6]: https://www.walrus.xyz/blog/typescript-sdk-upload-relay-upgrade?utm_source=chatgpt.com "Powering More Apps with Upload Relay"
[7]: https://docs.iota.org/developer/ts-sdk/dapp-kit/wallet-hooks/useSignAndExecuteTransaction?utm_source=chatgpt.com "useSignAndExecuteTransaction"
