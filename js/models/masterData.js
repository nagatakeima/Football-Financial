// ==========================================
// Master Data Definitions
// ==========================================

const TacticalPreferences = {
    POSSESSION: 'Possession',
    COUNTER: 'Counter',
    HIGH_PRESS: 'HighPress',
    RETREAT: 'Retreat'
};

const MasterData = {
    Managers: [
        { id: 1, name: "Pep Guard", preference: TacticalPreferences.POSSESSION, formations: ["4-3-3", "3-2-4-1", "4-1-4-1"], initialFunds: 1500000, initialTrait: "ポゼッションの哲学" },
        { id: 2, name: "Jurgen K", preference: TacticalPreferences.HIGH_PRESS, formations: ["4-3-3", "4-2-3-1", "4-4-2"], initialFunds: 1000000, initialTrait: "ハードプレスの哲学" },
        { id: 3, name: "Jose M", preference: TacticalPreferences.RETREAT, formations: ["4-2-3-1", "5-3-2", "4-3-3"], initialFunds: 1200000, initialTrait: "堅守の哲学" },
        { id: 4, name: "Carlo A", preference: TacticalPreferences.COUNTER, formations: ["4-4-2", "4-3-1-2", "4-3-3"], initialFunds: 1000000, initialTrait: "ベテランの統率" },
        { id: 5, name: "Zinedine Z", preference: TacticalPreferences.POSSESSION, formations: ["4-3-3", "4-4-2", "3-5-2"], initialFunds: 2000000, initialTrait: "大口スポンサー" }
    ],

    PlayerSkills: [
        { id: 1, name: "ラインブレイカー", description: "裏抜け時のシュート成功率UP" },
        { id: 2, name: "ダイナモ", description: "試合中のスタミナ消費が減少" },
        { id: 3, name: "エアバトラー", description: "空中戦（ヘディング）の勝率UP" },
        { id: 4, name: "パスマスター", description: "パス成功率UP" },
        { id: 5, name: "ハードタッカー", description: "タックル成功率UP" },
        { id: 6, name: "スピードスター", description: "ドリブル時の突破率UP" },
        { id: 7, name: "司令塔", description: "周囲の選手のパス成功率を微増させる" },
        { id: 8, name: "鉄人", description: "怪我のリスクが大幅に低下" },
        { id: 9, name: "クラッチシューター", description: "ビハインド時のシュート決定率UP" },
        { id: 10, name: "スーパーサブ", description: "途中出場時に全ステータスが一時的にUP" }
    ],

    Relics: [
        { id: 1, name: "スパイクの改造", effectType: "STAT_UP", target: "speed", value: 10 },
        { id: 2, name: "最新戦術ボード", effectType: "CD_REDUCTION", value: 0.1 },
        { id: 3, name: "大口スポンサー", effectType: "FUNDS_UP", value: 100000 },
        { id: 4, name: "医療スタッフ拡充", effectType: "CONDITION_RECOVERY", value: 10 },
        { id: 5, name: "地元ファンの声援", effectType: "ALL_STAT_UP", value: 5 },
        { id: 6, name: "ハードプレスの哲学", effectType: "CHEMISTRY_BOOST", targetPref: TacticalPreferences.HIGH_PRESS, multiplier: 1.5 },
        { id: 7, name: "ポゼッションの哲学", effectType: "CHEMISTRY_BOOST", targetPref: TacticalPreferences.POSSESSION, multiplier: 1.5 },
        { id: 8, name: "カウンターの哲学", effectType: "CHEMISTRY_BOOST", targetPref: TacticalPreferences.COUNTER, multiplier: 1.5 },
        { id: 9, name: "堅守の哲学", effectType: "CHEMISTRY_BOOST", targetPref: TacticalPreferences.RETREAT, multiplier: 1.5 },
        { id: 10, name: "ベテランの統率", effectType: "LOW_STAT_BOOST", threshold: 40, value: 10 }
    ],

    MicroCommands: [
        // Build up & Possession
        { id: 1, name: "ショートパッシング", cooldown: 20, type: "buff", target: "pass", value: 20 },
        { id: 2, name: "ロングボール配給", cooldown: 30, type: "action", actionType: "longBall" },
        { id: 3, name: "セーフティ・クリア", cooldown: 25, type: "buff", target: "defense", value: 30 },
        { id: 4, name: "サイドチェンジ", cooldown: 30, type: "action", actionType: "switchPlay" },
        { id: 5, name: "GKビルドアップ", cooldown: 40, type: "buff", target: "possession", value: 15 },
        { id: 6, name: "ワンツーパス", cooldown: 25, type: "action", actionType: "oneTwo" },
        { id: 7, name: "アーリークロス", cooldown: 30, type: "action", actionType: "earlyCross" },
        { id: 8, name: "スルーパス", cooldown: 35, type: "action", actionType: "throughBall" },
        { id: 9, name: "サイドバックのオーバーラップ", cooldown: 40, type: "buff", target: "attackWidth", value: 20 },
        { id: 10, name: "偽9番の降下", cooldown: 45, type: "action", actionType: "falseNine" },

        // Finish Work
        { id: 11, name: "ミドルシュート", cooldown: 25, type: "action", actionType: "shoot" },
        { id: 12, name: "ファー詰め", cooldown: 30, type: "buff", target: "crossReception", value: 25 },
        { id: 13, name: "ニアハイぶち抜き", cooldown: 40, type: "buff", target: "shoot", value: 30 },
        { id: 14, name: "ライン裏抜け", cooldown: 35, type: "action", actionType: "runBehind" },
        { id: 15, name: "カットイン・シュート", cooldown: 30, type: "action", actionType: "cutInShoot" },
        { id: 16, name: "ヘディング・ターゲット", cooldown: 30, type: "buff", target: "header", value: 25 },

        // Press & Defense
        { id: 17, name: "ミドルブロック", cooldown: 35, type: "buff", target: "defenseLine", value: "middle" },
        { id: 18, name: "パスカット", cooldown: 25, type: "buff", target: "intercept", value: 25 },
        { id: 19, name: "激しいタックル", cooldown: 20, type: "buff", target: "tackle", value: 30 },
        { id: 20, name: "ハイライン・ハイプレス", cooldown: 45, type: "buff", target: "press", value: 40 },
        { id: 21, name: "リトリート・５バック化", cooldown: 50, type: "action", actionType: "parkBus" },
        { id: 22, name: "オフサイドトラップ", cooldown: 40, type: "action", actionType: "offsideTrap" },

        // Transition & Situation
        { id: 23, name: "ファスト・ブレイク", cooldown: 30, type: "buff", target: "speed", value: 20 },
        { id: 24, name: "カウンター・プレス", cooldown: 35, type: "buff", target: "press", value: 25 },
        { id: 25, name: "ゲーゲンプレス", cooldown: 50, type: "action", actionType: "gegenpress" },
        { id: 26, name: "ロングカウンター", cooldown: 40, type: "action", actionType: "longCounter" },
        { id: 27, name: "【回数制限】選手交代", cooldown: 0, type: "special", actionType: "substitute", maxUses: 3 },
        { id: 28, name: "【回数制限】パワープレー", cooldown: 0, type: "special", actionType: "powerPlay", maxUses: 1 },
        { id: 29, name: "【条件】逆境の猛攻", cooldown: 60, type: "special", actionType: "comeback", condition: "behind" },
        { id: 30, name: "【条件】ゲームクローズ", cooldown: 60, type: "special", actionType: "closeGame", condition: "lead" }
    ],

    Positions: ["GK", "CB", "SB", "CDM", "CM", "CAM", "WG", "CF"],

    Roles: {
        "GK": ["Classic", "Sweeper"],
        "CB": ["Stopper", "Covering", "Ball-Playing"],
        "SB": ["Defensive", "Attacking", "Inverted", "Wing-Back"],
        "CDM": ["Anchor", "Destroyer", "Deep-Lying"],
        "CM": ["Box-to-Box", "Advanced-Playmaker", "Ball-Winning"],
        "CAM": ["Shadow-Striker", "Enganche", "Dynamo"],
        "WG": ["Classic-Winger", "Inside-Forward", "Wide-Target-Man", "Crosser", "Wide-Playmaker", "Hard-Worker"], // Combining WB/SH roles here as well
        "CF": ["Poacher", "Target-Man", "False-9", "Complete"]
    },

    // Expanded Formations Data Structure (07_2_Formation_and_Shape.md)
    Formations: {
        "4-4-2": {
            slots: [
                { id: "GK", position: "GK", expectedPosStr: "GK", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Defensive" } },
                { id: "LCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: -30, baseMatrix: { lane: "Left Half-space", tier: "Defensive" } },
                { id: "RCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: 30, baseMatrix: { lane: "Right Half-space", tier: "Defensive" } },
                { id: "LSB", position: "SB", expectedPosStr: "SB", offsetX: 0, offsetY: -120, baseMatrix: { lane: "Left Outside", tier: "Defensive" } },
                { id: "RSB", position: "SB", expectedPosStr: "SB", offsetX: 0, offsetY: 120, baseMatrix: { lane: "Right Outside", tier: "Defensive" } },
                { id: "LCM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: -50, baseMatrix: { lane: "Left Half-space", tier: "Middle" } },
                { id: "RCM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: 50, baseMatrix: { lane: "Right Half-space", tier: "Middle" } },
                { id: "LWG", position: "WG", expectedPosStr: "WG", offsetX: 0, offsetY: -120, baseMatrix: { lane: "Left Outside", tier: "Middle" } },
                { id: "RWG", position: "WG", expectedPosStr: "WG", offsetX: 0, offsetY: 120, baseMatrix: { lane: "Right Outside", tier: "Middle" } },
                { id: "LCF", position: "CF", expectedPosStr: "CF", offsetX: 0, offsetY: -30, baseMatrix: { lane: "Left Half-space", tier: "Attacking" } },
                { id: "RCF", position: "CF", expectedPosStr: "CF", offsetX: 0, offsetY: 30, baseMatrix: { lane: "Right Half-space", tier: "Attacking" } }
            ],
            chemistryLinks: [
                { from: "LCB", to: "LSB" }, { from: "LCB", to: "LCM" }, { from: "LSB", to: "LWG" }, { from: "LCM", to: "LCF" },
                { from: "RCB", to: "RSB" }, { from: "RCB", to: "RCM" }, { from: "RSB", to: "RWG" }, { from: "RCM", to: "RCF" },
                { from: "LCB", to: "RCB" }, { from: "LCM", to: "RCM" }, { from: "LCF", to: "RCF" }
            ]
        },
        "4-3-3": {
            slots: [
                { id: "GK", position: "GK", expectedPosStr: "GK", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Defensive" } },
                { id: "LCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: -30, baseMatrix: { lane: "Left Half-space", tier: "Defensive" } },
                { id: "RCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: 30, baseMatrix: { lane: "Right Half-space", tier: "Defensive" } },
                { id: "LSB", position: "SB", expectedPosStr: "SB", offsetX: 0, offsetY: -120, baseMatrix: { lane: "Left Outside", tier: "Defensive" } },
                { id: "RSB", position: "SB", expectedPosStr: "SB", offsetX: 0, offsetY: 120, baseMatrix: { lane: "Right Outside", tier: "Defensive" } },
                { id: "CDM", position: "CDM", expectedPosStr: "CDM", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Middle" } },
                { id: "LCM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: -50, baseMatrix: { lane: "Left Half-space", tier: "Middle" } },
                { id: "RCM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: 50, baseMatrix: { lane: "Right Half-space", tier: "Middle" } },
                { id: "LWG", position: "WG", expectedPosStr: "WG", offsetX: 0, offsetY: -120, baseMatrix: { lane: "Left Outside", tier: "Attacking" } },
                { id: "RWG", position: "WG", expectedPosStr: "WG", offsetX: 0, offsetY: 120, baseMatrix: { lane: "Right Outside", tier: "Attacking" } },
                { id: "CF", position: "CF", expectedPosStr: "CF", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Attacking" } }
            ],
            chemistryLinks: [
                { from: "LCB", to: "LSB" }, { from: "LCB", to: "CDM" }, { from: "LSB", to: "LCM" }, { from: "LCM", to: "LWG" },
                { from: "RCB", to: "RSB" }, { from: "RCB", to: "CDM" }, { from: "RSB", to: "RCM" }, { from: "RCM", to: "RWG" },
                { from: "CDM", to: "LCM" }, { from: "CDM", to: "RCM" }, { from: "LCM", to: "CF" }, { from: "RCM", to: "CF" }, { from: "LWG", to: "CF" }, { from: "RWG", to: "CF" }
            ]
        },
        "3-2-4-1": {
            slots: [
                { id: "GK", position: "GK", expectedPosStr: "GK", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Defensive" } },
                { id: "LCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: -60, baseMatrix: { lane: "Left Half-space", tier: "Defensive" } },
                { id: "CB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Defensive" } },
                { id: "RCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: 60, baseMatrix: { lane: "Right Half-space", tier: "Defensive" } },
                { id: "LCDM", position: "CDM", expectedPosStr: "CDM", offsetX: 0, offsetY: -30, baseMatrix: { lane: "Left Half-space", tier: "Middle" } },
                { id: "RCDM", position: "CDM", expectedPosStr: "CDM", offsetX: 0, offsetY: 30, baseMatrix: { lane: "Right Half-space", tier: "Middle" } },
                { id: "LCAM", position: "CAM", expectedPosStr: "CAM", offsetX: 0, offsetY: -30, baseMatrix: { lane: "Left Half-space", tier: "Attacking" } },
                { id: "RCAM", position: "CAM", expectedPosStr: "CAM", offsetX: 0, offsetY: 30, baseMatrix: { lane: "Right Half-space", tier: "Attacking" } },
                { id: "LWG", position: "WG", expectedPosStr: "WG", offsetX: 0, offsetY: -120, baseMatrix: { lane: "Left Outside", tier: "Middle" } },
                { id: "RWG", position: "WG", expectedPosStr: "WG", offsetX: 0, offsetY: 120, baseMatrix: { lane: "Right Outside", tier: "Middle" } },
                { id: "CF", position: "CF", expectedPosStr: "CF", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Attacking" } }
            ],
            chemistryLinks: []
        },
        "4-1-4-1": {
            slots: [
                { id: "GK", position: "GK", expectedPosStr: "GK", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Defensive" } },
                { id: "LCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: -30, baseMatrix: { lane: "Left Half-space", tier: "Defensive" } },
                { id: "RCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: 30, baseMatrix: { lane: "Right Half-space", tier: "Defensive" } },
                { id: "LSB", position: "SB", expectedPosStr: "SB", offsetX: 0, offsetY: -120, baseMatrix: { lane: "Left Outside", tier: "Defensive" } },
                { id: "RSB", position: "SB", expectedPosStr: "SB", offsetX: 0, offsetY: 120, baseMatrix: { lane: "Right Outside", tier: "Defensive" } },
                { id: "CDM", position: "CDM", expectedPosStr: "CDM", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Middle" } },
                { id: "LCM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: -50, baseMatrix: { lane: "Left Half-space", tier: "Attacking" } },
                { id: "RCM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: 50, baseMatrix: { lane: "Right Half-space", tier: "Attacking" } },
                { id: "LWG", position: "WG", expectedPosStr: "WG", offsetX: 0, offsetY: -120, baseMatrix: { lane: "Left Outside", tier: "Middle" } },
                { id: "RWG", position: "WG", expectedPosStr: "WG", offsetX: 0, offsetY: 120, baseMatrix: { lane: "Right Outside", tier: "Middle" } },
                { id: "CF", position: "CF", expectedPosStr: "CF", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Attacking" } }
            ],
            chemistryLinks: []
        },
        "4-2-3-1": {
            slots: [
                { id: "GK", position: "GK", expectedPosStr: "GK", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Defensive" } },
                { id: "LCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: -30, baseMatrix: { lane: "Left Half-space", tier: "Defensive" } },
                { id: "RCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: 30, baseMatrix: { lane: "Right Half-space", tier: "Defensive" } },
                { id: "LSB", position: "SB", expectedPosStr: "SB", offsetX: 0, offsetY: -120, baseMatrix: { lane: "Left Outside", tier: "Defensive" } },
                { id: "RSB", position: "SB", expectedPosStr: "SB", offsetX: 0, offsetY: 120, baseMatrix: { lane: "Right Outside", tier: "Defensive" } },
                { id: "LCDM", position: "CDM", expectedPosStr: "CDM", offsetX: 0, offsetY: -30, baseMatrix: { lane: "Left Half-space", tier: "Middle" } },
                { id: "RCDM", position: "CDM", expectedPosStr: "CDM", offsetX: 0, offsetY: 30, baseMatrix: { lane: "Right Half-space", tier: "Middle" } },
                { id: "CAM", position: "CAM", expectedPosStr: "CAM", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Attacking" } },
                { id: "LWG", position: "WG", expectedPosStr: "WG", offsetX: 0, offsetY: -120, baseMatrix: { lane: "Left Outside", tier: "Attacking" } },
                { id: "RWG", position: "WG", expectedPosStr: "WG", offsetX: 0, offsetY: 120, baseMatrix: { lane: "Right Outside", tier: "Attacking" } },
                { id: "CF", position: "CF", expectedPosStr: "CF", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Attacking" } }
            ],
            chemistryLinks: []
        },
        "5-3-2": {
            slots: [
                { id: "GK", position: "GK", expectedPosStr: "GK", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Defensive" } },
                { id: "LCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: -60, baseMatrix: { lane: "Left Half-space", tier: "Defensive" } },
                { id: "CB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Defensive" } },
                { id: "RCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: 60, baseMatrix: { lane: "Right Half-space", tier: "Defensive" } },
                { id: "LSB", position: "SB", expectedPosStr: "SB", offsetX: 0, offsetY: -120, baseMatrix: { lane: "Left Outside", tier: "Defensive" } },
                { id: "RSB", position: "SB", expectedPosStr: "SB", offsetX: 0, offsetY: 120, baseMatrix: { lane: "Right Outside", tier: "Defensive" } },
                { id: "LCM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: -40, baseMatrix: { lane: "Left Half-space", tier: "Middle" } },
                { id: "CM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Middle" } },
                { id: "RCM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: 40, baseMatrix: { lane: "Right Half-space", tier: "Middle" } },
                { id: "LCF", position: "CF", expectedPosStr: "CF", offsetX: 0, offsetY: -30, baseMatrix: { lane: "Left Half-space", tier: "Attacking" } },
                { id: "RCF", position: "CF", expectedPosStr: "CF", offsetX: 0, offsetY: 30, baseMatrix: { lane: "Right Half-space", tier: "Attacking" } }
            ],
            chemistryLinks: []
        },
        "4-3-1-2": {
            slots: [
                { id: "GK", position: "GK", expectedPosStr: "GK", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Defensive" } },
                { id: "LCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: -30, baseMatrix: { lane: "Left Half-space", tier: "Defensive" } },
                { id: "RCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: 30, baseMatrix: { lane: "Right Half-space", tier: "Defensive" } },
                { id: "LSB", position: "SB", expectedPosStr: "SB", offsetX: 0, offsetY: -120, baseMatrix: { lane: "Left Outside", tier: "Defensive" } },
                { id: "RSB", position: "SB", expectedPosStr: "SB", offsetX: 0, offsetY: 120, baseMatrix: { lane: "Right Outside", tier: "Defensive" } },
                { id: "LCM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: -50, baseMatrix: { lane: "Left Half-space", tier: "Middle" } },
                { id: "CM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Middle" } },
                { id: "RCM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: 50, baseMatrix: { lane: "Right Half-space", tier: "Middle" } },
                { id: "CAM", position: "CAM", expectedPosStr: "CAM", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Attacking" } },
                { id: "LCF", position: "CF", expectedPosStr: "CF", offsetX: 0, offsetY: -30, baseMatrix: { lane: "Left Half-space", tier: "Attacking" } },
                { id: "RCF", position: "CF", expectedPosStr: "CF", offsetX: 0, offsetY: 30, baseMatrix: { lane: "Right Half-space", tier: "Attacking" } }
            ],
            chemistryLinks: []
        },
        "3-5-2": {
            slots: [
                { id: "GK", position: "GK", expectedPosStr: "GK", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Defensive" } },
                { id: "LCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: -60, baseMatrix: { lane: "Left Half-space", tier: "Defensive" } },
                { id: "CB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Defensive" } },
                { id: "RCB", position: "CB", expectedPosStr: "CB", offsetX: 0, offsetY: 60, baseMatrix: { lane: "Right Half-space", tier: "Defensive" } },
                { id: "CDM", position: "CDM", expectedPosStr: "CDM", offsetX: 0, offsetY: 0, baseMatrix: { lane: "Center", tier: "Middle" } },
                { id: "LCM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: -40, baseMatrix: { lane: "Left Half-space", tier: "Middle" } },
                { id: "RCM", position: "CM", expectedPosStr: "CM", offsetX: 0, offsetY: 40, baseMatrix: { lane: "Right Half-space", tier: "Middle" } },
                { id: "LWG", position: "WG", expectedPosStr: "WG", offsetX: 0, offsetY: -120, baseMatrix: { lane: "Left Outside", tier: "Middle" } },
                { id: "RWG", position: "WG", expectedPosStr: "WG", offsetX: 0, offsetY: 120, baseMatrix: { lane: "Right Outside", tier: "Middle" } },
                { id: "LCF", position: "CF", expectedPosStr: "CF", offsetX: 0, offsetY: -30, baseMatrix: { lane: "Left Half-space", tier: "Attacking" } },
                { id: "RCF", position: "CF", expectedPosStr: "CF", offsetX: 0, offsetY: 30, baseMatrix: { lane: "Right Half-space", tier: "Attacking" } }
            ],
            chemistryLinks: []
        }
    }
};

// Expose globally or export if using modules
window.MasterData = MasterData;
window.TacticalPreferences = TacticalPreferences;
