import { t } from './i18n.js';
import { getSettings, saveSettings } from './storage.js';
export class Game {
    constructor() {
        this.targets = [];
        this.running = false;
        this.paused = false;
        this.score = 0;
        this.combo = 0;
        this.correct = 0;
        this.attempts = 0;
        this.chain = 0;
        this.longest = 0;
        this.clicks = [];
        this.remaining = 45;
        this.clock = 0;
        this.waveTimer = 0;
        this.waveId = 0;
        this.accepting = false;
        this.nextExpected = 1;
        this.stage = 1;
        this.board = document.querySelector('#gameBoard');
    }
    async start() { clearInterval(this.clock); this.clear(); this.settings = await getSettings(); this.running = true; this.paused = false; this.score = this.combo = this.correct = this.attempts = this.chain = this.longest = 0; this.clicks = []; this.remaining = 45; this.stage = 1; this.nextExpected = 1; this.update(); document.querySelector('#startScreen')?.remove(); this.startClock(); this.makeWave(); }
    startClock() {
        clearInterval(this.clock); this.clock = window.setInterval(() => {
            this.remaining -= .1; this.update(); if (this.remaining <= 0)
                this.end();
        }, 100);
    }
    async pause() {
        if (!this.running || this.paused)
            return null; this.paused = true; this.running = false; clearInterval(this.clock); this.wavePending = Boolean(this.waveTimer); clearTimeout(this.waveTimer); this.waveTimer = 0; const now = Date.now(); this.targets.forEach(target => { target.remainingLife = Math.max(0, target.expires - now); target.remainingWarning = Math.max(0, target.warningAt - now); clearTimeout(target.timer); clearTimeout(target.warningTimer); }); const records = { bestScore: Math.max(this.settings.bestScore, this.score), longestChain: Math.max(this.settings.longestChain, this.longest) }; this.settings = { ...this.settings, ...records }; await saveSettings(records); return records;
    }
    resume() {
        if (!this.paused)
            return; this.paused = false; this.running = true; this.startClock(); this.targets.forEach(target => this.armTarget(target, target.remainingLife, target.remainingWarning)); if (!this.targets.length) { this.accepting = false; this.queueWave(this.wavePending ? 180 : 0); } this.wavePending = false;
    }
    stop() {
        if (!this.running)
            return; this.running = false; clearInterval(this.clock); this.clear(); this.score = this.combo = this.correct = this.attempts = this.chain = this.longest = 0; this.remaining = 45; this.update();
    }
    makeWave() {
        if (!this.running || this.targets.length || this.accepting)
            return; this.waveId++; this.accepting = true; const count = Math.min(2 + Math.floor(this.stage / 2), 6); const length = Math.min(2 + Math.floor(this.stage / 3), 7); this.nextExpected = 1; for (let n = 1; n <= length; n++)
            this.spawn(n, count, length); this.stage++;
    }
    queueWave(delay = 180) {
        if (!this.running || this.targets.length || this.waveTimer || this.accepting)
            return; this.waveTimer = window.setTimeout(() => { this.waveTimer = 0; this.makeWave(); }, delay);
    }
    spawn(number, count, length) {
        const size = Math.max(42, 68 - this.stage * 1.2); const rect = this.board.getBoundingClientRect(); const occupied = this.targets.map(x => x.el.getBoundingClientRect()); let x = 0, y = 0, ok = false; for (let i = 0; i < 50 && !ok; i++) {
            x = 16 + Math.random() * (rect.width - size - 32);
            y = 20 + Math.random() * (rect.height - size - 40);
            ok = occupied.every(r => Math.hypot(r.left - rect.left - x, r.top - rect.top - y) > size + 12);
        } if (!ok)
            return; const el = document.createElement('button'); el.className = 'target'; el.textContent = String(number); el.style.cssText += `width:${size}px;height:${size}px;left:${x}px;top:${y}px;background:linear-gradient(135deg,hsl(${(number * 54 + this.stage * 15) % 360} 82% 62%),hsl(${(number * 54 + this.stage * 15 + 35) % 360} 80% 49%));`; const life = Math.max(6500, 4000 + length * 1000); const target = { id: Math.random(), number, waveId: this.waveId, expires: 0, warningAt: 0, el, timer: 0, warningTimer: 0 }; el.onclick = event => { event.stopPropagation(); this.hit(target); }; this.board.append(el); this.targets.push(target); this.armTarget(target, life, life * .78);
    }
    armTarget(target, life, warningDelay) {
        const safeLife = Math.max(0, life); target.expires = Date.now() + safeLife; target.warningAt = Date.now() + Math.max(0, warningDelay); target.timer = window.setTimeout(() => this.expire(target), safeLife); if (warningDelay > 0)
            target.warningTimer = window.setTimeout(() => { if (this.targets.includes(target)) target.el.classList.add('expiring'); }, warningDelay); else target.el.classList.add('expiring');
    }
    hit(target) {
        if (!this.running || !this.accepting || target.waveId !== this.waveId || !this.targets.includes(target))
            return; this.attempts++; if (target.number === this.nextExpected) {
                this.correct++;
                this.chain++;
                this.combo++;
                this.longest = Math.max(this.longest, this.chain);
                this.score += 10 * Math.min(8, 1 + Math.floor(this.combo / 3));
                this.clicks.push(Date.now());
                this.sound(620);
                target.el.classList.add('correct');
                this.remove(target);
                this.nextExpected++;
                this.flash('+', target.el);
                if (!this.targets.some(x => x.number === this.nextExpected)) {
                    this.accepting = false;
                    this.queueWave();
                }
            }
        else {
            this.combo = 0;
            this.chain = 0;
            this.remaining = Math.max(0, this.remaining - 1.5);
            this.sound(180);
            target.el.classList.add('wrong');
            window.setTimeout(() => target.el.classList.remove('wrong'), 280);
            this.flash('×', target.el);
        } this.update();
    }
    expire(target) {
        if (!this.running || target.waveId !== this.waveId || !this.targets.includes(target))
            return; this.combo = 0; this.chain = 0; this.remove(target); this.update(); if (this.running && !this.targets.length) {
                this.accepting = false;
                this.queueWave();
            }
    }
    remove(t) {
        clearTimeout(t.timer); clearTimeout(t.warningTimer); if (t.moveTimer)
            clearInterval(t.moveTimer); this.targets = this.targets.filter(x => x !== t); t.el.remove();
    }
    flash(text, el) { const s = document.createElement('span'); s.className = 'spark'; s.textContent = text; s.style.left = el.style.left; s.style.top = el.style.top; this.board.append(s); setTimeout(() => s.remove(), 600); }
    sound(freq) {
        if (!this.settings.sound)
            return; try {
                const a = new AudioContext(), o = a.createOscillator(), g = a.createGain();
                o.frequency.value = freq;
                g.gain.setValueAtTime(.045, a.currentTime);
                g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .07);
                o.connect(g).connect(a.destination);
                o.start();
                o.stop(a.currentTime + .07);
            }
        catch { }
    }
    update() { (document.querySelector('#score')).textContent = String(this.score); (document.querySelector('#combo')).textContent = String(this.combo); (document.querySelector('#multiplier')).textContent = `×${Math.min(8, 1 + Math.floor(this.combo / 3))}`; (document.querySelector('#time')).textContent = String(Math.max(0, Math.ceil(this.remaining))); }
    async end() {
        if (!this.running)
            return; this.running = false; this.paused = false; clearInterval(this.clock); this.clear(); const accuracy = this.attempts ? Math.round(this.correct / this.attempts * 100) : 0; const speed = this.clicks.length > 1 ? ((this.clicks.length - 1) / ((this.clicks[this.clicks.length - 1] - this.clicks[0]) / 1000)).toFixed(1) : '—'; const records = { bestScore: Math.max(this.settings.bestScore, this.score), longestChain: Math.max(this.settings.longestChain, this.longest) }; this.settings = { ...this.settings, ...records }; await saveSettings(records); const bestLine = document.querySelector('#bestLine'); if (bestLine)
            bestLine.textContent = `${t('bestScore')}: ${records.bestScore}`; document.querySelector('#settingsBestScore').textContent = String(records.bestScore); document.querySelector('#settingsLongestChain').textContent = String(records.longestChain); (document.querySelector('#finalScore')).textContent = String(this.score); const summary = document.querySelector('#summary'); summary.replaceChildren(...[
                [t('accuracy'), `${accuracy}%`],
                [t('longestChain'), String(this.longest)],
                [t('avgClickSpeed'), `${speed}${speed === '—' ? '' : '/s'}`],
                [t('bestScore'), String(records.bestScore)]
            ].map(([label, value]) => {
                const row = document.createElement('div');
                const strong = document.createElement('strong');
                row.textContent = label;
                strong.textContent = value;
                row.append(strong);
                return row;
            })); document.querySelector('#modal').classList.remove('hidden');
    }
    clear() {
        clearTimeout(this.waveTimer); this.waveTimer = 0; this.accepting = false; this.targets.forEach(x => {
            clearTimeout(x.timer); clearTimeout(x.warningTimer); if (x.moveTimer)
                clearInterval(x.moveTimer); x.el.remove();
        }); this.targets = [];
    }
}
