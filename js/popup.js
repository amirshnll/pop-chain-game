import { initI18n, languages, t } from './i18n.js';
import { Game } from './game.js';
import { getSettings, saveSettings } from './storage.js';
await initI18n();
const game = new Game();
const start = () => game.start();
document.querySelector('#startButton').addEventListener('click', start);
document.querySelector('#playAgain').addEventListener('click', () => { document.querySelector('#modal').classList.add('hidden'); start(); });
document.querySelector('#restartButton').addEventListener('click', start);
const s = await getSettings();
document.querySelector('#bestLine').textContent = t('bestScore') + ': ' + s.bestScore;
const settingsPanel = document.querySelector('#settingsPanel');
const language = document.querySelector('#language');
const sound = document.querySelector('#sound');
const reducedMotion = document.querySelector('#reducedMotion');
language.replaceChildren(...languages.map(item => {
    const option = document.createElement('option');
    option.value = item.code;
    option.textContent = item.name;
    return option;
}));
language.value = s.language;
sound.checked = s.sound;
reducedMotion.checked = s.reducedMotion;
document.querySelector('#settingsBestScore').textContent = String(s.bestScore);
document.querySelector('#settingsLongestChain').textContent = String(s.longestChain);
document.querySelector('#settingsButton').addEventListener('click', async () => {
    const records = await game.pause();
    if (records) {
        document.querySelector('#bestLine').textContent = `${t('bestScore')}: ${records.bestScore}`;
        document.querySelector('#settingsBestScore').textContent = String(records.bestScore);
        document.querySelector('#settingsLongestChain').textContent = String(records.longestChain);
    }
    settingsPanel.classList.remove('hidden');
});
function closeSettings() {
    settingsPanel.classList.add('hidden');
    game.resume();
}
document.querySelector('#closeSettings').addEventListener('click', closeSettings);
settingsPanel.addEventListener('click', event => { if (event.target === settingsPanel) closeSettings(); });
async function saveInlineSettings() {
    await saveSettings({ language: language.value, sound: sound.checked, reducedMotion: reducedMotion.checked });
    document.querySelector('#saved').textContent = t('saved');
}
language.addEventListener('change', async () => {
    await saveInlineSettings();
    await initI18n(language.value);
    const current = await getSettings();
    document.querySelector('#bestLine').textContent = `${t('bestScore')}: ${current.bestScore}`;
    document.querySelector('#saved').textContent = t('saved');
});
sound.addEventListener('change', saveInlineSettings);
reducedMotion.addEventListener('change', saveInlineSettings);
if (!s.tutorialSeen) {
    document.querySelector('#tutorial').classList.remove('hidden');
    document.querySelector('#tutorialContinue').addEventListener('click', async () => { await saveSettings({ tutorialSeen: true }); document.querySelector('#tutorial').classList.add('hidden'); });
}
