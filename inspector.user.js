// ==UserScript==
// @name         HW Lite Inspector v0.1
// @name:ru      HW Инспектор статов v0.1
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Hero Wars stats inspector (English, Russian)
// @description:ru Хроники Хаоса Инспектор статов (Английский, Русский)
// @author       Messmer
// @match        *://*.hero-wars-alliance.com/*
// @match        *://hero-wars-alliance.com/*
// @match        *://*.nextersglobal.com/*
// @grant        none
// @license      GPL-3.0-or-later
// ==/UserScript==
 
(function() {
    const HERO_MAP = {
        // Heroes
        1: "Aurora", 2: "Galahad", 3: "Keira", 4: "Astaroth", 5: "Kai",
        6: "Phobos", 7: "Thea", 8: "Daredevil", 9: "Heidi", 10: "Faceless",
        11: "Chabba", 12: "Arachne", 13: "Orion", 14: "Fox", 15: "Ginger",
        16: "Dante", 17: "Mojo", 18: "Judge", 19: "Dark Star", 20: "Artemis",
        21: "Markus", 22: "Peppy", 23: "Lian", 24: "Cleaver", 25: "Ishmael",
        26: "Lilith", 27: "Luther", 28: "Qing Mao", 29: "Dorian", 30: "Cornelius",
        31: "Jet", 32: "Helios", 33: "Lars", 34: "Krista", 35: "Jorgen",
        36: "Maya", 37: "Jhu", 38: "Elmir", 39: "Ziri", 40: "Nebula",
        41: "K'arkh", 42: "Rufus", 43: "Celeste", 44: "Astrid", 45: "Satori",
        46: "Martha", 47: "Andvari", 49: "Yasmine", 50: "Isaac", 51: "Xe'Sha/Morrigan",
        52: "Amira", 53: "Fafnir", 54: "Iris", 55: "Mushy", 56: "Julius",
        57: "Kayla", 58: "Aidan", 59: "Cascade", 60: "Octavia", 61: "Oya",
        62: "Soleil/Lara", 63: "Lara Croft", 64: "Folio", 65: "Tempus",
        66: "Turtles", 67: "Polaris", 68: "Peech", 69: "Guus", 70: "Somna",
        71: "Electra", 72: "Byrna", 73: "Drayne", 74: "Miu", 75: "Kendle", 79: "Leonel",
        500: "Sebastian", 501: "Corvus", 502: "Morrigan", 503: "Alvanor", 504: "Tristan",
 
        // Titans Water
        4000: "Sigurd", 4001: "Nova", 4002: "Mairi", 4003: "Hyperion",
        // Titans Fire
        4010: "Moloch", 4011: "Vulcan", 4012: "Ignis", 4013: "Araji",
        // Titans Earth
        4020: "Angus", 4021: "Sylva", 4022: "Avalon", 4023: "Eden",
        // Titans Light/Dark
        4030: "Brustar", 4031: "Keros", 4032: "Mort", 4033: "Tenebris",
        4040: "Rigel", 4041: "Amon", 4042: "Iyari", 4043: "Solaris"
    };
 
    // Загружаем язык или определяем по браузеру
    let LANG = localStorage.getItem('hw_inspector_lang') || 
               ((navigator.language && navigator.language.startsWith('ru')) ? 'ru' : 'en');
 
    const i18n = {
        en: { title: "⚔️ INSPECTOR", wait: "Waiting for battle...", copy: "📋 Copy", copied: "✅ Copied", power: "pwr", runes: "Glyphs", art: "Arts", tal: "Talisman", calc: "Calculator (+/-):", dmgVs: "Dmg vs Enemy:" },
        ru: { title: "⚔️ ИНСПЕКТОР", wait: "Ожидание боя...", copy: "📋 Копировать", copied: "✅ Скопировано", power: "мощь", runes: "Символы", art: "Арты", tal: "Талисман", calc: "Калькулятор (+/-):", dmgVs: "Урон по врагу:" }
    };
    const t = (k) => i18n[LANG][k] || k;
 
    const style = (el, css) => { for (let k in css) el.style[k] = css[k]; };
    const getHeroName = (id) => HERO_MAP[id] || `ID[${id}]`;
    const isHero = (obj) => obj && typeof obj === 'object' && typeof obj.id === 'number' && (typeof obj.power === 'number' || typeof obj.level === 'number');
 
    // UI Panel Setup (Стильный кибер-дизайн)
    let panel = document.getElementById('hw-lite-inspector');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'hw-lite-inspector';
        style(panel, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            width: '320px',
            backgroundColor: 'rgba(15, 15, 18, 0.96)',
            color: '#0f0',
            border: '1px solid #0f0',
            borderRadius: '6px',
            padding: '12px',
            zIndex: 999999,
            fontFamily: 'Consolas, monospace',
            fontSize: '11px',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 0 15px rgba(0, 255, 0, 0.25)',
            scrollbarWidth: 'thin',
            scrollbarColor: '#0f0 #000'
        });
        document.body.appendChild(panel);
    }
 
    panel.innerHTML = '';
    const header = document.createElement('div');
    style(header, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(0,255,0,0.3)',
        paddingBottom: '6px',
        marginBottom: '10px',
        cursor: 'move',
        fontWeight: 'bold',
        userSelect: 'none'
    });
 
    const content = document.createElement('div');
    content.innerText = t('wait');
    style(content, { color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' });
 
    let isCollapsed = false;
 
    // Отрисовка интерактивной шапки с переключателем языка
    const drawHeader = () => {
        header.innerHTML = '';
        const titleSpan = document.createElement('span');
        titleSpan.innerText = t('title');
        style(titleSpan, { color: '#0f0', textShadow: '0 0 4px rgba(0, 255, 0, 0.5)' });
        header.appendChild(titleSpan);
 
        const controls = document.createElement('div');
        style(controls, { display: 'flex', alignItems: 'center' });
 
        // Кнопка переключения языка [RU / EN]
        const langBtn = document.createElement('span');
        langBtn.innerText = `[${LANG.toUpperCase()}]`;
        style(langBtn, { cursor: 'pointer', color: '#00ffff', marginRight: '12px', fontWeight: 'bold', fontSize: '10px' });
        langBtn.onclick = () => {
            LANG = LANG === 'en' ? 'ru' : 'en';
            localStorage.setItem('hw_inspector_lang', LANG);
            drawHeader();
            if (content.innerText === i18n.en.wait || content.innerText === i18n.ru.wait) {
                content.innerText = t('wait');
            }
        };
 
        // Кнопка сворачивания панели
        const toggleBtn = document.createElement('span');
        toggleBtn.innerText = isCollapsed ? '[+]' : '[-]';
        style(toggleBtn, { cursor: 'pointer', color: '#ffb000', fontWeight: 'bold', fontSize: '12px' });
        toggleBtn.onclick = () => {
            isCollapsed = !isCollapsed;
            content.style.display = isCollapsed ? 'none' : 'block';
            toggleBtn.innerText = isCollapsed ? '[+]' : '[-]';
        };
 
        controls.appendChild(langBtn);
        controls.appendChild(toggleBtn);
        header.appendChild(controls);
    };
 
    drawHeader();
    panel.appendChild(header);
    panel.appendChild(content);
 
    // Логика перемещения (Drag and Drop) панели
    let isDrag = false, ox = 0, oy = 0;
    header.onmousedown = (e) => { 
        if(e.target.tagName === 'SPAN') return; 
        isDrag = true; 
        ox = e.clientX - panel.offsetLeft; 
        oy = e.clientY - panel.offsetTop; 
    };
    document.onmousemove = (e) => { 
        if (isDrag) { 
            panel.style.left = (e.clientX - ox) + 'px'; 
            panel.style.top = (e.clientY - oy) + 'px'; 
            panel.style.right = 'auto'; 
        } 
    };
    document.onmouseup = () => isDrag = false;
 
    const getBattle = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        if (obj.attackers && obj.defenders) return obj;
        for (let k in obj) { if (k === 'journal' || k === 'replays') continue; let res = getBattle(obj[k]); if (res) return res; }
        return null;
    };
 
    const parseTeam = (data) => {
        if (!data) return [];
        if (data.units) data = data.units; else if (data.heroes) data = data.heroes;
        let waves = [];
        const extract = (m) => {
            let h = Object.values(m).filter(isHero);
            return Object.keys(m).sort((a,b)=>a-b).map(k=>m[k]).filter(isHero).length ? Object.keys(m).sort((a,b)=>a-b).map(k=>m[k]).filter(isHero) : h;
        };
        if (Array.isArray(data)) {
            let f = data.filter(isHero);
            if (f.length) return [f];
            data.forEach(i => { if(i) { if (Array.isArray(i)) { let p = i.filter(isHero); if(p.length) waves.push(p); } else if (typeof i === 'object') { let p = extract(i); if(p.length) waves.push(p); } } });
        } else if (typeof data === 'object') {
            if (data.id) waves.push([data]); else { let p = extract(data); if(p.length) waves.push(p); }
        }
        return waves;
    };
 
    const getRefStat = (team) => {
        if (!team || !team.length) return 10000;
        return Math.max(...team.map(h => Math.max(h.strength||0, h.agility||0, h.intelligence||0))) || 10000;
    };
 
    const getHeroStats = (h, refStat, bArmor=0, bMR=0, bAP=0, bMP=0) => {
        let isT = h.id >= 4000 && h.id <= 4099;
        if (isT) {
            return {
                isTitan: true,
                hp: h.hp || 0,
                pa: h.physicalAttack || 0,
                ar: Math.max(0, (h.armor || 0) + bArmor),
                mr: Math.max(0, (h.magicResist || 0) + bMR),
                ap: bAP, mpen: bMP, str: 0, agi: 0, int: 0, mp: 0
            };
        }
        let str = h.strength||0, agi = h.agility||0, int = h.intelligence||0;
        let hp = h.hp||0, ar = Math.max(0, (h.armor||0) + bArmor), mr = Math.max(0, (h.magicResist||0) + bMR), mp = h.magicPower||0;
        let pa = h.physicalAttack||0;
        let ap = Math.max(0, (h.crush||h.armorPenetration||0) + bAP), mpen = Math.max(0, (h.magicPenetration||0) + bMP);
        return { isTitan: false, str, agi, int, hp, ar, mr, pa, mp, ap, mpen };
    };
 
    const copyStats = (team, label, oppTeam=[]) => {
        let waves = parseTeam(team);
        if (!waves.length) return;
        let ref = getRefStat(oppTeam);
        let txt = [`=== ${label} ===\n`];
        waves[0].forEach(h => {
            let s = getHeroStats(h, ref);
            let ln = [`👤 ${getHeroName(h.id)} (${h.power||0} ${t('power')})`];
            if (s.isTitan) {
                ln.push(`  HP: ${Math.round(s.hp).toLocaleString()} | Phys Atk: ${Math.round(s.pa).toLocaleString()}`);
            } else {
                ln.push(`  STR: ${s.str} | AGI: ${s.agi} | INT: ${s.int}`);
                ln.push(`  HP: ${Math.round(s.hp).toLocaleString()} | PA: ${Math.round(s.pa).toLocaleString()} | MA: ${Math.round(s.mp).toLocaleString()}`);
                ln.push(`  Armor: ${Math.round(s.ar).toLocaleString()} | MR: ${Math.round(s.mr).toLocaleString()}`);
                if (s.ap>0) ln.push(`  ArPen: ${s.ap.toLocaleString()}`);
                if (s.mpen>0) ln.push(`  MgPen: ${s.mpen.toLocaleString()}`);
            }
 
            let runes = Array.isArray(h.hero_runes) ? h.hero_runes : Object.values(h.hero_runes||{});
            if (runes.length) ln.push(`  ${t('runes')}: [${runes.join(', ')}]`);
            if (h.artifacts && h.artifacts.length) ln.push(`  ${t('art')}: ` + h.artifacts.map((a,i)=>`${['🗡️','📖','💍'][i]}${a.level}(${a.star}★)`).join(' '));
            if (h.talisman) ln.push(`  ${t('tal')}: Lvl ${h.talisman.level}`);
 
            if (oppTeam.length && !s.isTitan) {
                ln.push(`  Dmg vs Enemy:`);
                oppTeam.forEach(o => {
                    let os = getHeroStats(o, ref);
                    let eAr = Math.max(0, os.ar - s.ap), eMr = Math.max(0, os.mr - s.mpen);
                    ln.push(`    - ${getHeroName(o.id).split(' ')[0]}: Phys ${(3000/(eAr+3000)*100).toFixed(1)}% | Mag ${(3000/(eMr+3000)*100).toFixed(1)}%`);
                });
            }
            txt.push(ln.join('\n') + '\n');
        });
 
        const textToCopy = txt.join('\n');
        navigator.clipboard.writeText(textToCopy).catch(err => {
            const textarea = document.createElement('textarea'); textarea.value = textToCopy; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); document.body.removeChild(textarea);
        });
    };
 
    // Отрисовщик с красивыми карточками
    const render = (data, label, col, opp=[]) => {
        let waves = parseTeam(data);
        if (!waves.length) return;
        let ref = getRefStat(opp);
 
        waves.forEach((w, i) => {
            const hC = document.createElement('div');
            style(hC, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${col}`, marginTop: '12px', paddingBottom: '3px' });
 
            const lb = document.createElement('div');
            lb.innerText = waves.length > 1 ? `${label} [WAVE ${i+1}]` : label;
            style(lb, { color: col, fontWeight: 'bold', fontSize: '12px' });
            hC.appendChild(lb);
 
            const cp = document.createElement('button');
            cp.innerText = t('copy');
            style(cp, { background: '#1a1a24', color: '#fff', border: '1px solid #445', cursor: 'pointer', fontSize: '9px', borderRadius: '4px', padding: '3px 8px', outline: 'none' });
            cp.onclick = () => { copyStats(w, lb.innerText, opp); cp.innerText = t('copied'); setTimeout(()=>cp.innerText=t('copy'), 1000); };
            hC.appendChild(cp);
            content.appendChild(hC);
 
            w.forEach(h => {
                const row = document.createElement('div');
                style(row, { 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '5px 8px', 
                    margin: '3px 0', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderBottom: '1px solid #222', 
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'background 0.2s ease, border-left 0.2s ease'
                });
                row.innerHTML = `<span><b>${getHeroName(h.id)}</b></span><span style="color:#aaa">${h.power||0} ${t('power')}</span>`;
                
                row.onmouseover = () => { style(row, { background: 'rgba(0, 255, 0, 0.08)', borderLeft: '3px solid #0f0' }); };
                row.onmouseout = () => { style(row, { background: 'rgba(255,255,255,0.03)', borderLeft: 'none' }); };
                
                content.appendChild(row);
 
                let det = null;
                row.onclick = () => {
                    if (det) { det.remove(); det = null; return; }
                    det = document.createElement('div');
                    style(det, { 
                        padding: '10px', 
                        background: '#0a0a0d', 
                        fontSize: '11px', 
                        color: '#ccc',
                        border: '1px solid #223',
                        borderTop: 'none',
                        borderRadius: '0 0 4px 4px',
                        marginBottom: '4px'
                    });
 
                    let sC = document.createElement('div');
                    let sbC = document.createElement('div');
                    det.appendChild(sC); det.appendChild(sbC);
 
                    let ba=0, bmr=0, bap=0, bmp=0, ca=0, cmr=0;
                    const upd = () => {
                        let s = getHeroStats(h, ref, ba, bmr, bap, bmp);
                        let p = (v) => v ? ((v/(v+ref))*100).toFixed(1)+'%' : '0%';
 
                        let html = '';
                        if (s.isTitan) {
                            html += `HP: <span style="color:#fff">${Math.round(s.hp).toLocaleString()}</span><br>
                            Phys Atk: <span style="color:#fff">${Math.round(s.pa).toLocaleString()}</span><br>`;
                            if (s.ar > 0) html += `Armor: <span style="color:#fff">${Math.round(s.ar).toLocaleString()}</span><br>`;
                            if (s.mr > 0) html += `MR: <span style="color:#fff">${Math.round(s.mr).toLocaleString()}</span><br>`;
                        } else {
                            html += `STR: <span style="color:#f55">${s.str}</span> | AGI: <span style="color:#5f5">${s.agi}</span> | INT: <span style="color:#55f">${s.int}</span><br>
                            HP: <span style="color:#fff">${Math.round(s.hp).toLocaleString()}</span><br>
                            PA: <span style="color:#fff">${Math.round(s.pa).toLocaleString()}</span> | MA: <span style="color:#fff">${Math.round(s.mp).toLocaleString()}</span><br>
                            Armor: <span style="color:#fff">${Math.round(s.ar).toLocaleString()}</span> | MR: <span style="color:#fff">${Math.round(s.mr).toLocaleString()}</span><br>`;
                            if (s.ap>0) html += `ArPen: <span style="color:#ffb000">${s.ap.toLocaleString()}</span><br>`;
                            if (s.mpen>0) html += `MgPen: <span style="color:#ffb000">${s.mpen.toLocaleString()}</span><br>`;
 
                            let crit = h.physicalCritChance || h.magicCritChance;
                            if (crit) html += `Crit: <span style="color:#f55">${crit}</span> (+${p(crit)})<br>`;
                            if (h.dodge) html += `Dodge: <span style="color:#55f">${h.dodge}</span> (+${p(h.dodge)})<br>`;
                        }
 
                        let runes = Array.isArray(h.hero_runes) ? h.hero_runes : Object.values(h.hero_runes||{});
                        if (runes.length) html += `Glyphs: <span style="color:#aaa">[${runes.join(', ')}]</span><br>`;
                        if (h.artifacts && h.artifacts.length) {
                            html += `Arts: <span style="color:#8af">${h.artifacts.map((a,i)=>`${['🗡️','📖','💍'][i]}${a.level}(${a.star}★)`).join(' ')}</span><br>`;
                        }
                        if (h.talisman) html += `Talisman: <span style="color:#d8f">Lvl ${h.talisman.level}</span><br>`;
 
                        if (opp.length && !s.isTitan) {
                            html += `<hr style="border-top:1px solid #223;margin:6px 0"><span style="color:#0f0"><b>${t('dmgVs')}</b></span><br>`;
                            opp.forEach(o => {
                                let os = getHeroStats(o, ref);
                                let eAr = Math.max(0, os.ar - ca - s.ap), eMr = Math.max(0, os.mr - cmr - s.mpen);
                                html += `- ${getHeroName(o.id).split(' ')[0]}: Phys <span style="color:#ffb000">${(3000/(eAr+3000)*100).toFixed(1)}%</span> | Mag <span style="color:#ffb000">${(3000/(eMr+3000)*100).toFixed(1)}%</span><br>`;
                            });
                        }
                        sC.innerHTML = html;
                    };
 
                    const mkInp = (lbl, cb) => {
                        const r = document.createElement('div'); 
                        style(r, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' });
                        r.innerHTML = `<span style="color:#aaa">${lbl}</span>`;
                        
                        const i = document.createElement('input'); 
                        i.type = 'number'; 
                        i.value = 0;
                        style(i, { 
                            width: '65px', 
                            background: '#000', 
                            color: '#0f0', 
                            border: '1px solid #445', 
                            textAlign: 'center',
                            borderRadius: '3px',
                            padding: '2px',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            outline: 'none'
                        });
                        
                        i.oninput = (e) => cb(Number(e.target.value)||0);
 
                        // КРИТИЧЕСКИЙ ФИКС БАГА КЛАВИАТУРЫ: предотвращаем перехват ввода игровым окном Canvas
                        const stopEvents = (e) => e.stopPropagation();
                        i.addEventListener('keydown', stopEvents);
                        i.addEventListener('keyup', stopEvents);
                        i.addEventListener('keypress', stopEvents);
 
                        r.appendChild(i); 
                        return r;
                    };
 
                    sbC.innerHTML = `<hr style="border-top:1px solid #223;margin:6px 0"><span style="color:#0f0"><b>${t('calc')}</b></span><br>`;
                    sbC.appendChild(mkInp('Self Armor', v=>{ba=v;upd()}));
                    sbC.appendChild(mkInp('Self MR', v=>{bmr=v;upd()}));
                    sbC.appendChild(mkInp('Self ArPen', v=>{bap=v;upd()}));
                    sbC.appendChild(mkInp('Self MgPen', v=>{bmp=v;upd()}));
                    sbC.appendChild(mkInp('Enemy Armor Cut', v=>{ca=v;upd()}));
                    sbC.appendChild(mkInp('Enemy MR Cut', v=>{cmr=v;upd()}));
 
                    upd();
                    row.parentNode.insertBefore(det, row.nextSibling);
                };
            });
        });
    }
 
    function handleResp(data) {
        for (let item of data.results || []) {
            let resp = item.result?.response;
            if (!resp || typeof resp !== 'object') continue;
 
            if (resp.draft || resp.draftEnemy) continue;
 
            if (resp.challenges && Array.isArray(resp.challenges)) {
                content.innerHTML = '';
                resp.challenges.forEach(c => {
                    if (c.data && c.data.defenders) {
                        let type = c.data.type === 'titan' ? 'TITANS' : 'HEROES';
                        let power = c.data.defenders.power ? `(${c.data.defenders.power.toLocaleString()} pwr)` : '';
                        render(c.data.defenders, `TRAINING: [${type}] ${power}`, '#ffb000');
                    }
                });
                return;
            }
 
            if (resp.enemies && Array.isArray(resp.enemies)) {
                content.innerHTML = '';
                resp.enemies.forEach(e => {
                    render(e.heroes, `ENEMY: ${e.user?.name||'Player'}`, '#f55');
                });
                return;
            }
 
            let wi = resp.warInfo || resp;
            if (wi.enemySlots || wi.ourSlots) {
                content.innerHTML = '';
                ['enemySlots', 'ourSlots'].forEach(k => {
                    if (!wi[k]) return;
                    Object.keys(wi[k]).forEach(id => {
                        let s = wi[k][id];
                        if (s && s.team) render(s.team, `${k==='enemySlots'?'ENEMY':'ALLY'} [${id}]`, k==='enemySlots'?'#f55':'#00d0ff');
                    });
                });
                return;
            }
 
            let b = getBattle(resp);
            if (b) {
                content.innerHTML = '';
                let att = parseTeam(b.attackers)[0] || [], def = parseTeam(b.defenders)[0] || [];
                render(b.defenders, 'DEFENDERS', '#f55', att);
                render(b.attackers, 'ATTACKERS', '#00d0ff', def);
                return;
            }
        }
    }
 
    const rO = XMLHttpRequest.prototype.open, rS = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(m, u, ...a) { this._url = u; return rO.apply(this, [m, u, ...a]); };
    XMLHttpRequest.prototype.send = function(b, ...a) {
        if (this._url && (this._url.includes('rpc') || this._url.includes('api') || this._url.includes('hero-wars'))) {
            this.addEventListener('readystatechange', function() {
                if (this.readyState === 4) { try { let d = JSON.parse(this.responseText); if(d) handleResp(d); } catch(e){} }
            });
        }
        return rS.apply(this, [b, ...a]);
    };
 
    const oF = window.fetch;
    window.fetch = async function(...args) {
        const r = await oF.apply(this, args);
        try { const c = r.clone(); const d = await c.json(); if(d) handleResp(d); } catch(e){}
        return r;
    };
 
    // Функция отправки статистики (Amplitude API)
    function logUserActive() {
        let visitorId = localStorage.getItem('hw_inspector_uuid');
        if (!visitorId) {
            visitorId = 'usr_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('hw_inspector_uuid', visitorId);
        }
        
        fetch('https://api2.amplitude.com/2/httpapi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: '47a7d929cbb0488ad72e25908bc6c4d',
                events: [{
                    device_id: visitorId,
                    event_type: 'Script Active',
                    platform: 'Web'
                }]
            })
        }).catch(e => {});
    }
 
    logUserActive();
})();
