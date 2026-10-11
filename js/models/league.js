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

        // Generate 9 CPU teams
        const cpuNames = ["FC Alpha", "Beta United", "Gamma City", "Delta Rovers", "Epsilon Town", "Zeta Athletic", "Eta Wanderers", "Theta Sporting", "Iota Dynamo"];
        for (let i = 0; i < 9; i++) {
            const t = new window.Team(`CPU_${this.tier}_${i}`, cpuNames[i], false);
            // Give CPU teams random formations and some strength bias based on tier
            t.formation = "4-4-2";
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