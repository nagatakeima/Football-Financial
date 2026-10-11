class Team {
    constructor(id, name, isPlayerTeam = false) {
        this.id = id;
        this.name = name;
        this.isPlayerTeam = isPlayerTeam;

        this.players = []; // All players (max 18)
        this.starting11 = []; // IDs or Player objects
        this.bench = [];

        this.manager = null; // Object containing manager info
        this.formation = "4-4-2"; // Current formation string
        this.relics = []; // Array of active relic IDs
        this.microCommands = []; // Array of selected micro command IDs (max 4)

        // League Stats
        this.points = 0;
        this.wins = 0;
        this.draws = 0;
        this.losses = 0;
        this.goalsFor = 0;
        this.goalsAgainst = 0;

        this.generateDefaultSquad();
    }

    get goalDifference() {
        return this.goalsFor - this.goalsAgainst;
    }

    generateDefaultSquad() {
        // Generate 18 players ensuring minimal positional coverage
        const reqPositions = ["GK", "CB", "CB", "SB", "SB", "CM", "CM", "WG", "WG", "CF", "CF"];

        for (let i = 0; i < 18; i++) {
            const pos = i < reqPositions.length ? reqPositions[i] : null;
            const p = window.Player.generateRandom(`${this.id}_${i}`, pos);
            this.players.push(p);

            if (i < 11) {
                this.starting11.push(p);
            } else {
                this.bench.push(p);
            }
        }
    }

    setManager(managerData) {
        this.manager = managerData;
        this.formation = managerData.formations[0]; // default to first formation

        // Find and add initial trait/relic if it exists in MasterData
        const initialRelic = window.MasterData.Relics.find(r => r.name === managerData.initialTrait);
        if (initialRelic && !this.relics.includes(initialRelic.id)) {
            this.relics.push(initialRelic.id);
        }
    }

    // Calculates overall team strength (simple average for simulation)
    getOverallStrength() {
        if (this.starting11.length === 0) return 50;

        let total = 0;
        this.starting11.forEach(p => {
            const avgStat = Object.values(p.stats).reduce((a, b) => a + b, 0) / 7;
            total += avgStat;
        });
        return total / 11;
    }
}

window.Team = Team;