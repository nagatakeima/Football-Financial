const TacticalPreferences = {
    POSSESSION: 'Possession',
    COUNTER: 'Counter',
    HIGH_PRESS: 'HighPress',
    RETREAT: 'Retreat'
};
window.TacticalPreferences = TacticalPreferences;

const MasterData = {
    "Managers": [
        {
            "id": 1,
            "name": "Pep Guard",
            "preference": "Possession",
            "formations": [
                "4-3-3",
                "3-2-4-1",
                "4-1-4-1"
            ],
            "initialFunds": 1500000,
            "initialTrait": "ポゼッションの哲学"
        },
        {
            "id": 2,
            "name": "Jurgen K",
            "preference": "HighPress",
            "formations": [
                "4-3-3",
                "4-2-3-1",
                "4-4-2"
            ],
            "initialFunds": 1000000,
            "initialTrait": "ハードプレスの哲学"
        },
        {
            "id": 3,
            "name": "Jose M",
            "preference": "Retreat",
            "formations": [
                "4-2-3-1",
                "5-3-2",
                "4-3-3"
            ],
            "initialFunds": 1200000,
            "initialTrait": "堅守の哲学"
        },
        {
            "id": 4,
            "name": "Carlo A",
            "preference": "Counter",
            "formations": [
                "4-4-2",
                "4-3-1-2",
                "4-3-3"
            ],
            "initialFunds": 1000000,
            "initialTrait": "ベテランの統率"
        },
        {
            "id": 5,
            "name": "Zinedine Z",
            "preference": "Possession",
            "formations": [
                "4-3-3",
                "4-4-2",
                "3-5-2"
            ],
            "initialFunds": 2000000,
            "initialTrait": "大口スポンサー"
        }
    ],
    "PlayerSkills": [
        // 【1. パス＆トラップ系 (pass)】
        { id: 1, name: "パスマスター", category: "pass", effectType: "SUCCESS_RATE_UP", target: "pass", value: 15, condition: "always", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF"], description: "パス成功率UP" },
        { id: 2, name: "ワンタッチパサー", category: "pass", effectType: "SUCCESS_RATE_UP", target: "pass", value: 20, condition: "always", allowedPositions: ["CDM","CM","CAM","WG","CF"], description: "ダイレクトパス成功率UP" },
        { id: 3, name: "スルーパス職人", category: "pass", effectType: "SUCCESS_RATE_UP", target: "throughPass", value: 25, condition: "always", allowedPositions: ["CM","CAM","WG"], description: "スルーパス成功率UP" },
        { id: 4, name: "バックスピンフィード", category: "pass", effectType: "SUCCESS_RATE_UP", target: "longPass", value: 20, condition: "always", allowedPositions: ["CB","SB","CDM","CM"], description: "ロングパス成功率UP" },
        { id: 5, name: "レーザーパス", category: "pass", effectType: "SUCCESS_RATE_UP", target: "pass", value: 15, condition: "always", allowedPositions: ["CDM","CM","CAM"], description: "グラウンダーパスの弾速UP" },
        { id: 6, name: "方向付けトラップ", category: "pass", effectType: "SUCCESS_RATE_UP", target: "trap", value: 20, condition: "always", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF"], description: "トラップ直後のパス・シュート成功率UP" },
        { id: 7, name: "プレス耐性トラップ", category: "pass", effectType: "SUCCESS_RATE_UP", target: "trap", value: 25, condition: "underPressure", allowedPositions: ["CM","CAM","WG","CF"], description: "プレッシャー下でのトラップ成功率UP" },
        { id: 8, name: "ロングスロワー", category: "pass", effectType: "RANGE_UP", target: "throwIn", value: 100, condition: "always", allowedPositions: ["SB","WG","CB"], description: "スローインの飛距離UP" },
        { id: 9, name: "アーリークロッサー", category: "pass", effectType: "SUCCESS_RATE_UP", target: "cross", value: 20, condition: "always", allowedPositions: ["SB","CAM","WG"], description: "クロス成功率UP" },
        { id: 10, name: "ピンポイントクロス", category: "pass", effectType: "SUCCESS_RATE_UP", target: "cross", value: 25, condition: "attackingThird", allowedPositions: ["SB","CAM","WG"], description: "敵陣深くでのクロス成功率UP" },

        // 【2. シュート＆フィニッシュ系 (shoot)】
        { id: 11, name: "コントロールカーブ", category: "shoot", effectType: "SUCCESS_RATE_UP", target: "shoot", value: 20, condition: "penaltyAreaOut", allowedPositions: ["CAM","WG","CF"], description: "ペナルティエリア外からのカーブシュート成功率UP" },
        { id: 12, name: "無回転ミドル", category: "shoot", effectType: "SUCCESS_RATE_UP", target: "shoot", value: 25, condition: "penaltyAreaOut", allowedPositions: ["CM","CAM","WG"], description: "強烈なミドルシュート成功率UP" },
        { id: 13, name: "パワーシューター", category: "shoot", effectType: "SUCCESS_RATE_UP", target: "shoot", value: 15, condition: "always", allowedPositions: ["CM","CAM","WG","CF"], description: "シュートの威力・成功率UP" },
        { id: 14, name: "チップキック", category: "shoot", effectType: "SUCCESS_RATE_UP", target: "shoot", value: 30, condition: "1vs1", allowedPositions: ["CAM","WG","CF"], description: "GKとの1vs1でのループシュート成功率UP" },
        { id: 15, name: "ワンタッチゴーラー", category: "shoot", effectType: "SUCCESS_RATE_UP", target: "shoot", value: 25, condition: "oneTouch", allowedPositions: ["CAM","WG","CF"], description: "ダイレクトシュート成功率UP" },
        { id: 16, name: "アクロバティック", category: "shoot", effectType: "SUCCESS_RATE_UP", target: "shoot", value: 30, condition: "difficultAngle", allowedPositions: ["CF"], description: "難しい体勢からのシュート成功率UP" },
        { id: 17, name: "ニアハイぶち抜き", category: "shoot", effectType: "SUCCESS_RATE_UP", target: "shoot", value: 20, condition: "penaltyAreaIn", allowedPositions: ["WG","CF"], description: "ペナルティエリア内でのニア上シュート成功率UP" },
        { id: 18, name: "PKマイスター", category: "shoot", effectType: "SUCCESS_RATE_UP", target: "shoot", value: 50, condition: "penaltyKick", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF"], description: "PK成功率極大UP" },
        { id: 19, name: "エアバトラー", category: "shoot", effectType: "SUCCESS_RATE_UP", target: "header", value: 20, condition: "always", allowedPositions: ["CB","CDM","CF"], description: "空中戦（ヘディング）の勝率UP" },
        { id: 20, name: "ダイビングヘッド", category: "shoot", effectType: "SUCCESS_RATE_UP", target: "header", value: 30, condition: "lowCross", allowedPositions: ["CF"], description: "低いクロスへのヘディング成功率UP" },

        // 【3. ドリブル＆移動系 (dribble)】
        { id: 21, name: "ラインブレイカー", category: "dribble", effectType: "SUCCESS_RATE_UP", target: "runBehind", value: 25, condition: "always", allowedPositions: ["CAM","WG","CF"], description: "裏抜けのタイミングと成功率UP" },
        { id: 22, name: "スピードスター", category: "dribble", effectType: "SUCCESS_RATE_UP", target: "dribble", value: 20, condition: "always", allowedPositions: ["SB","WG","WG","CF"], description: "ドリブル時の突破率UP" },
        { id: 23, name: "ダブルタッチ", category: "dribble", effectType: "SUCCESS_RATE_UP", target: "dribble", value: 30, condition: "1vs1", allowedPositions: ["CAM","WG"], description: "1vs1でのドリブル突破率大幅UP" },
        { id: 24, name: "ターンマイスター", category: "dribble", effectType: "SUCCESS_RATE_UP", target: "turn", value: 25, condition: "underPressure", allowedPositions: ["CM","CAM","CF"], description: "プレッシャー下でのターン成功率UP" },
        { id: 25, name: "デコイランナー", category: "dribble", effectType: "ACTION_WEIGHT_UP", target: "runIntoSpace", value: 50, condition: "attackingThird", allowedPositions: ["CAM","WG","CF"], description: "おとりとなるフリーランニングの頻度UP" },
        { id: 26, name: "ポケット侵入者", category: "dribble", effectType: "ACTION_WEIGHT_UP", target: "runIntoPocket", value: 50, condition: "attackingThird", allowedPositions: ["CM","CAM","WG"], description: "ポケット（ペナルティエリア角）への侵入頻度UP" },
        { id: 27, name: "シザーズ", category: "dribble", effectType: "SUCCESS_RATE_UP", target: "dribble", value: 15, condition: "always", allowedPositions: ["WG"], description: "サイドアタック時のドリブル突破率UP" },
        { id: 28, name: "ルーレット", category: "dribble", effectType: "SUCCESS_RATE_UP", target: "dribble", value: 20, condition: "underPressure", allowedPositions: ["CM","CAM"], description: "中盤でのドリブルキープ率UP" },
        { id: 29, name: "エラシコ", category: "dribble", effectType: "SUCCESS_RATE_UP", target: "dribble", value: 30, condition: "penaltyAreaIn", allowedPositions: ["WG"], description: "ペナルティエリア内でのドリブル突破率UP" },
        { id: 30, name: "足裏コントロール", category: "dribble", effectType: "SUCCESS_RATE_UP", target: "trap", value: 15, condition: "always", allowedPositions: ["CDM","CM","CAM"], description: "足裏を使った確実なボールキープ" },

        // 【4. ディフェンス＆デュエル系 (defense)】
        { id: 31, name: "ハードタッカー", category: "defense", effectType: "SUCCESS_RATE_UP", target: "tackle", value: 20, condition: "always", allowedPositions: ["CB","SB","CDM"], description: "タックル成功率UP" },
        { id: 32, name: "スパイダータックル", category: "defense", effectType: "RANGE_UP", target: "tackle", value: 20, condition: "behind", allowedPositions: ["CB"], description: "後ろからのタックル成功率UPとファウル率減" },
        { id: 33, name: "インターセプター", category: "defense", effectType: "SUCCESS_RATE_UP", target: "intercept", value: 25, condition: "always", allowedPositions: ["CB","CDM","CM"], description: "パスカット成功率UP" },
        { id: 34, name: "アクロバティッククリア", category: "defense", effectType: "SUCCESS_RATE_UP", target: "clear", value: 30, condition: "difficultAngle", allowedPositions: ["CB"], description: "難しい体勢からのクリア成功率UP" },
        { id: 35, name: "シュートブロッカー", category: "defense", effectType: "SUCCESS_RATE_UP", target: "block", value: 30, condition: "penaltyAreaIn", allowedPositions: ["CB","CDM"], description: "シュートブロック成功率UP" },
        { id: 36, name: "カバーリングの名手", category: "defense", effectType: "ACTION_WEIGHT_UP", target: "cover", value: 50, condition: "always", allowedPositions: ["CB","SB"], description: "味方の裏をカバーする動きの頻度UP" },
        { id: 37, name: "クリーンファイター", category: "defense", effectType: "SUCCESS_RATE_UP", target: "tackle", value: 15, condition: "penaltyAreaIn", allowedPositions: ["CB","SB"], description: "ペナルティエリア内でのファウル率激減" },
        { id: 38, name: "マリーシア", category: "defense", effectType: "SUCCESS_RATE_UP", target: "drawFoul", value: 30, condition: "always", allowedPositions: ["CAM","WG","CF"], description: "ファウルを貰う確率UP" },
        { id: 39, name: "チェイシング", category: "defense", effectType: "ACTION_WEIGHT_UP", target: "press", value: 40, condition: "always", allowedPositions: ["CAM","WG","CF"], description: "前線からのプレス頻度と成功率UP" },
        { id: 40, name: "マンマーカー", category: "defense", effectType: "SUCCESS_RATE_UP", target: "mark", value: 25, condition: "always", allowedPositions: ["CB","CDM"], description: "マンマーク時の対応力UP" },

        // 【5. GK専用系 (gk)】
        { id: 41, name: "至近距離ストッパー", category: "gk", effectType: "SUCCESS_RATE_UP", target: "gkSave", value: 30, condition: "penaltyAreaIn", allowedPositions: ["GK"], description: "至近距離からのシュートセーブ率UP" },
        { id: 42, name: "ハイボール処理", category: "gk", effectType: "SUCCESS_RATE_UP", target: "gkCatch", value: 25, condition: "cross", allowedPositions: ["GK"], description: "クロスボールのキャッチ成功率UP" },
        { id: 43, name: "PKストッパー", category: "gk", effectType: "SUCCESS_RATE_UP", target: "gkSave", value: 50, condition: "penaltyKick", allowedPositions: ["GK"], description: "PKセーブ率極大UP" },
        { id: 44, name: "低弾道パントキック", category: "gk", effectType: "SUCCESS_RATE_UP", target: "gkPass", value: 25, condition: "counter", allowedPositions: ["GK"], description: "カウンター時のパントキック精度UP" },
        { id: 45, name: "スイーパーラッシュ", category: "gk", effectType: "ACTION_WEIGHT_UP", target: "gkRush", value: 40, condition: "always", allowedPositions: ["GK"], description: "ペナルティエリア外への飛び出し頻度と成功率UP" },
        { id: 46, name: "1vs1の威圧", category: "gk", effectType: "STAT_UP_CONDITIONAL", target: "shoot", value: -20, condition: "1vs1", allowedPositions: ["GK"], description: "1vs1の状況で相手のシュート精度を低下させる" },
        { id: 47, name: "ロングスロー", category: "gk", effectType: "RANGE_UP", target: "throw", value: 100, condition: "always", allowedPositions: ["GK"], description: "スローイングの飛距離UP" },
        { id: 48, name: "キャプテンシー(GK)", category: "gk", effectType: "PASSIVE_EFFECT", target: "teamMental", value: 10, condition: "always", allowedPositions: ["GK"], description: "味方全体のメンタル低下を防ぐ" },
        { id: 49, name: "超反応", category: "gk", effectType: "SUCCESS_RATE_UP", target: "gkSave", value: 20, condition: "always", allowedPositions: ["GK"], description: "常にセーブ率にボーナス" },
        { id: 50, name: "守備の統率", category: "gk", effectType: "PASSIVE_EFFECT", target: "defLineMental", value: 15, condition: "always", allowedPositions: ["GK"], description: "DFラインのメンタルと連携向上" },

        // 【6. メンタル・局面発動系 (mental)】
        { id: 51, name: "クラッチシューター", category: "mental", effectType: "SUCCESS_RATE_UP", target: "shoot", value: 30, condition: "behind", allowedPositions: ["CAM","WG","CF"], description: "ビハインド時のシュート決定率大幅UP" },
        { id: 52, name: "スーパーサブ", category: "mental", effectType: "STAT_UP_CONDITIONAL", target: "all", value: 10, condition: "sub", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF"], description: "途中出場時に全ステータスUP" },
        { id: 53, name: "ジャイアントキラー", category: "mental", effectType: "STAT_UP_CONDITIONAL", target: "all", value: 15, condition: "underdog", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF"], description: "格上相手時に全ステータスUP" },
        { id: 54, name: "雨天マイスター", category: "mental", effectType: "STAT_UP_CONDITIONAL", target: "all", value: 15, condition: "badWeather", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF"], description: "悪天候時に全ステータスUP" },
        { id: 55, name: "要塞の守護神", category: "mental", effectType: "STAT_UP_CONDITIONAL", target: "defense", value: 30, condition: "leadLateGame", allowedPositions: ["CB","GK"], description: "リードしている終盤に守備力激増" },
        { id: 56, name: "逆境への反発", category: "mental", effectType: "STAT_UP_CONDITIONAL", target: "mental", value: 30, condition: "behind", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF"], description: "ビハインド時にメンタル激増" },
        { id: 57, name: "ビッグマッチプレーヤー", category: "mental", effectType: "STAT_UP_CONDITIONAL", target: "all", value: 10, condition: "importantMatch", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF"], description: "重要な試合で全ステータスUP" },
        { id: 58, name: "ホームの誇り", category: "mental", effectType: "STAT_UP_CONDITIONAL", target: "all", value: 5, condition: "homeMatch", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF"], description: "ホームゲームで全ステータス微増" },
        { id: 59, name: "闘争心", category: "mental", effectType: "STAT_UP_CONDITIONAL", target: "physical", value: 20, condition: "tired", allowedPositions: ["CB","SB","CDM","CM"], description: "疲労時にフィジカル低下を抑える" },
        { id: 60, name: "冷静沈着", category: "mental", effectType: "STAT_UP_CONDITIONAL", target: "pass", value: 20, condition: "underPressure", allowedPositions: ["CDM","CM","CAM"], description: "プレッシャー下でパス精度が落ちない" },

        // 【7. 連携・スタミナ・マネジメント系 (management)】
        { id: 61, name: "ダイナモ", category: "management", effectType: "STAMINA_REDUCE", target: "self", value: 50, condition: "always", allowedPositions: ["SB","WG","CDM","CM"], description: "試合中のスタミナ消費が半減" },
        { id: 62, name: "鉄人", category: "management", effectType: "PASSIVE_EFFECT", target: "injuryRisk", value: -90, condition: "always", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF"], description: "怪我のリスクが激減" },
        { id: 63, name: "司令塔", category: "management", effectType: "PASSIVE_EFFECT", target: "linkPassBoost", value: 5, condition: "always", allowedPositions: ["CDM","CM","CAM"], description: "周囲の連携リンク選手のパス値+5" },
        { id: 64, name: "キャプテンシー", category: "management", effectType: "PASSIVE_EFFECT", target: "teamMental", value: 10, condition: "always", allowedPositions: ["CB","CDM","CM"], description: "味方全体のメンタル低下を防ぐ" },
        { id: 65, name: "ムードメーカー", category: "management", effectType: "PASSIVE_EFFECT", target: "teamMorale", value: 5, condition: "always", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF","GK"], description: "試合後にチーム士気が追加で回復" },
        { id: 66, name: "人気選手", category: "management", effectType: "PASSIVE_EFFECT", target: "fundsBoost", value: 10000, condition: "always", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF","GK"], description: "試合後の獲得資金が増加" },
        { id: 67, name: "ベテランの経験", category: "management", effectType: "PASSIVE_EFFECT", target: "expBoost", value: 20, condition: "always", allowedPositions: ["CB","CDM","CM","GK"], description: "若手選手の成長（隠しパラメータ）を促進" },
        { id: 68, name: "ハードワーカー", category: "management", effectType: "STAT_UP", target: "stamina", value: 15, condition: "always", allowedPositions: ["SB","WG","CM","WG"], description: "スタミナ最大値UP" },
        { id: 69, name: "ユーティリティ", category: "management", effectType: "PASSIVE_EFFECT", target: "subPosPenalty", value: -50, condition: "always", allowedPositions: ["CB","SB","CDM","CM","CAM","WG"], description: "サブ適性ポジションでのペナルティ半減" },
        { id: 70, name: "リカバリー能力", category: "management", effectType: "PASSIVE_EFFECT", target: "conditionRecovery", value: 10, condition: "always", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF"], description: "試合後のコンディション回復量UP" },
        { id: 71, name: "闘将", category: "management", effectType: "PASSIVE_EFFECT", target: "teamPhysical", value: 5, condition: "always", allowedPositions: ["CB","CDM"], description: "味方全体のフィジカル+5" },
        { id: 72, name: "戦術眼", category: "management", effectType: "PASSIVE_EFFECT", target: "teamTactic", value: 10, condition: "always", allowedPositions: ["CM","CAM"], description: "チーム戦術コマンドの効果UP" },
        { id: 73, name: "神の子", category: "management", effectType: "STAT_UP", target: "all", value: 5, condition: "always", allowedPositions: ["CAM","CF"], description: "全ステータス微増" },
        { id: 74, name: "悪童", category: "management", effectType: "STAT_UP", target: "physical", value: 20, condition: "always", allowedPositions: ["CB","CF"], description: "フィジカル大幅UPだが、カードをもらいやすい" },
        { id: 75, name: "バンディエラ", category: "management", effectType: "PASSIVE_EFFECT", target: "teamMorale", value: 10, condition: "homeMatch", allowedPositions: ["CB","CM","CF"], description: "ホームゲームでチーム士気大幅UP" },
        { id: 76, name: "ファンタジスタ", category: "management", effectType: "STAT_UP", target: "pass_shoot", value: 10, condition: "always", allowedPositions: ["CAM","CF"], description: "パスとシュートがUPするが、スタミナ消費増" },
        { id: 77, name: "ガラスの天才", category: "management", effectType: "STAT_UP", target: "pass_speed", value: 15, condition: "always", allowedPositions: ["CAM","WG"], description: "パスとスピード大幅UPだが、怪我しやすい" },
        { id: 78, name: "遅咲き", category: "management", effectType: "STAT_UP_CONDITIONAL", target: "all", value: 15, condition: "lateGame", allowedPositions: ["CB","CDM","CF"], description: "試合後半に全ステータスUP" },
        { id: 79, name: "早熟", category: "management", effectType: "STAT_UP_CONDITIONAL", target: "all", value: 15, condition: "earlyGame", allowedPositions: ["WG","CAM"], description: "試合序盤に全ステータスUP" },
        { id: 80, name: "練習の鬼", category: "management", effectType: "PASSIVE_EFFECT", target: "conditionRecovery", value: -5, condition: "always", allowedPositions: ["CB","SB","CDM","CM","CAM","WG","CF"], description: "コンディション回復が遅いが、能力のベースが高い" }
    ],
    "Relics": [
        {
            "id": 1,
            "name": "スパイクの改造",
            "effectType": "STAT_UP",
            "target": "speed",
            "value": 10,
            "description": "【効果】チーム全員のスピードが10上昇する"
        },
        {
            "id": 2,
            "name": "最新戦術ボード",
            "effectType": "CD_REDUCTION",
            "value": 0.1,
            "description": "【効果】戦術コマンドのクールダウン時間が10%短縮される"
        },
        {
            "id": 3,
            "name": "大口スポンサー",
            "effectType": "FUNDS_UP",
            "value": 100000,
            "description": "【効果】毎試合後の獲得資金が+¥100,000される"
        },
        {
            "id": 4,
            "name": "医療スタッフ拡充",
            "effectType": "CONDITION_RECOVERY",
            "value": 10,
            "description": "【効果】毎試合後のコンディション回復量が+10される"
        },
        {
            "id": 5,
            "name": "地元ファンの声援",
            "effectType": "ALL_STAT_UP",
            "value": 5,
            "description": "【効果】チーム全員の全ステータスが5上昇する"
        },
        {
            "id": 6,
            "name": "ハードプレスの哲学",
            "effectType": "CHEMISTRY_BOOST",
            "targetPref": "HighPress",
            "multiplier": 1.5,
            "description": "【効果】ハイプレス志向の選手間のケミストリー効果が1.5倍になる"
        },
        {
            "id": 7,
            "name": "ポゼッションの哲学",
            "effectType": "CHEMISTRY_BOOST",
            "targetPref": "Possession",
            "multiplier": 1.5,
            "description": "【効果】ポゼッション志向の選手間のケミストリー効果が1.5倍になる"
        },
        {
            "id": 8,
            "name": "カウンターの哲学",
            "effectType": "CHEMISTRY_BOOST",
            "targetPref": "Counter",
            "multiplier": 1.5,
            "description": "【効果】カウンター志向の選手間のケミストリー効果が1.5倍になる"
        },
        {
            "id": 9,
            "name": "堅守の哲学",
            "effectType": "CHEMISTRY_BOOST",
            "targetPref": "Retreat",
            "multiplier": 1.5,
            "description": "【効果】リトリート志向の選手間のケミストリー効果が1.5倍になる"
        },
        {
            "id": 10,
            "name": "ベテランの統率",
            "effectType": "LOW_STAT_BOOST",
            "threshold": 40,
            "value": 10,
            "description": "【効果】ステータスが40以下の能力値に+10のボーナスを与える"
        },
        {
            "id": 11,
            "name": "マッサージチェア",
            "effectType": "CONDITION_RECOVERY",
            "value": 20,
            "description": "【効果】毎試合後のコンディション回復量が+20される"
        },
        {
            "id": 12,
            "name": "名物オーナー",
            "effectType": "FUNDS_UP",
            "value": 200000,
            "description": "【効果】毎試合後の獲得資金が+¥200,000される"
        },
        {
            "id": 13,
            "name": "黄金のスパイク",
            "effectType": "STAT_UP",
            "target": "shoot",
            "value": 15,
            "description": "【効果】チーム全員のシュートが15上昇する"
        },
        {
            "id": 14,
            "name": "インテリジェントグラス",
            "effectType": "STAT_UP",
            "target": "mental",
            "value": 15,
            "description": "【効果】チーム全員のメンタルが15上昇する"
        },
        {
            "id": 15,
            "name": "鋼の肉体",
            "effectType": "STAT_UP",
            "target": "physical",
            "value": 15,
            "description": "【効果】チーム全員のフィジカルが15上昇する"
        },
        {
            "id": 16,
            "name": "精密コンパス",
            "effectType": "STAT_UP",
            "target": "pass",
            "value": 15,
            "description": "【効果】チーム全員のパスが15上昇する"
        },
        {
            "id": 17,
            "name": "鉄壁の盾",
            "effectType": "STAT_UP",
            "target": "defense",
            "value": 15,
            "description": "【効果】チーム全員のディフェンスが15上昇する"
        },
        {
            "id": 18,
            "name": "無尽蔵の肺",
            "effectType": "STAT_UP",
            "target": "stamina",
            "value": 15,
            "description": "【効果】チーム全員のスタミナが15上昇する"
        },
        {
            "id": 19,
            "name": "覚醒のルーン",
            "effectType": "ALL_STAT_UP",
            "value": 10,
            "description": "【効果】チーム全員の全ステータスが10上昇する"
        },
        {
            "id": 20,
            "name": "魔法の戦術盤",
            "effectType": "CD_REDUCTION",
            "value": 0.2,
            "description": "【効果】戦術コマンドのクールダウン時間が20%短縮される"
        }
    ],
    "MicroCommands": [
        {
            "id": 1,
            "name": "ショートパッシング",
            "cooldown": 20,
            "type": "buff",
            "target": "pass",
            "value": 20,
            "description": "味方全体のパス成功率が上昇する"
        },
        {
            "id": 2,
            "name": "ロングボール配給",
            "cooldown": 30,
            "type": "action",
            "actionType": "longBall",
            "description": "前線へロングボールを放り込む"
        },
        {
            "id": 3,
            "name": "セーフティ・クリア",
            "cooldown": 25,
            "type": "buff",
            "target": "defense",
            "value": 30,
            "description": "守備意識を高め、ピンチを安全にクリアする"
        },
        {
            "id": 4,
            "name": "サイドチェンジ",
            "cooldown": 30,
            "type": "action",
            "actionType": "switchPlay",
            "description": "逆サイドへ大きく展開するパスを狙う"
        },
        {
            "id": 5,
            "name": "GKビルドアップ",
            "cooldown": 40,
            "type": "buff",
            "target": "possession",
            "value": 15,
            "description": "GKからの丁寧なビルドアップを試みる"
        },
        {
            "id": 6,
            "name": "ワンツーパス",
            "cooldown": 25,
            "type": "action",
            "actionType": "oneTwo",
            "description": "近距離でのパス交換から突破を図る"
        },
        {
            "id": 7,
            "name": "アーリークロス",
            "cooldown": 30,
            "type": "action",
            "actionType": "earlyCross",
            "description": "早いタイミングでゴール前へクロスを上げる"
        },
        {
            "id": 8,
            "name": "スルーパス",
            "cooldown": 35,
            "type": "action",
            "actionType": "throughBall",
            "description": "DFラインの裏を狙う鋭いパスを出す"
        },
        {
            "id": 9,
            "name": "サイドバックのオーバーラップ",
            "cooldown": 40,
            "type": "buff",
            "target": "attackWidth",
            "value": 20,
            "description": "SBが積極的に前線へ駆け上がる"
        },
        {
            "id": 10,
            "name": "偽9番の降下",
            "cooldown": 45,
            "type": "action",
            "actionType": "falseNine",
            "description": "CFが中盤に降りてボールを引き出す"
        },
        {
            "id": 11,
            "name": "ミドルシュート",
            "cooldown": 25,
            "type": "action",
            "actionType": "shoot",
            "description": "隙を見つけて遠距離からシュートを狙う"
        },
        {
            "id": 12,
            "name": "ファー詰め",
            "cooldown": 30,
            "type": "buff",
            "target": "crossReception",
            "value": 25,
            "description": "クロスボールに対してファーサイドで待ち構える"
        },
        {
            "id": 13,
            "name": "ニアハイぶち抜き",
            "cooldown": 40,
            "type": "buff",
            "target": "shoot",
            "value": 30,
            "description": "ニアの上のコースを強烈なシュートで狙う"
        },
        {
            "id": 14,
            "name": "ライン裏抜け",
            "cooldown": 35,
            "type": "action",
            "actionType": "runBehind",
            "description": "相手ディフェンスの背後へ走り込む"
        },
        {
            "id": 15,
            "name": "カットイン・シュート",
            "cooldown": 30,
            "type": "action",
            "actionType": "cutInShoot",
            "description": "サイドから中央に切れ込みシュートを放つ"
        },
        {
            "id": 16,
            "name": "ヘディング・ターゲット",
            "cooldown": 30,
            "type": "buff",
            "target": "header",
            "value": 25,
            "description": "前線の選手がターゲットマンとして空中戦に競る"
        },
        {
            "id": 17,
            "name": "ミドルブロック",
            "cooldown": 35,
            "type": "buff",
            "target": "defenseLine",
            "value": "middle",
            "description": "中盤でコンパクトな守備ブロックを形成する"
        },
        {
            "id": 18,
            "name": "パスカット",
            "cooldown": 25,
            "type": "buff",
            "target": "intercept",
            "value": 25,
            "description": "相手のパスコースを読んでインターセプトを狙う"
        },
        {
            "id": 19,
            "name": "激しいタックル",
            "cooldown": 20,
            "type": "buff",
            "target": "tackle",
            "value": 30,
            "description": "強気なスライディングタックルでボールを奪う"
        },
        {
            "id": 20,
            "name": "ハイライン・ハイプレス",
            "cooldown": 45,
            "type": "buff",
            "target": "press",
            "value": 40,
            "description": "最終ラインを上げ、前線から激しくプレスをかける"
        },
        {
            "id": 21,
            "name": "リトリート・５バック化",
            "cooldown": 50,
            "type": "action",
            "actionType": "parkBus",
            "description": "自陣に深く引いて守備を固める"
        },
        {
            "id": 22,
            "name": "オフサイドトラップ",
            "cooldown": 40,
            "type": "action",
            "actionType": "offsideTrap",
            "description": "最終ラインを一斉に上げ、相手をオフサイドにする"
        },
        {
            "id": 23,
            "name": "ファスト・ブレイク",
            "cooldown": 30,
            "type": "buff",
            "target": "speed",
            "value": 20,
            "description": "ボールを奪ったら素早く前線へ展開する"
        },
        {
            "id": 24,
            "name": "カウンター・プレス",
            "cooldown": 35,
            "type": "buff",
            "target": "press",
            "value": 25,
            "description": "ボールを失った直後に複数人で囲い込む"
        },
        {
            "id": 25,
            "name": "ゲーゲンプレス",
            "cooldown": 50,
            "type": "action",
            "actionType": "gegenpress",
            "description": "最前線からの超高強度なプレスで即時奪回を狙う"
        },
        {
            "id": 26,
            "name": "ロングカウンター",
            "cooldown": 40,
            "type": "action",
            "actionType": "longCounter",
            "description": "自陣深くからのロングパスで一気にカウンターを仕掛ける"
        },
        {
            "id": 27,
            "name": "【回数制限】選手交代",
            "cooldown": 0,
            "type": "special",
            "actionType": "substitute",
            "maxUses": 3,
            "description": "ベンチの選手と交代する（最大3回）"
        },
        {
            "id": 28,
            "name": "【回数制限】パワープレー",
            "cooldown": 0,
            "type": "special",
            "actionType": "powerPlay",
            "maxUses": 1,
            "description": "CBを前線に上げ、ロングボールを多用する"
        },
        {
            "id": 29,
            "name": "【条件】逆境の猛攻",
            "cooldown": 60,
            "type": "special",
            "actionType": "comeback",
            "condition": "behind",
            "description": "ビハインド時にのみ発動可能。チーム全体の攻撃力が上昇"
        },
        {
            "id": 30,
            "name": "【条件】ゲームクローズ",
            "cooldown": 60,
            "type": "special",
            "actionType": "closeGame",
            "condition": "lead",
            "description": "リード時にのみ発動可能。リスクを抑え、時間を消費する"
        }
    ],
    "Positions": [
        "GK",
        "CB",
        "SB",
        "CDM",
        "CM",
        "CAM",
        "WG",
        "CF"
    ],
    "Roles": {
        "GK": [
            "Classic",
            "Sweeper"
        ],
        "CB": [
            "Stopper",
            "Covering",
            "Ball-Playing"
        ],
        "SB": [
            "Defensive",
            "Attacking",
            "Inverted",
            "Wing-Back"
        ],
        "CDM": [
            "Anchor",
            "Destroyer",
            "Deep-Lying"
        ],
        "CM": [
            "Box-to-Box",
            "Advanced-Playmaker",
            "Ball-Winning"
        ],
        "CAM": [
            "Shadow-Striker",
            "Enganche",
            "Dynamo"
        ],
        "WG": [
            "Classic-Winger",
            "Inside-Forward",
            "Wide-Target-Man",
            "Crosser",
            "Wide-Playmaker",
            "Hard-Worker"
        ],
        "CF": [
            "Poacher",
            "Target-Man",
            "False-9",
            "Complete"
        ]
    },
    "Formations": {
        "4-4-2": {
            "slots": [
                {
                    "id": "GK",
                    "position": "GK",
                    "expectedPosStr": "GK",
                    "offsetX": 0,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": -30,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": 30,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LSB",
                    "position": "SB",
                    "expectedPosStr": "SB",
                    "offsetX": 10,
                    "offsetY": -120,
                    "baseMatrix": {
                        "lane": "Left Outside",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RSB",
                    "position": "SB",
                    "expectedPosStr": "SB",
                    "offsetX": 10,
                    "offsetY": 120,
                    "baseMatrix": {
                        "lane": "Right Outside",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 0,
                    "offsetY": -50,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "RCM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 0,
                    "offsetY": 50,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "LWG",
                    "position": "WG",
                    "expectedPosStr": "WG",
                    "offsetX": 20,
                    "offsetY": -120,
                    "baseMatrix": {
                        "lane": "Left Outside",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "RWG",
                    "position": "WG",
                    "expectedPosStr": "WG",
                    "offsetX": 20,
                    "offsetY": 120,
                    "baseMatrix": {
                        "lane": "Right Outside",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "LCF",
                    "position": "CF",
                    "expectedPosStr": "CF",
                    "offsetX": 40,
                    "offsetY": -30,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "RCF",
                    "position": "CF",
                    "expectedPosStr": "CF",
                    "offsetX": 40,
                    "offsetY": 30,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Attacking"
                    }
                }
            ],
            "chemistryLinks": [
                {
                    "from": "LCB",
                    "to": "LSB"
                },
                {
                    "from": "LCB",
                    "to": "LCM"
                },
                {
                    "from": "LSB",
                    "to": "LWG"
                },
                {
                    "from": "LCM",
                    "to": "LCF"
                },
                {
                    "from": "RCB",
                    "to": "RSB"
                },
                {
                    "from": "RCB",
                    "to": "RCM"
                },
                {
                    "from": "RSB",
                    "to": "RWG"
                },
                {
                    "from": "RCM",
                    "to": "RCF"
                },
                {
                    "from": "LCB",
                    "to": "RCB"
                },
                {
                    "from": "LCM",
                    "to": "RCM"
                },
                {
                    "from": "LCF",
                    "to": "RCF"
                }
            ]
        },
        "4-3-3": {
            "slots": [
                {
                    "id": "GK",
                    "position": "GK",
                    "expectedPosStr": "GK",
                    "offsetX": 0,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": -30,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": 30,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LSB",
                    "position": "SB",
                    "expectedPosStr": "SB",
                    "offsetX": 10,
                    "offsetY": -120,
                    "baseMatrix": {
                        "lane": "Left Outside",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RSB",
                    "position": "SB",
                    "expectedPosStr": "SB",
                    "offsetX": 10,
                    "offsetY": 120,
                    "baseMatrix": {
                        "lane": "Right Outside",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "CDM",
                    "position": "CDM",
                    "expectedPosStr": "CDM",
                    "offsetX": -10,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "LCM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 10,
                    "offsetY": -50,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "RCM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 10,
                    "offsetY": 50,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "LWG",
                    "position": "WG",
                    "expectedPosStr": "WG",
                    "offsetX": 20,
                    "offsetY": -120,
                    "baseMatrix": {
                        "lane": "Left Outside",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "RWG",
                    "position": "WG",
                    "expectedPosStr": "WG",
                    "offsetX": 20,
                    "offsetY": 120,
                    "baseMatrix": {
                        "lane": "Right Outside",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "CF",
                    "position": "CF",
                    "expectedPosStr": "CF",
                    "offsetX": 45,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Attacking"
                    }
                }
            ],
            "chemistryLinks": [
                {
                    "from": "LCB",
                    "to": "LSB"
                },
                {
                    "from": "LCB",
                    "to": "CDM"
                },
                {
                    "from": "LSB",
                    "to": "LCM"
                },
                {
                    "from": "LCM",
                    "to": "LWG"
                },
                {
                    "from": "RCB",
                    "to": "RSB"
                },
                {
                    "from": "RCB",
                    "to": "CDM"
                },
                {
                    "from": "RSB",
                    "to": "RCM"
                },
                {
                    "from": "RCM",
                    "to": "RWG"
                },
                {
                    "from": "CDM",
                    "to": "LCM"
                },
                {
                    "from": "CDM",
                    "to": "RCM"
                },
                {
                    "from": "LCM",
                    "to": "CF"
                },
                {
                    "from": "RCM",
                    "to": "CF"
                },
                {
                    "from": "LWG",
                    "to": "CF"
                },
                {
                    "from": "RWG",
                    "to": "CF"
                }
            ]
        },
        "3-2-4-1": {
            "slots": [
                {
                    "id": "GK",
                    "position": "GK",
                    "expectedPosStr": "GK",
                    "offsetX": 0,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": -60,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "CB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": 60,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCDM",
                    "position": "CDM",
                    "expectedPosStr": "CDM",
                    "offsetX": -10,
                    "offsetY": -30,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "RCDM",
                    "position": "CDM",
                    "expectedPosStr": "CDM",
                    "offsetX": -10,
                    "offsetY": 30,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "LCAM",
                    "position": "CAM",
                    "expectedPosStr": "CAM",
                    "offsetX": 20,
                    "offsetY": -30,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "RCAM",
                    "position": "CAM",
                    "expectedPosStr": "CAM",
                    "offsetX": 20,
                    "offsetY": 30,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "LWG",
                    "position": "WG",
                    "expectedPosStr": "WG",
                    "offsetX": 20,
                    "offsetY": -120,
                    "baseMatrix": {
                        "lane": "Left Outside",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "RWG",
                    "position": "WG",
                    "expectedPosStr": "WG",
                    "offsetX": 20,
                    "offsetY": 120,
                    "baseMatrix": {
                        "lane": "Right Outside",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "CF",
                    "position": "CF",
                    "expectedPosStr": "CF",
                    "offsetX": 45,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Attacking"
                    }
                }
            ],
            "chemistryLinks": [
                {
                    "from": "GK",
                    "to": "LCB"
                },
                {
                    "from": "GK",
                    "to": "CB"
                },
                {
                    "from": "GK",
                    "to": "RCB"
                },
                {
                    "from": "LCB",
                    "to": "CB"
                },
                {
                    "from": "CB",
                    "to": "RCB"
                },
                {
                    "from": "LCB",
                    "to": "LCDM"
                },
                {
                    "from": "CB",
                    "to": "LCDM"
                },
                {
                    "from": "CB",
                    "to": "RCDM"
                },
                {
                    "from": "RCB",
                    "to": "RCDM"
                },
                {
                    "from": "LCDM",
                    "to": "RCDM"
                },
                {
                    "from": "LCDM",
                    "to": "LCAM"
                },
                {
                    "from": "RCDM",
                    "to": "RCAM"
                },
                {
                    "from": "LCDM",
                    "to": "LWG"
                },
                {
                    "from": "RCDM",
                    "to": "RWG"
                },
                {
                    "from": "LCAM",
                    "to": "LWG"
                },
                {
                    "from": "RCAM",
                    "to": "RWG"
                },
                {
                    "from": "LWG",
                    "to": "CF"
                },
                {
                    "from": "RWG",
                    "to": "CF"
                },
                {
                    "from": "LCAM",
                    "to": "CF"
                },
                {
                    "from": "RCAM",
                    "to": "CF"
                },
                {
                    "from": "LCAM",
                    "to": "RCAM"
                }
            ]
        },
        "4-1-4-1": {
            "slots": [
                {
                    "id": "GK",
                    "position": "GK",
                    "expectedPosStr": "GK",
                    "offsetX": 0,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": -30,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": 30,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LSB",
                    "position": "SB",
                    "expectedPosStr": "SB",
                    "offsetX": 10,
                    "offsetY": -120,
                    "baseMatrix": {
                        "lane": "Left Outside",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RSB",
                    "position": "SB",
                    "expectedPosStr": "SB",
                    "offsetX": 10,
                    "offsetY": 120,
                    "baseMatrix": {
                        "lane": "Right Outside",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "CDM",
                    "position": "CDM",
                    "expectedPosStr": "CDM",
                    "offsetX": -10,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "LCM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 10,
                    "offsetY": -50,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "RCM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 10,
                    "offsetY": 50,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "LWG",
                    "position": "WG",
                    "expectedPosStr": "WG",
                    "offsetX": 35,
                    "offsetY": -120,
                    "baseMatrix": {
                        "lane": "Left Outside",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "RWG",
                    "position": "WG",
                    "expectedPosStr": "WG",
                    "offsetX": 35,
                    "offsetY": 120,
                    "baseMatrix": {
                        "lane": "Right Outside",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "CF",
                    "position": "CF",
                    "expectedPosStr": "CF",
                    "offsetX": 45,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Attacking"
                    }
                }
            ],
            "chemistryLinks": [
                {
                    "from": "GK",
                    "to": "LCB"
                },
                {
                    "from": "GK",
                    "to": "RCB"
                },
                {
                    "from": "LCB",
                    "to": "RCB"
                },
                {
                    "from": "LCB",
                    "to": "LSB"
                },
                {
                    "from": "RCB",
                    "to": "RSB"
                },
                {
                    "from": "LCB",
                    "to": "CDM"
                },
                {
                    "from": "RCB",
                    "to": "CDM"
                },
                {
                    "from": "LSB",
                    "to": "CDM"
                },
                {
                    "from": "RSB",
                    "to": "CDM"
                },
                {
                    "from": "CDM",
                    "to": "LCM"
                },
                {
                    "from": "CDM",
                    "to": "RCM"
                },
                {
                    "from": "LCM",
                    "to": "RCM"
                },
                {
                    "from": "LSB",
                    "to": "LWG"
                },
                {
                    "from": "RSB",
                    "to": "RWG"
                },
                {
                    "from": "LCM",
                    "to": "LWG"
                },
                {
                    "from": "RCM",
                    "to": "RWG"
                },
                {
                    "from": "LWG",
                    "to": "CF"
                },
                {
                    "from": "RWG",
                    "to": "CF"
                },
                {
                    "from": "LCM",
                    "to": "CF"
                },
                {
                    "from": "RCM",
                    "to": "CF"
                }
            ]
        },
        "4-2-3-1": {
            "slots": [
                {
                    "id": "GK",
                    "position": "GK",
                    "expectedPosStr": "GK",
                    "offsetX": 0,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": -30,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": 30,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LSB",
                    "position": "SB",
                    "expectedPosStr": "SB",
                    "offsetX": 10,
                    "offsetY": -120,
                    "baseMatrix": {
                        "lane": "Left Outside",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RSB",
                    "position": "SB",
                    "expectedPosStr": "SB",
                    "offsetX": 10,
                    "offsetY": 120,
                    "baseMatrix": {
                        "lane": "Right Outside",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCDM",
                    "position": "CDM",
                    "expectedPosStr": "CDM",
                    "offsetX": -10,
                    "offsetY": -30,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "RCDM",
                    "position": "CDM",
                    "expectedPosStr": "CDM",
                    "offsetX": -10,
                    "offsetY": 30,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "CAM",
                    "position": "CAM",
                    "expectedPosStr": "CAM",
                    "offsetX": 20,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "LWG",
                    "position": "WG",
                    "expectedPosStr": "WG",
                    "offsetX": 15,
                    "offsetY": -120,
                    "baseMatrix": {
                        "lane": "Left Outside",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "RWG",
                    "position": "WG",
                    "expectedPosStr": "WG",
                    "offsetX": 15,
                    "offsetY": 120,
                    "baseMatrix": {
                        "lane": "Right Outside",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "CF",
                    "position": "CF",
                    "expectedPosStr": "CF",
                    "offsetX": 45,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Attacking"
                    }
                }
            ],
            "chemistryLinks": [
                {
                    "from": "GK",
                    "to": "LCB"
                },
                {
                    "from": "GK",
                    "to": "RCB"
                },
                {
                    "from": "LCB",
                    "to": "RCB"
                },
                {
                    "from": "LCB",
                    "to": "LSB"
                },
                {
                    "from": "RCB",
                    "to": "RSB"
                },
                {
                    "from": "LCB",
                    "to": "LCDM"
                },
                {
                    "from": "RCB",
                    "to": "RCDM"
                },
                {
                    "from": "LSB",
                    "to": "LCDM"
                },
                {
                    "from": "RSB",
                    "to": "RCDM"
                },
                {
                    "from": "LCDM",
                    "to": "RCDM"
                },
                {
                    "from": "LCDM",
                    "to": "CAM"
                },
                {
                    "from": "RCDM",
                    "to": "CAM"
                },
                {
                    "from": "LCDM",
                    "to": "LWG"
                },
                {
                    "from": "RCDM",
                    "to": "RWG"
                },
                {
                    "from": "CAM",
                    "to": "LWG"
                },
                {
                    "from": "CAM",
                    "to": "RWG"
                },
                {
                    "from": "LWG",
                    "to": "CF"
                },
                {
                    "from": "RWG",
                    "to": "CF"
                },
                {
                    "from": "CAM",
                    "to": "CF"
                }
            ]
        },
        "5-3-2": {
            "slots": [
                {
                    "id": "GK",
                    "position": "GK",
                    "expectedPosStr": "GK",
                    "offsetX": 0,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": -60,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "CB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -20,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": 60,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LSB",
                    "position": "SB",
                    "expectedPosStr": "SB",
                    "offsetX": 10,
                    "offsetY": -120,
                    "baseMatrix": {
                        "lane": "Left Outside",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RSB",
                    "position": "SB",
                    "expectedPosStr": "SB",
                    "offsetX": 10,
                    "offsetY": 120,
                    "baseMatrix": {
                        "lane": "Right Outside",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 10,
                    "offsetY": -40,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "CM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 0,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "RCM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 10,
                    "offsetY": 40,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "LCF",
                    "position": "CF",
                    "expectedPosStr": "CF",
                    "offsetX": 40,
                    "offsetY": -30,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "RCF",
                    "position": "CF",
                    "expectedPosStr": "CF",
                    "offsetX": 40,
                    "offsetY": 30,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Attacking"
                    }
                }
            ],
            "chemistryLinks": [
                {
                    "from": "GK",
                    "to": "LCB"
                },
                {
                    "from": "GK",
                    "to": "CB"
                },
                {
                    "from": "GK",
                    "to": "RCB"
                },
                {
                    "from": "LCB",
                    "to": "CB"
                },
                {
                    "from": "CB",
                    "to": "RCB"
                },
                {
                    "from": "LCB",
                    "to": "LSB"
                },
                {
                    "from": "RCB",
                    "to": "RSB"
                },
                {
                    "from": "LCB",
                    "to": "LCM"
                },
                {
                    "from": "RCB",
                    "to": "RCM"
                },
                {
                    "from": "CB",
                    "to": "CM"
                },
                {
                    "from": "LSB",
                    "to": "LCM"
                },
                {
                    "from": "RSB",
                    "to": "RCM"
                },
                {
                    "from": "LCM",
                    "to": "CM"
                },
                {
                    "from": "RCM",
                    "to": "CM"
                },
                {
                    "from": "LCM",
                    "to": "LCF"
                },
                {
                    "from": "RCM",
                    "to": "RCF"
                },
                {
                    "from": "CM",
                    "to": "LCF"
                },
                {
                    "from": "CM",
                    "to": "RCF"
                },
                {
                    "from": "LCF",
                    "to": "RCF"
                }
            ]
        },
        "4-3-1-2": {
            "slots": [
                {
                    "id": "GK",
                    "position": "GK",
                    "expectedPosStr": "GK",
                    "offsetX": 0,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": -30,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": 30,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LSB",
                    "position": "SB",
                    "expectedPosStr": "SB",
                    "offsetX": 10,
                    "offsetY": -120,
                    "baseMatrix": {
                        "lane": "Left Outside",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RSB",
                    "position": "SB",
                    "expectedPosStr": "SB",
                    "offsetX": 10,
                    "offsetY": 120,
                    "baseMatrix": {
                        "lane": "Right Outside",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 0,
                    "offsetY": -50,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "CM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 0,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "RCM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 0,
                    "offsetY": 50,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "CAM",
                    "position": "CAM",
                    "expectedPosStr": "CAM",
                    "offsetX": 20,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "LCF",
                    "position": "CF",
                    "expectedPosStr": "CF",
                    "offsetX": 40,
                    "offsetY": -30,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "RCF",
                    "position": "CF",
                    "expectedPosStr": "CF",
                    "offsetX": 40,
                    "offsetY": 30,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Attacking"
                    }
                }
            ],
            "chemistryLinks": [
                {
                    "from": "GK",
                    "to": "LCB"
                },
                {
                    "from": "GK",
                    "to": "RCB"
                },
                {
                    "from": "LCB",
                    "to": "RCB"
                },
                {
                    "from": "LCB",
                    "to": "LSB"
                },
                {
                    "from": "RCB",
                    "to": "RSB"
                },
                {
                    "from": "LCB",
                    "to": "LCM"
                },
                {
                    "from": "RCB",
                    "to": "RCM"
                },
                {
                    "from": "LCB",
                    "to": "CM"
                },
                {
                    "from": "RCB",
                    "to": "CM"
                },
                {
                    "from": "LSB",
                    "to": "LCM"
                },
                {
                    "from": "RSB",
                    "to": "RCM"
                },
                {
                    "from": "LCM",
                    "to": "CM"
                },
                {
                    "from": "RCM",
                    "to": "CM"
                },
                {
                    "from": "LCM",
                    "to": "CAM"
                },
                {
                    "from": "RCM",
                    "to": "CAM"
                },
                {
                    "from": "CM",
                    "to": "CAM"
                },
                {
                    "from": "CAM",
                    "to": "LCF"
                },
                {
                    "from": "CAM",
                    "to": "RCF"
                },
                {
                    "from": "LCF",
                    "to": "RCF"
                }
            ]
        },
        "3-5-2": {
            "slots": [
                {
                    "id": "GK",
                    "position": "GK",
                    "expectedPosStr": "GK",
                    "offsetX": 0,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "LCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": -60,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "CB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -20,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "RCB",
                    "position": "CB",
                    "expectedPosStr": "CB",
                    "offsetX": -15,
                    "offsetY": 60,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Defensive"
                    }
                },
                {
                    "id": "CDM",
                    "position": "CDM",
                    "expectedPosStr": "CDM",
                    "offsetX": 0,
                    "offsetY": 0,
                    "baseMatrix": {
                        "lane": "Center",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "LCM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 0,
                    "offsetY": -40,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "RCM",
                    "position": "CM",
                    "expectedPosStr": "CM",
                    "offsetX": 0,
                    "offsetY": 40,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "LWG",
                    "position": "WG",
                    "expectedPosStr": "WG",
                    "offsetX": 0,
                    "offsetY": -120,
                    "baseMatrix": {
                        "lane": "Left Outside",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "RWG",
                    "position": "WG",
                    "expectedPosStr": "WG",
                    "offsetX": 0,
                    "offsetY": 120,
                    "baseMatrix": {
                        "lane": "Right Outside",
                        "tier": "Middle"
                    }
                },
                {
                    "id": "LCF",
                    "position": "CF",
                    "expectedPosStr": "CF",
                    "offsetX": 40,
                    "offsetY": -30,
                    "baseMatrix": {
                        "lane": "Left Half-space",
                        "tier": "Attacking"
                    }
                },
                {
                    "id": "RCF",
                    "position": "CF",
                    "expectedPosStr": "CF",
                    "offsetX": 40,
                    "offsetY": 30,
                    "baseMatrix": {
                        "lane": "Right Half-space",
                        "tier": "Attacking"
                    }
                }
            ],
            "chemistryLinks": [
                {
                    "from": "GK",
                    "to": "LCB"
                },
                {
                    "from": "GK",
                    "to": "CB"
                },
                {
                    "from": "GK",
                    "to": "RCB"
                },
                {
                    "from": "LCB",
                    "to": "CB"
                },
                {
                    "from": "CB",
                    "to": "RCB"
                },
                {
                    "from": "LCB",
                    "to": "CDM"
                },
                {
                    "from": "RCB",
                    "to": "CDM"
                },
                {
                    "from": "CB",
                    "to": "CDM"
                },
                {
                    "from": "CDM",
                    "to": "LCM"
                },
                {
                    "from": "CDM",
                    "to": "RCM"
                },
                {
                    "from": "LCM",
                    "to": "LWG"
                },
                {
                    "from": "RCM",
                    "to": "RWG"
                },
                {
                    "from": "LCM",
                    "to": "LCF"
                },
                {
                    "from": "RCM",
                    "to": "RCF"
                },
                {
                    "from": "LWG",
                    "to": "LCF"
                },
                {
                    "from": "RWG",
                    "to": "RCF"
                },
                {
                    "from": "LCF",
                    "to": "RCF"
                }
            ]
        }
    }
};

// Expose globally or export if using modules
window.MasterData = MasterData;
// Preserving window.TacticalPreferences
