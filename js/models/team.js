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
        this.ownedMicroCommands = []; // Array of all owned micro command IDs
        this.microCommands = []; // Array of selected micro command IDs (max 4) // Array of selected micro command IDs (max 4)

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

        // Determine which starter indices get 'R' rarity (3 to 5 players)
        const numRare = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
        let rareIndices = [];
        while(rareIndices.length < numRare) {
            let r = Math.floor(Math.random() * 11);
            if(rareIndices.indexOf(r) === -1) rareIndices.push(r);
        }

        // Calculate levels to hit averages (Starter avg ~3.0 => sum ~33, Bench avg ~2.5 => sum ~17-18)
        const generateLevels = (count, targetSum) => {
            let levels = Array(count).fill(1);
            let currentSum = count;
            while(currentSum < targetSum) {
                let idx = Math.floor(Math.random() * count);
                if(levels[idx] < 5) {
                    levels[idx]++;
                    currentSum++;
                }
            }
            return levels;
        };

        const starterLevels = generateLevels(11, 33);
        const benchLevels = generateLevels(7, 18);

        for (let i = 0; i < 18; i++) {
            const pos = i < reqPositions.length ? reqPositions[i] : null;

            let rarity = 'N';
            if (i < 11 && rareIndices.includes(i)) rarity = 'R';


            // Adjust rarity based on concept
            if (!this.isPlayerTeam) {
                if (this.specializedConcept === 'HighLine' && i < 11 && (pos === 'WG' || pos === 'CF' || pos === 'CAM')) {
                    if (Math.random() > 0.5) rarity = 'R';
                }
            }

            const p = window.Player.generateRandom(`${this.id}_${i}`, pos, rarity);

            // Apply targeted stat boosts based on concept
            if (!this.isPlayerTeam) {
                if (this.specializedConcept === 'HighLine') {
                    p.stats.speed = Math.min(100, p.stats.speed + 15);
                } else if (this.specializedConcept === 'TargetMan') {
                    if (pos === 'CF' || pos === 'CB') {
                        p.stats.physical = Math.min(100, p.stats.physical + 20);
                    }
                } else if (this.specializedConcept === 'LowBlock') {
                    if (pos === 'CB' || pos === 'SB' || pos === 'CDM') {
                        p.stats.defense = Math.min(100, p.stats.defense + 15);
                    }
                }
            }

            // Assign level and pre-calculate stats for that level
            const targetLevel = i < 11 ? starterLevels[i] : benchLevels[i - 11];
            p.level = targetLevel;
            p.maxExp = targetLevel * 100;
            // Approximate stat growth for initial levels (e.g., level - 1 times random 2-3)
            if (targetLevel > 1) {
                for (let key in p.stats) {
                    const growth = (targetLevel - 1) * (Math.floor(Math.random() * 2) + 2);
                    p.stats[key] = Math.min(100, p.stats[key] + growth);
                }
            }

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
        // randomly choose a formation from the manager's preferred ones
        this.formation = managerData.formations[Math.floor(Math.random() * managerData.formations.length)];

        // Re-generate squad to perfectly fit the chosen formation
        this.players = [];
        this.starting11 = [];
        this.bench = [];

        const formationData = window.MasterData.Formations[this.formation];
        const reqPositions = formationData.slots.map(slot => slot.expectedPosStr);

        // Determine which starter indices get 'R' rarity (3 to 5 players) for player team
        const numRare = this.isPlayerTeam ? Math.floor(Math.random() * 3) + 3 : 0;
        let rareIndices = [];
        if (this.isPlayerTeam) {
            while(rareIndices.length < numRare) {
                let r = Math.floor(Math.random() * 11);
                if(rareIndices.indexOf(r) === -1) rareIndices.push(r);
            }
        }

        const generateLevels = (count, targetSum) => {
            let levels = Array(count).fill(1);
            let currentSum = count;
            while(currentSum < targetSum) {
                let idx = Math.floor(Math.random() * count);
                if(levels[idx] < 5) {
                    levels[idx]++;
                    currentSum++;
                }
            }
            return levels;
        };

        let starterLevels, benchLevels;
        if (this.isPlayerTeam) {
            starterLevels = generateLevels(11, 33);
            benchLevels = generateLevels(7, 18);
        } else {
            // For AI teams, we can keep them simpler or scale with tier later. For now, flat 1 or slightly randomized.
            starterLevels = Array(11).fill(1).map(() => Math.floor(Math.random() * 3) + 1);
            benchLevels = Array(7).fill(1).map(() => Math.floor(Math.random() * 2) + 1);
        }

        // --- Specialized CPU Team Generation ---
        if (!this.isPlayerTeam) {
            const types = ['Normal', 'HighLine', 'TargetMan', 'LowBlock'];
            this.specializedConcept = types[Math.floor(Math.random() * types.length)];

            if (this.specializedConcept === 'HighLine') {
                this.formation = "4-3-3";
                managerData.preference = "HighPress";
            } else if (this.specializedConcept === 'TargetMan') {
                this.formation = "4-4-2";
                managerData.preference = "Counter";
            } else if (this.specializedConcept === 'LowBlock') {
                this.formation = "5-4-1";
                managerData.preference = "Retreat";
            }
        }

        // Ensure 18 players
        for (let i = 0; i < 18; i++) {
            const pos = i < reqPositions.length ? reqPositions[i] : null;

            let rarity = 'N';
            if (this.isPlayerTeam && i < 11 && rareIndices.includes(i)) rarity = 'R';
            else if (!this.isPlayerTeam) {
                // simple scaling for AI if needed, default to N for now
            }

            const p = window.Player.generateRandom(`${this.id}_${i}`, pos, rarity);

            const targetLevel = i < 11 ? starterLevels[i] : benchLevels[i - 11];
            p.level = targetLevel;
            p.maxExp = targetLevel * 100;
            if (targetLevel > 1) {
                for (let key in p.stats) {
                    const growth = (targetLevel - 1) * (Math.floor(Math.random() * 2) + 2);
                    p.stats[key] = Math.min(100, p.stats[key] + growth);
                }
            }

            this.players.push(p);

            if (i < 11) {
                this.starting11.push(p);
            } else {
                this.bench.push(p);
            }
        }

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