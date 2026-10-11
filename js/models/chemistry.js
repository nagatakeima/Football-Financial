class ChemistrySystem {
    // Defines adjacent links for supported formations
    static getFormationLinks(formation) {
        const links = [];

        if (formation === "4-4-2") {
            // GK to CBs
            links.push([0, 1], [0, 2]); // Assuming 0:GK, 1:CB, 2:CB
            // CBs to each other and SBs
            links.push([1, 2], [1, 3], [2, 4]); // 3:SB, 4:SB
            // Defenders to Midfielders
            links.push([3, 7], [4, 8], [1, 5], [2, 6]); // 5,6:CM, 7,8:WG/SMF
            // Mids to Forwards
            links.push([5, 9], [6, 10]); // 9,10:CF
        } else if (formation === "4-3-3") {
            // Simplified links for 4-3-3
            links.push([0, 1], [0, 2]);
            links.push([1, 2], [1, 3], [2, 4]);
            links.push([1, 5], [2, 5], [3, 6], [4, 7]); // 5:CDM, 6,7:CM
            links.push([5, 6], [5, 7]);
            links.push([6, 8], [7, 10], [5, 9]); // 8,10:WG, 9:CF
        }
        // Fallback for others - simple chain
        else {
            for(let i=0; i<10; i++) {
                links.push([i, i+1]);
            }
        }

        return links;
    }

    static calculateTeamChemistry(team) {
        if (!team || team.starting11.length < 11) return;

        const links = this.getFormationLinks(team.formation);
        let activeBuffsCount = 0;

        // Reset dynamic stats
        team.starting11.forEach(p => {
            p.dynamicStats = { ...p.stats };
        });

        // Calculate preference matches
        links.forEach(([idx1, idx2]) => {
            if (idx1 >= team.starting11.length || idx2 >= team.starting11.length) return;

            const p1 = team.starting11[idx1];
            const p2 = team.starting11[idx2];

            if (p1.preference === p2.preference) {
                // Determine multiplier from Relics (e.g., Possession Philosophy = 1.5x)
                let multiplier = 1.0;

                team.relics.forEach(relicId => {
                    const relic = window.MasterData.Relics.find(r => r.id === relicId);
                    if (relic && relic.effectType === "CHEMISTRY_BOOST" && relic.targetPref === p1.preference) {
                        multiplier = Math.max(multiplier, relic.multiplier);
                    }
                });

                // Apply +10% base stat boost for linked players
                const boost = 1.1 * multiplier;
                this.applyBoost(p1, boost);
                this.applyBoost(p2, boost);

                activeBuffsCount++;
            }
        });

        // Apply individual skill bonuses and global relics
        team.starting11.forEach(p => {
            // Relic: STAT_UP
            team.relics.forEach(relicId => {
                const relic = window.MasterData.Relics.find(r => r.id === relicId);
                if (relic) {
                    if (relic.effectType === "STAT_UP" && p.dynamicStats[relic.target]) {
                        p.dynamicStats[relic.target] += relic.value;
                    }
                    if (relic.effectType === "ALL_STAT_UP") {
                        Object.keys(p.dynamicStats).forEach(k => p.dynamicStats[k] += relic.value);
                    }
                }
            });

            // Skill: Dynamo
            if (p.skills.includes(2)) { // 2 = Dynamo
                p.staminaConsumptionRate = 0.5; // Custom field for match engine
            } else {
                p.staminaConsumptionRate = 1.0;
            }
        });

        return activeBuffsCount;
    }

    static applyBoost(player, multiplier) {
        Object.keys(player.dynamicStats).forEach(key => {
            player.dynamicStats[key] = Math.min(100, player.dynamicStats[key] * multiplier);
        });
    }
}

window.ChemistrySystem = ChemistrySystem;
