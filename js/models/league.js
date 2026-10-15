class League {
    constructor(tier) {
        this.tier = tier; // 3, 2, or 1
        this.teams = [];
        this.currentMatchday = 1;
        this.totalMatchdays = 9;
        this.schedule = []; // Array of Matchday objects containing matchups
    }

    initializeLeague(playerTeam) {
        this.teams.push(playerTeam);

        // Tier multipliers
        let statBonus = 0;
        let extraRelics = 0;
        let numMicroCommands = 2; // tier 3 base

        if (this.tier === 2) {
            statBonus = 8;
            extraRelics = 1;
            numMicroCommands = 3;
        } else if (this.tier === 1) {
            statBonus = 16;
            extraRelics = 2;
            numMicroCommands = 4;
        }

        // Generate 9 CPU teams
        const cpuNames = ["FC Alpha", "Beta United", "Gamma City", "Delta Rovers", "Epsilon Town", "Zeta Athletic", "Eta Wanderers", "Theta Sporting", "Iota Dynamo"];
        for (let i = 0; i < 9; i++) {
            const t = new window.Team(`CPU_${this.tier}_${i}`, cpuNames[i], false);

            // Random Manager
            const manager = window.MasterData.Managers[Math.floor(Math.random() * window.MasterData.Managers.length)];
            t.setManager(manager); // This handles setting formation and generating squad to perfectly match it

            // Apply Tier Scaling to Stats
            if (statBonus > 0) {
                t.players.forEach(p => {
                    Object.keys(p.stats).forEach(k => {
                        p.stats[k] = Math.min(100, p.stats[k] + statBonus);
                    });
                });
            }

            // Apply Extra Relics
            const availableRelics = window.MasterData.Relics.filter(r => r.name !== manager.initialTrait);
            for (let j = 0; j < extraRelics; j++) {
                if (availableRelics.length > 0) {
                    const rIdx = Math.floor(Math.random() * availableRelics.length);
                    t.relics.push(availableRelics[rIdx].id);
                    availableRelics.splice(rIdx, 1);
                }
            }

            // Assign MicroCommands
            const availableCmds = [...window.MasterData.MicroCommands];
            for(let j = 0; j < numMicroCommands; j++) {
                if (availableCmds.length > 0) {
                    const cIdx = Math.floor(Math.random() * availableCmds.length);
                    t.microCommands.push(availableCmds[cIdx].id);
                    t.ownedMicroCommands.push(availableCmds[cIdx].id);
                    availableCmds.splice(cIdx, 1);
                }
            }
            while(t.microCommands.length < 4) {
                t.microCommands.push(null);
            }

            this.teams.push(t);
        }

        this.generateSchedule();
    }

    generateSchedule() {
        // Simple Round Robin for 10 teams (9 matchdays)
        // Fixed algorithm for round-robin
        const n = this.teams.length;
        const teams = [...this.teams];

        for (let round = 0; round < this.totalMatchdays; round++) {
            const matchday = [];
            for (let i = 0; i < n / 2; i++) {
                matchday.push({
                    home: teams[i],
                    away: teams[n - 1 - i],
                    isPlayed: false,
                    result: null // { homeScore, awayScore }
                });
            }
            this.schedule.push(matchday);

            // Rotate teams (keep first team fixed)
            teams.splice(1, 0, teams.pop());
        }
    }

    getStandings() {
        // Sort by Points, then Goal Difference, then Goals For
        return [...this.teams].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });
    }

    simulateOtherMatches(matchdayIndex) {
        if (matchdayIndex >= this.schedule.length) return;

        const matches = this.schedule[matchdayIndex];
        matches.forEach(match => {
            // Skip player's match, it will be played in the engine
            if (match.home.isPlayerTeam || match.away.isPlayerTeam) return;

            // Simple simulation based on overall strength + random factor
            const homeStr = match.home.getOverallStrength() + (Math.random() * 20); // slight home advantage
            const awayStr = match.away.getOverallStrength() + (Math.random() * 10);

            let homeScore = Math.floor(Math.random() * 3);
            let awayScore = Math.floor(Math.random() * 3);

            if (homeStr > awayStr + 10) homeScore += 1;
            else if (awayStr > homeStr + 10) awayScore += 1;

            this.recordMatchResult(match, homeScore, awayScore);
        });
    }

    recordMatchResult(match, homeScore, awayScore) {
        match.result = { homeScore, awayScore };
        match.isPlayed = true;

        match.home.goalsFor += homeScore;
        match.home.goalsAgainst += awayScore;
        match.away.goalsFor += awayScore;
        match.away.goalsAgainst += homeScore;

        if (homeScore > awayScore) {
            match.home.points += 3;
            match.home.wins += 1;
            match.away.losses += 1;
        } else if (awayScore > homeScore) {
            match.away.points += 3;
            match.away.wins += 1;
            match.home.losses += 1;
        } else {
            match.home.points += 1;
            match.away.points += 1;
            match.home.draws += 1;
            match.away.draws += 1;
        }
    }
}

window.League = League;