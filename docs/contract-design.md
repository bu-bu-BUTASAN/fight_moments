# Fight Moments NFT 要件定義書（Walrus＋Kiosk前提・フロント対応版）

## 1. 概要

本システムは、試合中の「決定的瞬間」をSuiブロックチェーン上でNFTとして発行・流通させるdAppである。
どの瞬間をNFT化してよいかは運営（admin）がオンチェーンで定義し、実際のmintは各ユーザーが自分のウォレットで行う。
動画などの大容量メディアは **Walrus に保存し、その参照情報（URI・Blob ID・ハッシュなど）だけをSui上のNFTに保持** することで、チェーンサイズを抑えつつ改ざん耐性を確保する。Walrusにはブラウザから直接書くと多数のリクエストが必要になるため、公式が紹介しているupload relayを使う前提にする。([Mysten Labs TypeScript SDK Docs][2])

さらに本システムでは、**Sui Kioskの仕組み**に乗せて、ユーザーが保有するNFTをKioskに預けてlistし、フロントから簡易マーケットとして一覧表示できるようにする。価格や取引ルールはKiosk側に持たせ、NFT本体は識別に必要なメタデータのみを保持する。これはSuiが示す「Kioskにあるオファーをマーケットがウォッチして表示する」やり方に一致する。([Medium][3])

---

## 2. 方針

1. **使用通貨はSUIに固定**

   * Kioskでの取引（list/purchase）はSUI建てのみとする。
   * 他の通貨（USDC等）への対応は将来の拡張として検討。

2. **ロイヤリティは"将来の展望"としてメタデータだけ保持し、今回のハッカソン実装では自動分配は行わない**

   * ロイヤリティ分配先として「ファイターA」「ファイターB」「運営」の3者を想定し、それぞれの分配比率（bps）をTransferPolicyに設定できる構造にしておく。
   * 分配比率はadminのみが変更可能とする（AdminCapによる制御）。
   * 実際の強制・徴収はKiosk側でTransferPolicyを適用したときに有効化する。([The Sui Blog][1])
   * ただし、シンプルな試作とするため、初期実装では必須要件とせず、将来の拡張として位置づける。

3. **動画・画像はWalrusに保存し、NFTにはWalrus参照を載せる**

   * NFTが持つのはWalrusのURI / Blob ID / ハッシュのような「指し示すための情報」のみ。
   * 実データはWalrusが保持し、Sui側では存在確認などの重いI/Oはしない。([Mysten Labs TypeScript SDK Docs][2])

4. **配信APIとの自動連携はオンチェーンではイベントのみ出す**

   * コントラクトはmoment登録時にイベントをemitする。
   * オフチェーン（Next.js＋バックエンド）がこれを購読してUIや配信側を更新する。

5. **Kioskと簡易マーケットはハッカソン範囲に含める**

   * ユーザーがmintしたNFTをKioskに`place`できるようにする（Kioskが扱えるオブジェクトにする）。
   * 価格はSui Kioskの`list`で管理し、NFT側には価格を保持させない。
   * NFTにはコレクションIDや試合IDなどマーケット表示に必要な最低限のメタデータだけを持たせる。([Medium][3])

---

## 3. スコープ

### 含む

* adminによる「mint可能moment」のオンチェーン登録
* ユーザーによるウォレットからのmint（supplyチェックあり）
* NFTへのWalrus参照情報（URI/Blob ID/ハッシュ）の格納
* moment作成時のイベントemit
* 公開getter
* **NFTがKioskに置かれたときに識別できるようにするためのメタデータ（collection_id, match_id, moment_type など）**
* **KioskにlistされたNFTをフロントがフィルタ表示できるようにするメタデータ**

### 含まない

* Walrusへの実ファイルアップロード処理そのもの（Next.js＋Walrus SDK＋upload relayで実施）([Mysten Labs TypeScript SDK Docs][2])
* Kioskの高度なポリシー（ロイヤリティ強制・レンタル・複数通貨決済など）
* オンチェーンでの配信APIコール

---

## 4. 機能要件

### 4.1 初期化・権限管理

