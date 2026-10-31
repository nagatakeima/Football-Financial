class Player {
    constructor(id, name, position, stats, preference, skills = [], role = null) {
        this.id = id;
        this.name = name;
        this.position = position; // e.g., 'GK', 'CB', 'CF'
        this.role = role; // e.g., 'Classic', 'Inverted', 'Poacher'

        // Growth & Rarity
        this.level = 1;
        this.exp = 0;
        this.maxExp = 100;
        this.isNew = false;
        this.rarity = 'N'; // N, R, SR, SSR
        this.nationality = Player.generateRandomNationality();

        // Base Stats (1-100)
        this.stats = {
            pass: stats.pass || 50,
            shoot: stats.shoot || 50,
            defense: stats.defense || 50,
            physical: stats.physical || 50,
            speed: stats.speed || 50,
            mental: stats.mental || 50,
            stamina: stats.stamina || 50
        };

        this.preference = preference; // Tactical Preference (e.g. 'Possession')
        this.skills = skills; // Array of skill IDs from MasterData

        // Match conditions
        this.currentStamina = this.stats.stamina;
        this.condition = 100; // 0-100, affects performance
        this.isInjured = false;
        this.subPositions = [];
        this.careerStats = { appearances: 0, goals: 0, assists: 0, avgRating: 0.0, totalRatingSum: 0 };
    }

    getOvr() {
        const { pass, shoot, defense, physical, speed, mental, stamina } = this.stats;
        let baseOvr = 0;
        switch (this.position) {
            case 'GK':
                baseOvr = defense * 0.40 + mental * 0.25 + physical * 0.20 + pass * 0.15;
                break;
            case 'CB':
                baseOvr = defense * 0.40 + physical * 0.30 + mental * 0.15 + speed * 0.10 + pass * 0.05;
                break;
            case 'SB':
                baseOvr = speed * 0.25 + defense * 0.25 + stamina * 0.20 + pass * 0.20 + physical * 0.10;
                break;
            case 'CDM':
                baseOvr = defense * 0.30 + pass * 0.25 + mental * 0.20 + physical * 0.15 + stamina * 0.10;
                break;
            case 'CM':
                baseOvr = pass * 0.30 + stamina * 0.20 + mental * 0.20 + defense * 0.15 + shoot * 0.15;
                break;
            case 'CAM':
                baseOvr = pass * 0.35 + shoot * 0.25 + mental * 0.20 + speed * 0.20;
                break;
            case 'WG':
                baseOvr = speed * 0.35 + shoot * 0.25 + pass * 0.25 + stamina * 0.15;
                break;
            case 'CF':
                baseOvr = shoot * 0.45 + physical * 0.20 + speed * 0.20 + mental * 0.15;
                break;
            default:
                baseOvr = Object.values(this.stats).reduce((a, b) => a + b, 0) / 7;
        }

        let rarityBonus = 0;
        if (this.rarity === 'R') rarityBonus = 2;
        if (this.rarity === 'SR') rarityBonus = 5;
        if (this.rarity === 'SSR') rarityBonus = 10;

        return Math.max(1, Math.min(100, Math.floor(baseOvr + rarityBonus)));
    }

    addExp(amount) {
        if (this.level >= 10) return; // Max level

        this.exp += amount;
        while (this.exp >= this.maxExp && this.level < 10) {
            this.exp -= this.maxExp;
            this.level++;
            this.maxExp = this.level * 100;

            // Increase all stats by flat 3
            for (let key in this.stats) {
                this.stats[key] = Math.min(100, this.stats[key] + 3);
            }
        }

        if (this.level >= 10) {
            this.exp = 0;
            this.maxExp = 0;
        }
    }

    static generateRandomNationality() {
        const nations = [
            "🇯🇵 日本", "🇬🇧 イングランド", "🇪🇸 スペイン", "🇧🇷 ブラジル",
            "🇩🇪 ドイツ", "🇫🇷 フランス", "🇮🇹 イタリア", "🇦🇷 アルゼンチン",
            "🇳🇱 オランダ", "🇵🇹 ポルトガル", "🇧🇪 ベルギー", "🇭🇷 クロアチア"
        ];
        return nations[Math.floor(Math.random() * nations.length)];
    }

    // Helper to generate a random player
    static generateRandom(id, position = null, rarity = 'N') {
        const initials = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Silva", "Costa", "Santos", "Oliveira", "Müller", "Schmidt", "Schneider", "Fischer", "Weber"];
        const ini = initials[Math.floor(Math.random() * 26)] + ".";
        const name = ini + " " + names[Math.floor(Math.random() * names.length)];

        if (!position) {
            position = window.MasterData.Positions[Math.floor(Math.random() * window.MasterData.Positions.length)];
        }

        const prefs = Object.values(window.TacticalPreferences);
        const preference = prefs[Math.floor(Math.random() * prefs.length)];

        let baseStat = 40; // N base
        if (rarity === 'R') baseStat = 55;
        if (rarity === 'SR') baseStat = 70;
        if (rarity === 'SSR') baseStat = 80;

        // Base random function for stats centered around the baseStat
        const genStat = (bonus = 0) => {
            let variance = Math.floor(Math.random() * 14) - 7; // -7 to +7
            return Math.min(100, Math.max(10, baseStat + variance + bonus));
        };

        // Random stats slightly weighted by position
        const posBonus = {
            GK: { defense: 15, mental: 12, physical: 10, pass: 0, shoot: -15, speed: -10, stamina: 0 },
            CB: { defense: 15, physical: 12, mental: 5, speed: -5, pass: -5, shoot: -15, stamina: 0 },
            SB: { speed: 12, defense: 10, stamina: 10, pass: 5, physical: 0, mental: 0, shoot: -10 },
            CDM: { defense: 12, pass: 10, mental: 10, physical: 5, stamina: 5, shoot: -5, speed: -5 },
            CM: { pass: 12, stamina: 10, mental: 5, defense: 5, shoot: 5, physical: 0, speed: 0 },
            CAM: { pass: 15, shoot: 10, speed: 10, mental: 5, physical: -5, defense: -10, stamina: 0 },
            WG: { speed: 15, shoot: 10, pass: 10, stamina: 5, physical: -5, defense: -10, mental: 0 },
            CF: { shoot: 15, physical: 10, speed: 10, mental: 5, defense: -15, pass: -5, stamina: -5 }
        }[position] || { pass: 0, shoot: 0, defense: 0, physical: 0, speed: 0, mental: 0, stamina: 0 };

        const stats = {
            pass: genStat(posBonus.pass),
            shoot: genStat(posBonus.shoot),
            defense: genStat(posBonus.defense),
            physical: genStat(posBonus.physical),
            speed: genStat(posBonus.speed),
            mental: genStat(posBonus.mental),
            stamina: genStat(posBonus.stamina)
        };

        // Clamp stats to 100
        for (let key in stats) {
            stats[key] = Math.min(100, stats[key]);
        }

        // Assign 1-2 random skills
        const numSkills = Math.floor(Math.random() * 3) + 1; // 1 to 3 skills
        const skills = [];

        // Filter skills by allowedPositions
        const allowedSkills = window.MasterData.PlayerSkills.filter(s => s.allowedPositions.includes(position));

        if (allowedSkills.length > 0) {
            for (let i = 0; i < numSkills; i++) {
                const randomSkill = allowedSkills[Math.floor(Math.random() * allowedSkills.length)];
                if (!skills.includes(randomSkill.id)) {
                    skills.push(randomSkill.id);
                }
            }
        }

        let role = null;
        if (window.MasterData.Roles && window.MasterData.Roles[position]) {
            const rolesForPos = window.MasterData.Roles[position];
            role = rolesForPos[Math.floor(Math.random() * rolesForPos.length)];
        }

        const player = new Player(id, name, position, stats, preference, skills, role);
        player.rarity = rarity;
        player.assignSubPositions();
        return player;
    }

    assignSubPositions() {
        this.subPositions = [];
        const { position, role, stats } = this;

        if (position === 'GK') {
            this.subPositions = [];
        } else if (position === 'CB') {
            if (role === 'Ball-Playing') {
                this.subPositions.push('CDM');
                if (stats.speed >= 60) this.subPositions.push('SB');
            } else if (role === 'Stopper' || role === 'Covering') {
                if (stats.speed >= 65) this.subPositions.push('SB');
            }
        } else if (position === 'SB') {
            if (role === 'Defensive') {
                this.subPositions.push('CB');
                if (stats.defense >= 65) this.subPositions.push('CDM');
            } else if (role === 'Attacking' || role === 'Wing-Back') {
                this.subPositions.push('WG');
                if (stats.stamina >= 70) this.subPositions.push('CM');
            } else if (role === 'Inverted') {
                this.subPositions.push('CDM', 'CM');
            }
        } else if (position === 'CDM') {
            if (role === 'Anchor') {
                this.subPositions.push('CB', 'CM');
            } else if (role === 'Destroyer') {
                this.subPositions.push('CM');
                if (stats.speed >= 65) this.subPositions.push('SB');
            } else if (role === 'Deep-Lying') {
                this.subPositions.push('CM');
                if (stats.pass >= 70) this.subPositions.push('CAM');
            }
        } else if (position === 'CM') {
            if (role === 'Box-to-Box') {
                this.subPositions.push('CDM', 'CAM');
            } else if (role === 'Advanced-Playmaker') {
                this.subPositions.push('CAM', 'WG');
            } else if (role === 'Ball-Winning') {
                this.subPositions.push('CDM');
            }
        } else if (position === 'CAM') {
            if (role === 'Shadow-Striker') {
                this.subPositions.push('CF', 'WG');
            } else if (role === 'Enganche') {
                this.subPositions.push('CM', 'CF');
            } else if (role === 'Dynamo') {
                this.subPositions.push('CM', 'WG');
            }
        } else if (position === 'WG') {
            if (role === 'Classic-Winger' || role === 'Crosser') {
                this.subPositions.push('SB');
                if (stats.shoot >= 65) this.subPositions.push('CF');
            } else if (role === 'Inside-Forward') {
                this.subPositions.push('CF', 'CAM');
            } else if (role === 'Wide-Playmaker') {
                this.subPositions.push('CAM', 'CM');
            } else if (role === 'Wide-Target-Man' || role === 'Hard-Worker') {
                this.subPositions.push('CF', 'SB');
            }
        } else if (position === 'CF') {
            if (role === 'Poacher') {
                this.subPositions.push('WG', 'CAM');
            } else if (role === 'Target-Man') {
                this.subPositions.push('WG');
                if (stats.defense >= 55) this.subPositions.push('CB');
            } else if (role === 'False-9') {
                this.subPositions.push('CAM', 'CM');
            } else if (role === 'Complete') {
                this.subPositions.push('WG', 'CAM');
            }
        }
    }
    // Generic skill parser
    static getSkillEffectFor(playerObj, effectType, target, activeConditions) {
        let totalValue = 0;
        let activeSkillNames = [];

        if (!playerObj || !playerObj.skills || !Array.isArray(playerObj.skills)) {
            return { value: totalValue, names: activeSkillNames };
        }

        const conditions = Array.isArray(activeConditions) ? activeConditions : [activeConditions];

        playerObj.skills.forEach(skillId => {
            const skillDef = window.MasterData.PlayerSkills.find(s => s.id === skillId);
            if (!skillDef) return;

            if (skillDef.effectType === effectType && skillDef.target === target) {
                if (skillDef.condition === 'always' || conditions.includes(skillDef.condition)) {
                    totalValue += skillDef.value;
                    activeSkillNames.push(skillDef.name);
                }
            }
        });

        return { value: totalValue, names: activeSkillNames };
    }

    static randomStat(bonus = 0) {
        return Math.min(100, Math.max(10, Math.floor(Math.random() * 60) + 20 + bonus));
    }
}

window.Player = Player;