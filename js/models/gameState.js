class GameState {
    constructor() {
        this.playerTeam = null;
        this.funds = 0;
        this.ap = 0;

        this.currentTier = 3;
        this.league = null;

        this.isGameOver = false;

        // References to current events, etc.
        this.currentEvents = [];

        // Hidden parameters for event generation
        this.morale = 50;
        this.losingStreak = 0;
        this.managerInfluence = 0; // Increases when spending high AP
    }

    startNewDive(managerId) {
        const managerData = window.MasterData.Managers.find(m => m.id === managerId);

        this.playerTeam = new window.Team("player_1", "Your Club", true);
        this.playerTeam.setManager(managerData);

        this.funds = managerData.initialFunds;
        this.ap = 5;
        this.currentTier = 3;

        // Give player some random micro commands to start (e.g., 4 commands)
        this.playerTeam.microCommands = window.MasterData.MicroCommands
            .sort(() => 0.5 - Math.random())
            .slice(0, 4)
            .map(cmd => cmd.id);

        this.initializeLeague(this.currentTier);
    }

    initializeLeague(tier) {
        this.league = new window.League(tier);
        this.league.initializeLeague(this.playerTeam);
    }

    processPostMatch(homeScore, awayScore) {
        // Record player match result
        const currentMatchday = this.league.schedule[this.league.currentMatchday - 1];
        const playerMatch = currentMatchday.find(m => m.home.isPlayerTeam || m.away.isPlayerTeam);

        const isHome = playerMatch.home.isPlayerTeam;
        this.league.recordMatchResult(playerMatch,
            isHome ? homeScore : awayScore,
            isHome ? awayScore : homeScore
        );

        // Simulate rest of the league
        this.league.simulateOtherMatches(this.league.currentMatchday - 1);

        // Give AP and basic funds
        this.ap = Math.min(this.ap + 5, 10); // cap at 10 for now

        let matchFunds = 100000;
        if (homeScore > awayScore && isHome || awayScore > homeScore && !isHome) {
            matchFunds += 50000; // Win bonus
        } else if (homeScore === awayScore) {
            matchFunds += 20000; // Draw bonus
        }

        // Apply Post-Match Relics
        let conditionRecoveryBonus = 0;
        this.playerTeam.relics.forEach(relicId => {
            const relic = window.MasterData.Relics.find(r => r.id === relicId);
            if (relic) {
                if (relic.effectType === "FUNDS_UP") {
                    matchFunds += relic.value;
                }
                if (relic.effectType === "CONDITION_RECOVERY") {
                    conditionRecoveryBonus += relic.value;
                }
            }
        });

        // Apply condition recovery
        this.playerTeam.players.forEach(p => {
             // base match stamina recovery (e.g., 20) + relic bonus
             p.condition = Math.min(100, p.condition + 20 + conditionRecoveryBonus);
             p.currentStamina = p.stats.stamina; // Reset match stamina
        });

        this.funds += matchFunds;

        // Advance Matchday
        this.league.currentMatchday++;

        // Clear events so they regenerate next turn
        this.currentEvents = [];
        this.eventsGeneratedForTurn = false;
        this.hasRestedThisTurn = false; // Reset rest limit

        // Update hidden params
        this.morale = Math.max(0, Math.min(100, this.morale + (homeScore > awayScore ? 10 : (homeScore === awayScore ? 0 : -10))));
        if (homeScore < awayScore) this.losingStreak++;
        else this.losingStreak = 0;

        this.checkDismissal();
    }

    checkDismissal() {
        const remainingMatches = this.league.totalMatchdays - (this.league.currentMatchday - 1);
        if (remainingMatches <= 0) {
            this.handleSeasonEnd();
            return;
        }

        const standings = this.league.getStandings();
        const playerRank = standings.findIndex(t => t.isPlayerTeam) + 1;
        const targetRank = this.currentTier === 1 ? 1 : 2; // 1st in div 1, top 2 in div 2/3

        if (playerRank > targetRank) {
            const targetTeam = standings[targetRank - 1];
            const pointGap = targetTeam.points - this.playerTeam.points;
            const maxPossiblePoints = remainingMatches * 3;

            // If mathematically impossible to catch up
            if (pointGap > maxPossiblePoints) {
                this.isGameOver = true;
                alert("解任されました。目標順位への到達が数学的に不可能です。");
            }
        }
    }

    handleSeasonEnd() {
        const standings = this.league.getStandings();
        const playerRank = standings.findIndex(t => t.isPlayerTeam) + 1;
        const targetRank = this.currentTier === 1 ? 1 : 2;

        if (playerRank <= targetRank) {
            if (this.currentTier === 1) {
                alert("優勝おめでとうございます！ゲームクリア！");
                this.isGameOver = true;
            } else {
                this.seasonJustEnded = true;
                this.currentTier--;
                this.initializeLeague(this.currentTier);
            }
        } else {
            this.isGameOver = true;
        }
    }
}

// Singleton instance
window.gameState = new GameState();