* **RQ-INIT-01**: コントラクト初期化時にAdminCapを1つだけ発行し、デプロイアカウントへ付与すること。
* **RQ-INIT-02**: AdminCapを持たないアカウントは管理関数を実行できないこと。
* **RQ-INIT-03**: 将来、AdminCapの譲渡・追加ができるように拡張可能な形にしておくこと。
* **RQ-INIT-04**: init関数でTransferPolicy<FightMomentNFT>を作成し、共有オブジェクトとして公開すること。
* **RQ-INIT-05**: TransferPolicyCapは将来のルール追加に備えて管理用に保持すること。
* **RQ-INIT-06**: 使用通貨はSUIに固定する。Kioskとの連携ではSUIのみを取引通貨として扱う。

### 4.2 mint可能momentの登録（adminのみ）

* **RQ-MOMENT-01**: Adminは以下を指定してmint可能momentを作成できること。

  * match_id
  * fighter_a / fighter_b
  * moment_type
  * video_walrus_uri（動画用、Suietの`animation_url`相当）
  * thumbnail_walrus_uri（サムネイル用、Suietの`url`相当）
  * walrus_hashまたはblobの検証情報
  * max_supply
  * （任意）creatorアドレス（将来Kioskポリシーで利用するため）
* **RQ-MOMENT-02**: 作成時点でcurrent_supplyは0に初期化されること。
* **RQ-MOMENT-03**: match_idとmoment_typeが空の場合はエラーとすること。
* **RQ-MOMENT-04**: 作成時に `MomentMinted` イベントをemitし、momentのID・match_id・moment_typeを含めること。
* **RQ-MOMENT-05**: 動画用Walrus URIとサムネイル用Walrus URIの両方を必須項目とする（本システムは動画とサムネをWalrusに置く前提。Suietの`animation_url`→`url`の2段表示に対応）。([std.suiet.app][11])
* **RQ-MOMENT-06**: コントラクトはURI/IDの**形式のみ**検証し、Walrusへの到達性や実体確認は行わない（フロント/relayで完了済みである前提）。([Mysten Labs TypeScript SDK Docs][2])

### 4.3 ユーザーによるmint

* **RQ-MINT-01**: ユーザーは公開entryを呼び出し、特定のmint可能momentを指定してNFTをmintできること。
* **RQ-MINT-02**: mint時に以下を検証すること

  1. 対象momentが存在する
  2. current_supply < max_supply
  3. momentが非アクティブでない
* **RQ-MINT-03**: mint成功後、対象momentのcurrent_supplyを1増加させること。
* **RQ-MINT-04**: mintされたNFTには、元momentに登録された動画Walrus URI・サムネイルWalrus URIの両方と、基本メタデータ（match_id, moment_type, collection_id相当）をそのままコピーすること。
* **RQ-MINT-06**: 上限に達している場合はエラーを返すこと。
* **RQ-MINT-07**: NFTには、KioskやマーケットがこのNFTをdApp由来と判定できるようなcollection_nameまたはcollection_idを必ず付与すること。([Sui Developer Forum][4])
* **RQ-MINT-08**: mint関数はユーザーのKioskとKioskOwnerCapを引数として受け取ること。
* **RQ-MINT-09**: mint時にNFTを自動的にKiosk内に固定配置（lock）し、Kioskからの直接取り出しを不可能にすること。
* **RQ-MINT-10**: Kioskを持たないユーザーは、mint実行前にKioskを作成する必要があること。

### 4.4 Kiosk連携のための最小要件

* **RQ-KIOSK-01**: Fight Moment NFTはKioskの`place`/`list`/`purchase`の対象として扱えるよう、SuiのKioskが要求するオブジェクト能力（例: `key`, `store`）を満たすこと。NFT自体を共有オブジェクトにする必要はない。([Blockberry API][5])
* **RQ-KIOSK-02**: 価格（ask price）はKioskのlist機能で管理し、NFT本体には価格を保存しないこと。NFTをKiosk内に固定配置（lock）後、listで出品可能にする。

  * フロントはKioskオブジェクトまたはKioskのイベントから価格を取得する。([Medium][3])
