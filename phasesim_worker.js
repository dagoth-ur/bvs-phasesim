(function () {
    // Those bits are sadly duplicated from the main script.
    function maxPush(season) {
        return Math.min(Math.max(0, season-1) * 0.5, 4);
    }

    function toHit(str, rng, diff) {
        return 1 - (Math.max(0, diff - 1 - str) / rng);
    }

    function addStats(stats, extra) {
        var ret = Object.assign({}, stats);
        for (let stat of Object.keys(extra))
            ret[stat] += extra[stat];
        return ret;
    }

    const teams = {'detective duo' : { edge : 5, dmg : 250 }
                  ,'offline romance' : { drain : 4, lives : 1 }};
    // End duplicated part
    
    function dbg(...msg) {
        // console.log(...msg);
    }

    function avgAttackDmg(stats, phase) {
        var tohit = toHit(stats.drainStr, stats.drainRng, phase.diff); 
        var rolls = stats.drain / (1 - stats.edge / 100);
        return rolls * tohit;
    }

    // Doesn't exactly simulate graze, edge and individual
    // rolls but calculates avg. dmg from formula.
    // Returns { victory (bool), livesBough (num), focusesBought (num) }
    function ripAndTear(stats, phase, strategy) { 
        var teamStats = addStats(stats, teams['detective duo']);
        var baseDmg = avgAttackDmg(teamStats, phase);
        var push = maxPush(stats.season) * strategy.ddMaxPush;
        var avgDmg = baseDmg * (1 + teamStats.dmg / 100 + push);
        var deathChance = 
            (1 + strategy.daysAlive + push 
             - stats.maxpushDCReduce * strategy.ddMaxPush) / 100;
        const dodgeChance = 
            1 - stats.graze.reduce((acc, p) => acc * (1 - p / 100), 1);
        var usedOffRomance = !strategy.useOr;
        var lives = stats.lives;
        var buyableLives = stats.buyableLives;
        var livesBought = 0;
        var focusesBought = 0;
        var atksLeft = 0;
        var hp = phase.hp;
        const atksPerFocus = stats.pinktaser ? 12 : 10;
        const freeAtkChance = stats.magnifier ? 0.13 : 0;
        const livesPerDeath = 1 + phase.bigdeath;
        //dbg('Free attack chance: ' + freeAtkChance);
        //dbg(`Death chance: ${deathChance}`);
        //dbg(`Push: ${push}`);
        //dbg(`Avg dmg: ${avgDmg}`);
        while (hp > 0) {
            //dbg('Hp left: ' + hp);
            //dbg('Lives left: ' + lives);
            //dbg('Atks left: ' + atksLeft);
            if (lives <= 0) {
                //dbg('Ded');
                return { victory : false, livesBought, focusesBought };
            }
            if (lives < 1 + livesPerDeath && buyableLives !== 0) {
                // Check to make sure that buying lives would be useful
                let needed = 1 + livesPerDeath - lives;
                if (needed <= buyableLives + !usedOffRomance) {
                    let bought = Math.min(needed, buyableLives);
                    //dbg(`Buying ${bought} lives`);
                    lives += bought;
                    livesBought += bought;
                    buyableLives -= bought;
                }
            }
            if (!usedOffRomance && lives === livesPerDeath) {
                //dbg('Switching to Offline Romance');
                usedOffRomance = true;
                lives += 1;
                teamStats = addStats(stats, teams['offline romance']);
                baseDmg = avgAttackDmg(teamStats, phase);
                push = maxPush(stats.season) * strategy.orMaxPush;
                avgDmg = baseDmg * (1 + teamStats.dmg / 100 + push);
                deathChance = 
                    (1 + strategy.daysAlive + push 
                     - stats.maxpushDCReduce * strategy.orMaxPush) / 100;
                //dbg(`Death chance: ${deathChance}`);
                //dbg(`Push: ${push}`);
                //dbg(`Avg dmg: ${avgDmg}`);
            }
            if (atksLeft === 0) {
                //dbg('Focusing');
                focusesBought += 1;
                atksLeft += atksPerFocus;
            }
            // Swing
            if (Math.random() > freeAtkChance) {
                //dbg('  Swing');
                atksLeft -= 1;
            } else {
                //dbg('  Swing (free attack)');
            }
            if (Math.random() <= deathChance) {
                if (Math.random() > dodgeChance) {
                    //dbg('  Destroyed');
                    lives -= livesPerDeath;
                } else {
                    //dbg('  Dodged destruction');
                }
                continue;
            }
            //dbg(`  Did ${avgDmg} damage`);
            hp -= avgDmg;
        }
        //dbg('Glory');
        return { victory : true, livesBought, focusesBought };
    }

    function runSims(stats, phase, strat, numSamples) {
        var losses = 0;
        var lifeBuys = []; // counted only for victories
        var focusBuys = []; // ditto
        var simResult;
        for (let i = 0; i < numSamples; ++i) {
            simResult = ripAndTear(stats, phase, strat);
            if (!simResult.victory) {
                losses += 1;
            } else {
                lifeBuys[simResult.livesBought] = 
                    (lifeBuys[simResult.livesBought] || 0) + 1;
                focusBuys[simResult.focusesBought] =
                    (focusBuys[simResult.focusesBought] || 0) + 1;
            }
        }
        return { losses, lifeBuys, focusBuys };
    }

    function onMessage(evt) {
        var {stats, phase, strat, numSamples} = evt.data;
        var result = runSims(stats, phase, strat, numSamples);
        result.sequenceNum = evt.data.sequenceNum;
        result.numSamples = numSamples;
        self.postMessage(result);
    }

    self.onmessage = onMessage;
})();
