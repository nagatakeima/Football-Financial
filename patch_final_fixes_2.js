const fs = require('fs');

let mainJs = fs.readFileSync('js/main.js', 'utf8');

// The original re-replace I ran in patch_final_real.js overwrote the variable scope fix!
mainJs = mainJs.replace(
    /if \(\(p\.aiTickTimer >= p\.mentalTickRate && p\.targetMaintainTimer <= 0\) \|\| hasBall\) \{\s*p\.aiTickTimer = 0;\s*if \(!hasBall\) p\.targetMaintainTimer = Phaser\.Math\.Between\(15, 20\); \/\/ Hold decision for 15-20 frames\s*const context = \{ tactic, isAttacking, hasBall \};\s*const evaluation = this\.evaluateActions\(p, context\);\s*let bestAction = evaluation\.action;\s*p\.currentAction = bestAction;\s*p\.lastEvaluation = \{ bestPassTarget: context\.bestPassTarget, targetLineX: evaluation\.targetLineX \};\s*let targetX = p\.x; let targetY = p\.y;/g,
    `let targetX = p.x; let targetY = p.y;
            if ((p.aiTickTimer >= p.mentalTickRate && p.targetMaintainTimer <= 0) || hasBall) {
                p.aiTickTimer = 0;
                if (!hasBall) p.targetMaintainTimer = Phaser.Math.Between(15, 20); // Hold decision for 15-20 frames

                const context = { tactic, isAttacking, hasBall };
                const evaluation = this.evaluateActions(p, context);
                let bestAction = evaluation.action;
                p.currentAction = bestAction;
                p.lastEvaluation = { bestPassTarget: context.bestPassTarget, targetLineX: evaluation.targetLineX };`
);

// Point 4: Attacking Kickoff offX (resetPositions)
mainJs = mainJs.replace(
    /else \{ p\.x = isPlayerKickoff \? 360 : 340; \}/g,
    `else { p.x = isPlayerKickoff ? 360 + offX : 340 + offX; }`
);
mainJs = mainJs.replace(
    /else \{ p\.x = !isPlayerKickoff \? 440 : 460; \}/g,
    `else { p.x = !isPlayerKickoff ? 440 - offX : 460 - offX; }`
);

fs.writeFileSync('js/main.js', mainJs);