* **RQ-KIOSK-03**: NFT本体には、マーケットが表示に使うメタデータ（collection_id, match_id, moment_type, thumbnail_walrus_uri）を必ず入れておくこと。これらはKioskから取り出したときに表示できるようにするため。サムネイルURIはKioskのlist一覧表示で即座に使える。
* **RQ-NFT-05**: NFT本体には価格や販売状態を持たせず、メタデータ（collection_id、match_id、moment_type、サムネイルURIなど）のみを保持すること。
* **RQ-NFT-06**: 価格・在庫情報はKioskのイベントから取得すること。
* **RQ-KIOSK-05**: 将来、TransferPolicyを適用してロイヤリティや転送制限を強制できるよう、NFTにcreator/collection情報を残す。今回は実行しない。([Binance][6])

### 4.5 TransferPolicy管理

* **RQ-POLICY-01**: TransferPolicyにロイヤリティなどのルールを追加できる管理関数を用意すること（将来の拡張用）。
* **RQ-POLICY-02**: 初期状態ではルール無しのTransferPolicyとし、取引は自由に行えること。
* **RQ-POLICY-03**: 使用通貨はSUIに固定すること。Kioskでのlist/purchaseはSUIのみを受け付ける。

### 4.6 ロイヤリティ情報の保持（展望・オプション機能）

* **RQ-ROYALTY-01**: TransferPolicyに「ファイターA」「ファイターB」「運営」の3者への分配比率（bps: 10,000分率）を設定できる構造を用意すること。
* **RQ-ROYALTY-02**: 各分配先のアドレスと比率は、AdminCapを持つアカウントのみが変更可能とすること。
* **RQ-ROYALTY-03**: 3者の分配比率の合計は妥当な範囲（例：合計0-2,000 bps = 0-20%）に収まるようバリデーションを行うこと。
* **RQ-ROYALTY-04**: 初期実装では、この3者分配機能は**オプション（必須要件ではない）**として位置づけ、シンプルな試作では省略可能とする。
* **RQ-ROYALTY-05**: 将来、KioskでTransferPolicyを有効化したときに、設定された分配比率に基づいて自動的にロイヤリティ徴収・分配が行われるようにする。([The Sui Blog][1])
* **RQ-ROYALTY-06**: ロイヤリティ分配先のアドレスが未設定の場合は、該当分配先への分配をスキップするか、エラーとするかを明確にすること。

### 4.7 Walrus参照の扱い

* **RQ-WALRUS-01**: コントラクトは動画・サムネイルを直接保持しない。代わりにWalrusの動画URIとサムネイルURIの2つ、およびBlob ID、検証用ハッシュを保持する。([Mysten Labs TypeScript SDK Docs][2])
* **RQ-WALRUS-02**: 動画URI/サムネイルURI/ID/ハッシュのセットは後から参照・検証できるよう1つの構造体として保持する。
* **RQ-WALRUS-03**: 動画URIまたはサムネイルURIのいずれかが空の場合は登録エラーとする。
* **RQ-WALRUS-04**: フロントはこれら2つのURIを使って動画とサムネイルを取得・表示する。一覧表示ではサムネイルURIを使い、詳細表示では動画URIを使う。

### 4.8 公開getter

* **RQ-GET-01**: フロントが表示に使うフィールド（match_id, fighters, moment_type, 残りmint数, walrus_uri, collection_id）を取得するpublic関数を提供する。
* **RQ-GET-02**: これらのgetterはAdminCap不要で呼び出せる。
* **RQ-GET-03**: 残りmint数は `max_supply - current_supply` を返す。
* **RQ-GET-04**: Kiosk側がマーケット表示に使いやすいよう、試合ID・コレクション識別子・サムネイルURIをまとめて返すgetterを用意する。

### 4.9 Object Display（任意・推奨）

