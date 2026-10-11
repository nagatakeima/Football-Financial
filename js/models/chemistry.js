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
            links.push([0, 1], [0, 2]); // GK to CBs
            links.push([1, 2], [1, 3], [2, 4]); // CBs and SBs
            links.push([1, 5], [2, 5], [3, 6], [4, 7]); // Defs to Mids (5:CDM, 6,7:CM)
            links.push([5, 6], [5, 7]); // Midfield links
            links.push([6, 8], [7, 10], [5, 9]); // Mids to Forwards (8,10:WG, 9:CF)
        } else if (formation === "3-2-4-1") {
            links.push([0, 1], [0, 2], [0, 3]); // GK to 3 CBs
            links.push([1, 2], [2, 3]); // CB links
            links.push([1, 4], [2, 4], [2, 5], [3, 5]); // CBs to 2 CDMs
            links.push([4, 5], [4, 6], [5, 7], [4, 8], [5, 9]); // CDMs to wide and AMs
            links.push([6, 8], [7, 9], [8, 9]); // AMs and wide
            links.push([8, 10], [9, 10]); // AMs to CF
        } else if (formation === "4-1-4-1") {
            links.push([0, 1], [0, 2]); // GK to CBs
            links.push([1, 2], [1, 3], [2, 4]); // CBs and SBs
            links.push([1, 5], [2, 5]); // CBs to CDM
            links.push([3, 6], [5, 7], [5, 8], [4, 9]); // CDM/SBs to Mid 4
            links.push([6, 7], [7, 8], [8, 9]); // Mid 4 links
            links.push([7, 10], [8, 10]); // CMs to CF
        } else if (formation === "4-2-3-1") {
            links.push([0, 1], [0, 2]); // GK to CBs
            links.push([1, 2], [1, 3], [2, 4]); // CBs and SBs
            links.push([1, 5], [2, 6], [3, 5], [4, 6]); // Defs to 2 CDMs
            links.push([5, 6]); // CDM links
            links.push([5, 7], [5, 8], [6, 8], [6, 9]); // CDMs to AM/WG
            links.push([7, 8], [8, 9]); // AM line
            links.push([8, 10]); // CAM to CF
        } else if (formation === "5-3-2") {
            links.push([0, 1], [0, 2], [0, 3]); // GK to 3 CBs
            links.push([1, 2], [2, 3], [1, 4], [3, 5]); // CBs and WBs
            links.push([1, 6], [2, 7], [3, 8], [4, 6], [5, 8]); // Defs to Mids
            links.push([6, 7], [7, 8]); // Mid 3 links
            links.push([6, 9], [7, 9], [7, 10], [8, 10]); // Mids to 2 CFs
            links.push([9, 10]); // CFs
        } else if (formation === "4-3-1-2") {
            links.push([0, 1], [0, 2]); // GK to CBs
            links.push([1, 2], [1, 3], [2, 4]); // CBs and SBs
            links.push([1, 5], [2, 6], [3, 5], [4, 7]); // Defs to 3 CMs
            links.push([5, 6], [6, 7]); // Mid links
            links.push([5, 8], [6, 8], [7, 8]); // CMs to CAM
            links.push([8, 9], [8, 10]); // CAM to 2 CFs
            links.push([9, 10]); // CFs
        } else if (formation === "3-5-2") {
            links.push([0, 1], [0, 2], [0, 3]); // GK to 3 CBs
            links.push([1, 2], [2, 3]); // CBs
            links.push([1, 4], [3, 5], [1, 6], [2, 7], [3, 8]); // CBs to Mid 5 (4,5:WG, 6,8:CM, 7:CDM)
            links.push([4, 6], [6, 7], [7, 8], [8, 5]); // Mid links
            links.push([6, 9], [7, 9], [7, 10], [8, 10]); // Mids to 2 CFs
            links.push([9, 10]); // CFs
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
        links.forEach(([idx1, idx2]) => {
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
