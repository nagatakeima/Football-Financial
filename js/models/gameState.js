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
        this.funds += matchFunds;

        // Advance Matchday
        this.league.currentMatchday++;

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
                alert(`第${this.currentTier}部リーグを突破しました！昇格します。`);
                this.currentTier--;
                this.initializeLeague(this.currentTier);
            }
        } else {
            this.isGameOver = true;
            alert("シーズン終了時、目標順位に届きませんでした。解任されました。");
        }
    }
}

// Singleton instance
window.gameState = new GameState();