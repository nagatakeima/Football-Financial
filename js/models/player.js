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
        const numSkills = Math.floor(Math.random() * 2) + 1;
        const skills = [];
        for (let i = 0; i < numSkills; i++) {
            const randomSkillId = window.MasterData.PlayerSkills[Math.floor(Math.random() * window.MasterData.PlayerSkills.length)].id;
            if (!skills.includes(randomSkillId)) {
                skills.push(randomSkillId);
            }
        }

        let role = null;
        if (window.MasterData.Roles && window.MasterData.Roles[position]) {
            const rolesForPos = window.MasterData.Roles[position];
            role = rolesForPos[Math.floor(Math.random() * rolesForPos.length)];
        }

        return new Player(id, name, position, stats, preference, skills, role);
    }

    static randomStat(bonus = 0) {
        return Math.min(100, Math.max(10, Math.floor(Math.random() * 60) + 20 + bonus));
    }
}

window.Player = Player;