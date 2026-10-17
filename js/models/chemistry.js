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
            links.push({from: String(i), to: String(i+1)});
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
            const slots = window.MasterData.Formations[team.formation]?.slots || [];
            const idx1 = slots.findIndex(s => s.id === from);
            const idx2 = slots.findIndex(s => s.id === to);

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

            // Use generic skill parser
            const statUpEffects = window.Player.getSkillEffectFor(p, "STAT_UP", "all", []);
            if (statUpEffects.value > 0) {
                Object.keys(p.dynamicStats).forEach(k => {
                    p.dynamicStats[k] = Math.min(100, p.dynamicStats[k] + statUpEffects.value);
                });
            }

            Object.keys(p.dynamicStats).forEach(k => {
                const specificStatUp = window.Player.getSkillEffectFor(p, "STAT_UP", k, []);
                if (specificStatUp.value > 0) {
                     p.dynamicStats[k] = Math.min(100, p.dynamicStats[k] + specificStatUp.value);
                }
            });

            // Special composite stat ups (like pass_shoot)
            // Re-apply Player Skills PassMaster hardcode as generic fallback failed because effect is SUCCESS_RATE_UP for pass
            const passMaster = window.Player.getSkillEffectFor(p, "SUCCESS_RATE_UP", "pass", []);
            if (passMaster.value > 0) {
                 p.dynamicStats.pass = Math.min(100, p.dynamicStats.pass + passMaster.value);
            }
            const passShootUp = window.Player.getSkillEffectFor(p, "STAT_UP", "pass_shoot", []);
            if (passShootUp.value > 0) {
                 p.dynamicStats.pass = Math.min(100, p.dynamicStats.pass + passShootUp.value);
                 p.dynamicStats.shoot = Math.min(100, p.dynamicStats.shoot + passShootUp.value);
            }
            const passSpeedUp = window.Player.getSkillEffectFor(p, "STAT_UP", "pass_speed", []);
            if (passSpeedUp.value > 0) {
                 p.dynamicStats.pass = Math.min(100, p.dynamicStats.pass + passSpeedUp.value);
                 p.dynamicStats.speed = Math.min(100, p.dynamicStats.speed + passSpeedUp.value);
            }

            const staminaReduceEffects = window.Player.getSkillEffectFor(p, "STAMINA_REDUCE", "self", []);
            if (staminaReduceEffects.value > 0) {
                 // value is % reduction (e.g., 50 -> 0.5 rate)
                 p.staminaConsumptionRate = Math.max(0.1, 1.0 - (staminaReduceEffects.value / 100));
            }

            const injuryRiskEffects = window.Player.getSkillEffectFor(p, "PASSIVE_EFFECT", "injuryRisk", []);
            if (injuryRiskEffects.value < 0) {
                 // value is negative % (e.g., -90)
                 p.injuryRiskMultiplier = Math.max(0.01, 1.0 + (injuryRiskEffects.value / 100));
            }
        });

        // Skill: 司令塔 (Playmaker - ID: 7) - boost surrounding players pass
        links.forEach(({from, to}) => {
            const slots = window.MasterData.Formations[team.formation]?.slots || [];
            const idx1 = slots.findIndex(s => s.id === from);
            const idx2 = slots.findIndex(s => s.id === to);

            if (idx1 === -1 || idx2 === -1) return;
            if (idx1 >= team.starting11.length || idx2 >= team.starting11.length) return;
            const p1 = team.starting11[idx1];
            const p2 = team.starting11[idx2];

            const p1LinkBoost = window.Player.getSkillEffectFor(p1, "PASSIVE_EFFECT", "linkPassBoost", []);
            if (p1LinkBoost.value > 0) {
                p2.dynamicStats.pass = Math.min(100, p2.dynamicStats.pass + p1LinkBoost.value);
            }

            const p2LinkBoost = window.Player.getSkillEffectFor(p2, "PASSIVE_EFFECT", "linkPassBoost", []);
            if (p2LinkBoost.value > 0) {
                p1.dynamicStats.pass = Math.min(100, p1.dynamicStats.pass + p2LinkBoost.value);
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
