# AGENTS.md - Football Tactics: Unseated 開発憲法

## 1. コミュニケーションと自律実行ルール（最重要）
- **完全日本語対応:** 計画（Plan）、進捗報告、PR説明文を含め、すべての出力を自然な**日本語**で行うこと（英語での返答は厳禁）。
- **質問ゼロ・ノンストップ完走:** 計画承認後は、「この方針で進めてよいか」「次のステップに進んでよいか」「コミットしてよいか」といった人間への確認待ち（質問）は一切行わず、実装・検証・PR作成（Submit）まで自律的に一気通貫で完走すること。
- **不明点の自律解決（フォールバック）:**
  1. 指示された関数・変数・DOM要素が見つからない場合は、質問して止まるのではなく、リポジトリ内の関連ファイルを検索して既存の構造を特定し、不足しているメソッドやDOM要素は既存の設計に合わせて自ら新規実装して繋ぎ込むこと。
  2. 数値やUIの細部（余白・色・配置座標等）が未指定の場合は、既存のFC27風ダークエメラルドテーマ（`style.css`）に調和する最適な値を自己判断で決定し、PR説明文に事後報告すること。
  3. ドキュメント（`docs/`）と既存コードの実装が食い違う場合は**既存コードの書き方（変数名・データ構造）**を優先し、発見した食い違いを最終報告に列挙すること。
- **GitHub PR・コメント応答ルール:** 明示的に `@Jules` または `@google-jules` 宛てにメンションされていないコメントには反応しないこと。

## 2. プロジェクト構造とコアデータ仕様（必読）
- `index.html` / `style.css`: アウトゲーム（`#ui-layer`）とFC27風インゲーム戦術画面（`#match-screen-wrapper`）のDOM・スタイル定義。
- `js/models/masterData.js`: `window.MasterData`（`Managers`, `Formations`, `PlayerSkills`, `Relics`, `MicroCommands`, `Positions`, `Roles`）。
  - ※注意：`Formations[f].slots` の各要素は `{ id, expectedPosStr, baseMatrix: { tier, lane }, offsetX, offsetY }` を持ち、`offsetX/Y` は相対オフセット値を含む。
- `js/models/player.js`: `window.Player`。ステータスは `stats: { pass, shoot, defense, physical, speed, mental, stamina }` の7項目。試合中スタミナは `currentStamina`、長期疲労は `condition`（0〜100）。
- `js/models/team.js`: `window.Team`。チームの戦術志向は `team.manager.preference`（`Possession`, `Counter`, `HighPress`, `Retreat`）に保持される。
- `js/models/chemistry.js`: `window.ChemistrySystem`。隣接リンク計算と `dynamicStats` へのバフ適用を行い、`team.chemistryLinks = [{ from, to, level }]` を生成する。
- `js/models/gameState.js` / `league.js`: `window.gameState` / `window.League`。進行・資金・AP・試合後処理（`processPostMatch`）。
- `js/managementUI.js`: `window.managementUI`（`ManagementUI` クラス）。アウトゲーム全画面の描画とイベント処理。
- `js/main.js`: `MatchScene`（Phaser.Scene）。2.5Dピッチ・人型トークン描画、AI評価（`evaluateActions`）、物理・試合進行ループ（`tickMatch`, `simulateAction`）。

## 3. 絶対禁止事項（アンチパターン防止）
1. **自作パッチスクリプトの禁止:** `patch_*.js` 等の正規表現置換スクリプトを作成・実行してファイルを書き換えることは構文破壊やバックスラッシュ混入の原因となるため**絶対禁止**とする。必ず標準のファイル編集ツールで直接コードを編集すること。
2. **同名メソッドの重複定義禁止:** `ManagementUI` や `MatchScene` クラス内に既存のメソッドと同名のメソッドを追記して二重定義しないこと。必ず既存メソッドの位置を特定して置き換えること。
3. **`git reset` / `git checkout` による変更破棄の禁止:** 作業中に既存の実装変更を巻き戻さないこと。
4. **レガシーテストの実行禁止:** ルート直下の `test_*.js`, `deep_test.js`, `start_auto_play.js`, `verify_*.py` は旧仕様のモックに依存しているため実行しないこと。

## 4. PR提出（Submit）前の必須4段階セルフチェック
タスク完了時、コミットおよびSubmitを行う前に**必ず以下のコマンドをすべて実行し、エラーが0件であることを確認**すること：
1. **構文チェック:**
   `node --check js/main.js && node --check js/managementUI.js && node --check js/models/player.js && node --check js/models/team.js && node --check js/models/league.js && node --check js/models/gameState.js && node --check js/models/chemistry.js && node --check js/models/masterData.js`
2. **重複メソッド定義チェック:**
   `node -e 'const fs=require("fs");["js/main.js","js/managementUI.js"].forEach(f=>{const s=fs.readFileSync(f,"utf8"),re=/^\s{4}([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/gm,seen=new Set(),dupes=new Set(),ig=new Set(["if","for","while","switch","catch","function"]);let m;while((m=re.exec(s))!==null){if(!ig.has(m[1])){if(seen.has(m[1]))dupes.add(m[1]);seen.add(m[1]);}}if(dupes.size){console.error(f+" duplicate methods:",[...dupes]);process.exit(1);}});console.log("OK: No duplicate methods");'`
3. **一時ファイルの完全排除:**
   `rm -f patch_*.js verify_*.py *.log`
4. **全対象ファイルの差分反映確認:**
   `git status -s && git diff --stat` を実行し、指示されたすべての対象ファイルに差分が存在することを目視確認してから `git add` & Commit & Submit すること。
