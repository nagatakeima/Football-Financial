# Football Tactics: Unseated

複雑なクラブ経営や面倒な試合アクション操作を一切排除し、「デッキ構築（ビルド）」と「リソース管理」に特化した、サバイバル・フットボール・ローグライトゲームの開発プロジェクトです。
プレイヤーはいつ解任されるか分からない極限状態のサッカー監督となり、限られたリソースでチームを強化して昇格・優勝を目指します。

## プロジェクト概要

- **プラットフォーム:** Webブラウザ (PC / スマホ両対応)
- **技術スタック:** HTML5, CSS3, JavaScript (UI層) + Phaser 3 (2D試合描画・キャンバス層)
- **ビジュアル:** カイロソフト風のトップダウン（見下ろし型）2Dドット絵スタイル

## ディレクトリ構成

- `index.html`: ゲームのエントリーポイント。UIとPhaser3のキャンバスを読み込みます。
- `style.css`: UI部分（マネジメントフェーズやHUD）のスタイリング。
- `js/main.js`: Phaser 3を用いた試合フェーズの2D描画ロジックおよびUI制御。
- `docs/`: ゲームの仕様書（Wikiデータ）が格納されています。

## ゲーム仕様書（Wiki）

ゲームの詳細な仕様やシステムについては、以下のドキュメントを参照してください。

### 00_Overview (基本概要)
- [ゲーム概要・コアサイクル](docs/00_Overview/01_GameOverview.md)
  - ゲームのコンセプト、3つの階層（シーズン）、サバイバル（即時解任）ルールについて。
- [試合システム](docs/00_Overview/02_MatchSystem.md)
  - マクロ（宝物）とミクロ（コマンド）の相互作用、アウェー・天候ギミックなどの試合仕様。
- [選手・ケミストリーシステム](docs/00_Overview/03_PlayerAndChemistry.md)
  - 選手のパラメータ、フォーメーション配置によるケミストリーリンク（国籍・所属縛りなど）の仕様。
- [イベント・リソースシステム](docs/00_Overview/04_EventsAndResources.md)
  - 試合間の行動力（AP）と資金の管理、Lonestar形式のランダムイベントとレア度変動の仕組み。
- [ミクロ（コマンド）リスト全100種](docs/00_Overview/05_MicroCommandsList.md)
  - 試合中に使用する全100種類の戦術コマンド一覧（汎用・専用、レアリティ別）。
- [UIおよびUX](docs/00_Overview/06_UIandUX.md)
  - マネジメントフェーズと試合フェーズのUIデザイン方針について。

### 10_MatchEngine_Core (試合エンジン・コア)
- [試合ルールとAI](docs/10_MatchEngine_Core/07_1_MatchRules_and_AI.md)
  - ゲーム内の試合ルールやAIの基本概念について。
- [試合エンジン・コア](docs/10_MatchEngine_Core/07_MatchEngine_Core.md)
  - 2Dマッチエンジン（ボトムアップ型AI、Pitch Matrixなど）の仕組み。
- [フォーメーション＆可変システム](docs/10_MatchEngine_Core/07_2_Formation_and_Shape.md)
  - 創発的な陣形可変とセットプレー配置。
- [チーム戦術＆意思決定アルゴリズム](docs/10_MatchEngine_Core/07_3_TeamTactics.md)
  - 意思決定プロトコルと構造的相性。

### 20_AI_Base (ポジション別AIベース)
- [GKの基本AI](docs/20_AI_Base/08_AI_Base_GK.md)
- [DFの基本AI](docs/20_AI_Base/09_AI_Base_DF.md)
- [MFの基本AI](docs/20_AI_Base/10_AI_Base_MF.md)
- [FWの基本AI](docs/20_AI_Base/11_AI_Base_FW.md)

### 30_AI_Positions (個別役割AI)
- [ロールリスト](docs/30_AI_Positions/00_Role_List.md)
- 各ポジション役割のAI仕様： [CB](docs/30_AI_Positions/12_AI_Pos_CB.md) / [SB](docs/30_AI_Positions/13_AI_Pos_SB.md) / [CDM](docs/30_AI_Positions/14_AI_Pos_CDM.md) / [CM](docs/30_AI_Positions/15_AI_Pos_CM.md) / [CAM](docs/30_AI_Positions/16_AI_Pos_CAM.md) / [WG](docs/30_AI_Positions/17_AI_Pos_WG.md) / [CF](docs/30_AI_Positions/18_AI_Pos_CF.md)

### 40_System_Overrides (システム・オーバーライド)
- [システム・オーバーライド](docs/40_System_Overrides/20_System_Overrides.md)
  - チーム戦術（指令）によるAI挙動のバイアス調整などの仕組み。

## 実行方法

特別なサーバー設定は不要です（CDNからPhaser 3を読み込んでいます）。
ローカルで起動する場合は、リポジトリのルートで簡易的なローカルサーバーを立ち上げてアクセスしてください。

例（Python 3 の場合）:
```bash
python -m http.server 8000
```
その後、ブラウザで `http://localhost:8000` にアクセスしてください。
