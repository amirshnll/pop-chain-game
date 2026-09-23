import { getSettings } from './storage.js';
let dict = {};
let language = 'en';
export const languages = [{ code: 'en', name: 'English' }, { code: 'fa', name: 'فارسی' }, { code: 'ar', name: 'العربية' }, { code: 'es', name: 'Español' }, { code: 'fr', name: 'Français' }, { code: 'de', name: 'Deutsch' }, { code: 'tr', name: 'Türkçe' }, { code: 'sv', name: 'Svenska' }, { code: 'et', name: 'Eesti' }, { code: 'ja', name: '日本語' }, { code: 'ko', name: '한국어' }, { code: 'zh', name: '中文' }, { code: 'it', name: 'Italiano' }];
export async function initI18n(nextLanguage) {
    language = nextLanguage || (await getSettings()).language; try {
        dict = await (await fetch(`locales/${language}.json`)).json();
    }
        catch {
            dict = await (await fetch('locales/en.json')).json();
        } document.documentElement.lang = language; document.documentElement.dir = ['fa', 'ar'].includes(language) ? 'rtl' : 'ltr'; document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n)); document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
}
export const t = (key, vars = {}) => (dict[key] || key).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