* **RQ-DISPLAY-01**: NFTにSui Object Displayテンプレートを設定できるようにすること。これにより、フロントが全フィールド名を知らなくても標準的な表示が可能になる。([docs.sui.io][11])
* **RQ-DISPLAY-02**: Displayテンプレートには以下を含めることを推奨する：
  * `name`: モーメントの名称（例: "Match #{match_id} - {moment_type}"）
  * `description`: 説明文
  * `image_url`: サムネイルWalrus URI（`{thumbnail_walrus_uri}`）
  * `video_url`: 動画Walrus URI（`{video_walrus_uri}`）
* **RQ-DISPLAY-03**: Object DisplayはSuiの公式推奨表示方式であり、Wallet・Explorer・Marketplaceとの互換性が高まる。

### 4.10 イベント

* **RQ-EVENT-01**: mint可能moment登録時にイベントをemitし、momentのID・match_id・moment_typeを含める。
* **RQ-EVENT-02**: オフチェーンはこのイベントをトリガーにWalrusへのアップロード結果とUIを同期させる。
* **RQ-EVENT-03**: イベントスキーマはdocsに固定して記載する。
* **RQ-EVENT-04**: （任意）Kioskへのlist操作でもイベントをemitできるようにしておくと、Marketplace画面の自動更新が容易になる。([The Sui Blog][7])

---

## 5. 非機能要件

* **NFR-01**: WalrusへのアップロードとSuiへの登録は分離された処理として扱う（先にWalrusにアップしてURIを得てからadmin関数を呼ぶ）。([Walrus][8])
* **NFR-02**: コントラクトはWalrusへの到達性チェックや大容量I/Oを行わない。検証は形式チェックに限定し、外部確認はオフチェーンに委譲する。
* **NFR-03**: オンチェーンデータはURI/ID/ハッシュなどメタデータ中心とし、トランザクションサイズを小さく保つ。([ULAM LABS][9])
* **NFR-04**: Kioskを用いるための最低限の識別子（collectionやcreator）はNFT全件に持たせ、後からマーケットを拡張してもスキーマ変更が不要なようにする。([GetBlock.io][10])
* **NFR-05**: イベントはフロント・バックエンドが購読しやすい簡潔なペイロードにする。
* **NFR-06**: 将来のTransferPolicy導入を見据え、NFT構造はSuiのNFT標準の考え方（オブジェクト＋ルール）から外れないようにする。([The Sui Blog][1])
* **NFR-07**: 取引通貨はSUIに固定し、複数通貨対応による複雑性を回避する。将来の拡張として他の通貨（USDC等）への対応を検討可能。

[1]: https://blog.sui.io/nft-standards-royalties/?utm_source=chatgpt.com "All About NFT Standards"
[2]: https://sdk.mystenlabs.com/walrus?utm_source=chatgpt.com "Walrus SDK | Mysten Labs TypeScript SDK Docs"
[3]: https://medium.com/the-sui-stack/code-in-move-6-minting-nfts-on-sui-with-kiosk-5d9ba1636a7b?utm_source=chatgpt.com "Code in Move [6] — Minting NFTs with Kiosk on Sui"
[4]: https://forums.sui.io/t/nft-object-display-proposal-accepted/4872?utm_source=chatgpt.com "[NFT] Object Display proposal (Accepted)"
[5]: https://docs.blockberry.one/docs/kiosk?utm_source=chatgpt.com "Kiosk - Blockberry API"
[6]: https://www.binance.com/en/square/post/1029987?utm_source=chatgpt.com "Sui Kiosk: A crypto asset “self-service machine” for creators"
[7]: https://blog.sui.io/kiosk-revolutionizing-digital-asset-transfers/?utm_source=chatgpt.com "Sui Kiosk Demystified: Revolutionizing Digital Asset ..."
[8]: https://docs.wal.app/operator-guide/upload-relay.html?utm_source=chatgpt.com "Upload relay: functioning and operation - Walrus"
[9]: https://www.ulam.io/blog/demystifying-the-sui-blockchain-a-comprehensive-overview?utm_source=chatgpt.com "Demystifying the SUI Blockchain: A Comprehensive ..."
[10]: https://getblock.io/blog/best-sui-nft-marketplaces-2025/?utm_source=chatgpt.com "Best Sui NFT Marketplaces in 2025"
[11]: https://docs.sui.io/standards/display "Sui Object Display Standard"
