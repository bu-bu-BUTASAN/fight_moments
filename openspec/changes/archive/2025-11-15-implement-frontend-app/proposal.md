# Proposal: implement-frontend-app

## Summary

Next.js + Sui dApp Kit + Walrus による Fight Moments NFT フロントエンドアプリケーションの実装。Admin による動画アップロード・登録、ユーザーによる NFT mint、My NFTs 表示、簡易マーケットプレイス機能を提供する。

## Motivation

現在、Fight Moments NFT のスマートコントラクトは実装済みだが、ユーザーが実際に操作するフロントエンドアプリケーションが存在しない。以下の課題を解決する必要がある:

1. **Admin の運用負担**: 動画を Walrus にアップロードし、URI を取得して Sui のコントラクトに登録する一連の操作を手動で行うのは困難
2. **ユーザー体験の欠如**: 一般ユーザーが NFT を mint したり、保有している NFT を確認・出品する手段がない
3. **マーケットプレイスの不在**: Kiosk に出品された NFT を購入する UI が存在しない

## Goals

### Primary Goals

1. **Admin Workflow**: 動画とサムネイルを Walrus にアップロードし、Sui コントラクトに moment を登録する一連の操作を 1 画面で完結させる
2. **User Minting**: ユーザーが登録済み moment を一覧して mint できる UI を提供し、初回 mint 時に Kiosk を自動作成する
3. **NFT Management**: ユーザーが保有する NFT（Kiosk 内）を表示し、価格を付けて出品できる機能を提供
4. **Marketplace**: Kiosk に出品された NFT を一覧して購入できる簡易マーケットプレイスを提供

### Non-Goals

- サーバーサイドレンダリングでの動画処理（すべてクライアントサイドで実行）
- 複雑な検索・フィルタリング機能（ハッカソン MVP のため）
- マルチトークン対応（SUI 固定）
- NFT の Kiosk からの取り出し機能（コントラクトで禁止されているため）

## Stakeholders

- **Admin**: 動画をアップロードして moment を登録する運営者
- **NFT Collectors**: Fight Moments NFT を mint して収集するユーザー
- **NFT Traders**: NFT を売買するユーザー

## Design

詳細なアーキテクチャ設計は `design.md` を参照。

## Capabilities

この変更は以下の 4 つの capability に分割される:

1. **admin-upload-workflow**: Admin による Walrus アップロード + Sui 登録ワークフロー
2. **moment-minting-workflow**: ユーザーによる moment の mint ワークフロー（Kiosk 管理含む）
3. **nft-display-management**: ユーザーの NFT 表示・出品管理
4. **marketplace-integration**: 簡易マーケットプレイス機能

各 capability の詳細は `specs/<capability>/spec.md` を参照。

## Tasks

実装タスクの詳細は `tasks.md` を参照。

## Timeline

- Week 1: 依存関係のセットアップ、基盤構築、Admin ワークフロー
- Week 2: Mint ワークフロー、NFT 表示機能
- Week 3: マーケットプレイス機能、テスト、統合

## Risks

1. **Walrus Upload Relay の安定性**: Relay サービスの可用性に依存
   - Mitigation: エラーハンドリングとリトライ機能の実装
2. **Kiosk 管理の複雑性**: 初回 mint 時の Kiosk 作成を PTB で適切に処理する必要がある
   - Mitigation: Sui dApp Kit のドキュメントに従い、テストを十分に実施
3. **動画ファイルサイズ**: 大きな動画ファイルのアップロードに時間がかかる可能性
   - Mitigation: 30 秒制限をフロントエンドで強制し、進捗表示を実装

## Success Metrics

- Admin が動画アップロードから moment 登録まで 3 分以内に完了できる
- ユーザーが初回 mint（Kiosk 作成含む）を 1 トランザクションで完了できる
- NFT の表示から出品までのフローがスムーズに動作する
- マーケットプレイスで出品 NFT を購入できる
