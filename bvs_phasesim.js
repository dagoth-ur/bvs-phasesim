(function () { "use strict";
    //
    // Dealing with the stats input form
    //
    const bonuses = {'r00t'        : {drainStr : 2}
                    ,'epitaph'     : {drainStr : 2}
                    ,'skullthrone' : {drainStr : 1}
                    ,'lycoris'     : {drain : 5}
                    ,'boomstick'   : {drain : 2}
                    ,'flaskmist'   : {drain : 1}
                    ,'_555phone'   : {drain : 1}
                    ,'r00t-drain'  : {drain : 5}
                    ,'amplifier'   : {drain : 2}
                    ,'overclock'   : {drain : 5}
                    ,'aromagrass'  : {edge : 5}
                    ,'wiredrefl'   : {edge : 10}
                    ,'r00t-edge'   : {edge : 10}
                    ,'legacy'      : {lives : 1}
                    ,'guardian'    : {lives : 1}
                    ,'lifefavor'   : {buyableLives : 1}
                    ,'zawazawa'    : {buyableLives : 1}
                    ,'wotan'       : {maxpushDCReduce : 1}
                    ,'bulltime'    : {maxpushDCReduce : 1}
                    ,'timecube'    : {graze : [11]}
                    ,'k-belt'      : {graze : [10]}
                    ,'maxfox'      : {graze : [11]}
                    ,'triedge'     : {dmg : 50}
                    ,'endurance'   : true
                    ,'pinktaser'   : true
                    ,'pinkskull'   : true
                    ,'magnifier'   : true };

    const numFields = {'hacks'      : 'drainStr'
                      ,'season'     : 'drain, drainRng, season'
                      ,'tonicbonus' : 'drain'};

    function $(selector, context=document) {
        return context.querySelector(selector);
    }

    function readStatsInput() {
        var base = { drain : 0, drainStr : 0, drainRng : 10, edge : 0
                   , lives : 1, buyableLives : 0, maxpushDCReduce : 0
                   , graze : [], dmg : 0, season : 0};
        for (let bonus of Object.keys(bonuses)) {
            //console.log('Bonus: ' + bonus);
            if (!$(`#${bonus}`).checked)
                continue;
            if (typeof bonuses[bonus] == 'boolean') {
                //console.log('Setting flag ' + bonus);
                base.bonus = true;
                continue;
            }
            for (let stat of Object.keys(bonuses[bonus])) {
                if (typeof bonuses[bonus][stat] == 'number') {
                    //console.log('Numerical bonus to ' + stat);
                    base[stat] += bonuses[bonus][stat];
                } else if (bonuses[bonus][stat] instanceof Array) {
                    //console.log('Arrayical (?) bonus to ' + stat);
                    base[stat].push(...bonuses[bonus][stat]);
                }
            }
        }
        for (let field of Object.keys(numFields)) {
            //console.log('Num field: ' + field);
            let val = parseInt(
                $(`#${field}`).value || "0");
            for (let stat of numFields[field].split(','))
                base[stat.trim()] += val;
        }
        return base;
    }

    function maxPush(season) {
        return Math.min(Math.max(0, season-1) * 0.5, 4);
    }

    // Before dmg% bonus
    function avgDmg(stats) {
        return stats.drain / (1 - stats.edge / 100);
    }

    function addStats(stats, extra) {
        var ret = Object.assign({}, stats);
        for (let stat of Object.keys(extra))
            ret[stat] += extra[stat];
        return ret;
    }

    const teams = {'detective duo' : { edge : 5, dmg : 250 }
                  ,'offline romance' : { drain : 4, lives : 1 }};

    function updateStatsDisplay(stats) {
        $('#dlvl').innerText = stats.drain;
        $('#dstr').innerText = stats.drainStr;
        $('#drng').innerText = stats.drainRng;
        $('#dedg').innerText = stats.edge + '%';
        $('#dmgplus').innerText = stats.dmg + '%';
        $('#lives').innerText = stats.lives;
        $('#buylives').innerText = stats.buyableLives;
        $('#graze').innerText = 
            '(' + stats.graze.map((n) => n + '').join(' + ') + ')%';
        $('#dcplus').innerText = 
            Math.max(0, maxPush(stats.season) - stats.maxpushDCReduce) + '%';
        var dd_stats = addStats(stats, teams['detective duo']);
        $('#mindmg-dd').innerText = 
            (avgDmg(dd_stats) * (1 + dd_stats.dmg / 100)).toFixed(1);
        $('#maxdmg-dd').innerText = (avgDmg(dd_stats) 
            * (1 + dd_stats.dmg / 100 + maxPush(stats.season))).toFixed(1);
        var or_stats = addStats(stats, teams['offline romance']);
        $('#mindmg-or').innerText = 
            (avgDmg(or_stats) * (1 + or_stats.dmg / 100)).toFixed(1);
        $('#maxdmg-or').innerText = (avgDmg(or_stats) 
            * (1 + or_stats.dmg / 100 + maxPush(stats.season))).toFixed(1);
    }

    //
    // Helpbox handler
    //
    function toggleClass(elem, cls) {
        var classes = elem.className.split(' ');
        var idx = classes.indexOf(cls);
        if (idx === -1) {
            elem.className += ' ' + cls;
        } else {
            classes.splice(idx, 1);
            elem.className = classes.join(' ');
        }
    }

    function onHelpheadClick() { 
        toggleClass($('#helpbox'), 'active');
        toggleClass($('#helphead'), 'active');
    }

    //
    // Phase form handling
    //

    // Replace space-surrounded dashes with en-dashes
    function end(str) {
        return str.replace(' - ', ' \u2013 ');
    }

    function genPhases(phase_specs) {
        let phaselist = [];
        let phases = {};
        for (let [id, name, hp, diff, drainhp, draindiff] of phase_specs) {
            let bigdeath = (id === 'eleventails');
            if (id !== 'eleventails' && id !== 'elevenrevenge') {
                phases[id] = { name, hp, diff, bigdeath };
                phaselist.push(id);
            }
            phases[id + '-drain'] = {name : name + ' (drain)', hp : drainhp
                                    ,diff : draindiff, bigdeath};
            phaselist.push(id + '-drain');
        }
        return [phaselist, phases];
    }

    const [phaselist, phases] = genPhases([
        ['onesin', end('The One Sin - Corrupter of Truth'), 5000, 10, 5000, 10]
       ,['philosopher', end('Philosopher - The Prophet'), 6000, 8, 9000, 13]
       ,['bobo', end('Bobo - The Machinator'), 6000, 8, 9000, 13]
       ,['stench', end('Stench - The Propagation'), 6000, 8, 9000, 13]
       ,['shoujo', end('Shoujo - The Temptress of Drama'), 6000, 7, 9000, 12]
       ,['toroko', end('Toroko - The Avenger'), 10000, 7, 15000, 12]
       ,['jetset', end('Jet Set - The Terror of Death'), 10000, 6, 15000, 11]
       ,['ninetails', end('Nine Tails - The Rebirth'), 14000, 7, 21000, 12]
       ,['tanuki', end('Tanuki - The Mirage of Deceit'), 14000, 7, 21000, 12]
       ,['eleventails', end('The Eleven-Tailed Fox - The Demon Within'),
            0, 0, 11000, 11]
       ,['elevenrevenge', end('The 11-Tailed Revenge - The Demon Returns'),
            0, 0, 20000, 14]]);

    function phaseFormInit() {
        var select = $('#phase-select');
        for (let phaseid of phaselist) {
            let el = document.createElement('option');
            el.value = phaseid;
            el.appendChild(document.createTextNode(phases[phaseid].name));
            select.appendChild(el);
        }
    }

    function setup() {
        $('#statsform').addEventListener('input', 
            (evt) => updateStatsDisplay(readStatsInput()));
        $('#helphead').addEventListener('click', onHelpheadClick);
        updateStatsDisplay(readStatsInput());
        phaseFormInit();
    }

    document.addEventListener('DOMContentLoaded', setup);
})();
