class ChemistrySystem {
    // Defines adjacent links for supported formations
    static getFormationLinks(formation) {
        const formationData = window.MasterData.Formations[formation];
        if (formationData && formationData.chemistryLinks && formationData.chemistryLinks.length > 0) {
            return formationData.chemistryLinks;
        }

        // Fallback for others - simple chain
        const links = [];
        for(let i=0; i<10; i++) {
            links.push([i, i+1]);
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
        links.forEach(({from, to}) => {
            const idx1 = team.starting11.findIndex(p => p.slotId && p.slotId.includes(from) || p.expectedPosStr === from);
            const idx2 = team.starting11.findIndex(p => p.slotId && p.slotId.includes(to) || p.expectedPosStr === to);

            if (idx1 === -1 || idx2 === -1) return;
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
            // Relic: STAT_UP & LOW_STAT_BOOST
            team.relics.forEach(relicId => {
                const relic = window.MasterData.Relics.find(r => r.id === relicId);
                if (relic) {
                    if (relic.effectType === "STAT_UP" && p.dynamicStats[relic.target]) {
                        p.dynamicStats[relic.target] = Math.min(100, p.dynamicStats[relic.target] + relic.value);
                    }
                    if (relic.effectType === "ALL_STAT_UP") {
                        Object.keys(p.dynamicStats).forEach(k => {
                            p.dynamicStats[k] = Math.min(100, p.dynamicStats[k] + relic.value);
                        });
                    }
                    if (relic.effectType === "LOW_STAT_BOOST") {
                        Object.keys(p.dynamicStats).forEach(k => {
                            if (p.dynamicStats[k] < relic.threshold) {
                                p.dynamicStats[k] = Math.min(100, p.dynamicStats[k] + relic.value);
                            }
                        });
                    }
                }
            });

            // Player Skills Pre-match stat modifications
            p.staminaConsumptionRate = 1.0;
            p.injuryRiskMultiplier = 1.0;

            p.skills.forEach(skillId => {
                switch(skillId) {
                    case 2: // ダイナモ (Dynamo)
                        p.staminaConsumptionRate = 0.5;
                        break;
                    case 4: // パスマスター (Pass Master)
                        p.dynamicStats.pass = Math.min(100, p.dynamicStats.pass + 15);
                        break;
                    case 5: // ハードタッカー (Hard Tackler)
                        p.dynamicStats.defense = Math.min(100, p.dynamicStats.defense + 15);
                        break;
                    case 6: // スピードスター (Speedster)
                        p.dynamicStats.speed = Math.min(100, p.dynamicStats.speed + 15);
                        break;
                    case 8: // 鉄人 (Iron Man)
                        p.injuryRiskMultiplier = 0.1; // 10% normal risk
                        break;
                }
            });
        });

        // Skill: 司令塔 (Playmaker - ID: 7) - boost surrounding players pass
        links.forEach(({from, to}) => {
            const idx1 = team.starting11.findIndex(p => p.slotId && p.slotId.includes(from) || p.expectedPosStr === from);
            const idx2 = team.starting11.findIndex(p => p.slotId && p.slotId.includes(to) || p.expectedPosStr === to);

            if (idx1 === -1 || idx2 === -1) return;
            if (idx1 >= team.starting11.length || idx2 >= team.starting11.length) return;
            const p1 = team.starting11[idx1];
            const p2 = team.starting11[idx2];

            if (p1.skills.includes(7)) {
                p2.dynamicStats.pass = Math.min(100, p2.dynamicStats.pass + 5);
            }
            if (p2.skills.includes(7)) {
                p1.dynamicStats.pass = Math.min(100, p1.dynamicStats.pass + 5);
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
