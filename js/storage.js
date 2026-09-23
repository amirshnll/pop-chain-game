import { ext } from './browser.js';
export const defaults = { language: 'en', sound: true, reducedMotion: false, bestScore: 0, longestChain: 0, tutorialSeen: false };
export async function getSettings() { return { ...defaults, ...(await ext.storage.local.get(defaults)) }; }
export async function saveSettings(value) { await ext.storage.local.set(value); }
