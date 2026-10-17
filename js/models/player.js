class Player {
    constructor(id, name, position, stats, preference, skills = [], role = null) {
        this.id = id;
        this.name = name;
        this.position = position; // e.g., 'GK', 'CB', 'CF'
        this.role = role; // e.g., 'Classic', 'Inverted', 'Poacher'

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
    }

    // Helper to generate a random player
    static generateRandom(id, position = null) {
        const names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Silva", "Costa", "Santos", "Oliveira", "Müller", "Schmidt", "Schneider", "Fischer", "Weber"];
        const name = names[Math.floor(Math.random() * names.length)] + " " + id;

        if (!position) {
            position = window.MasterData.Positions[Math.floor(Math.random() * window.MasterData.Positions.length)];
        }

        const prefs = Object.values(window.TacticalPreferences);
        const preference = prefs[Math.floor(Math.random() * prefs.length)];

        // Random stats slightly weighted by position
        const stats = {
            pass: Player.randomStat(position === 'CM' || position === 'CAM' ? 20 : 0),
            shoot: Player.randomStat(position === 'CF' || position === 'WG' ? 20 : 0),
            defense: Player.randomStat(position === 'CB' || position === 'CDM' ? 20 : 0),
            physical: Player.randomStat(position === 'CB' || position === 'CF' ? 20 : 0),
            speed: Player.randomStat(position === 'WG' || position === 'SB' ? 20 : 0),
            mental: Player.randomStat(),
            stamina: Player.randomStat(10)
        };

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

            if (skillDef.effectType === effectType && (skillDef.target === target || skillDef.target === 'all')) {
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