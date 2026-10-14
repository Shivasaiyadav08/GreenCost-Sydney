'use client';

import {useSyncExternalStore} from 'react';
import {THEME_KEY} from './theme-initialization';
import {formatCompactAUD} from './format';

export type Theme = 'light' | 'dark';
const THEME_EVENT = 'greencost-theme-change';

function snapshot(): Theme {
 return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
 document.documentElement.dataset.theme = theme;
 document.documentElement.style.colorScheme = theme;
 window.dispatchEvent(new Event(THEME_EVENT));
}

export function setTheme(theme: Theme) {
 try { localStorage.setItem(THEME_KEY, theme); } catch { /* Still usable when storage is unavailable. */ }
 applyTheme(theme);
}

function subscribe(onChange: () => void) {
 const media = window.matchMedia('(prefers-color-scheme: dark)');
 const syncPreference = () => {
  let saved: string | null = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch { /* Follow the system preference. */ }
  applyTheme(saved === 'dark' || saved === 'light' ? saved : media.matches ? 'dark' : 'light');
 };
 const storageChange = (event: StorageEvent) => {
  if (event.key === THEME_KEY || event.key === null) syncPreference();
 };
 window.addEventListener(THEME_EVENT, onChange);
 window.addEventListener('storage', storageChange);
 media.addEventListener('change', syncPreference);
 return () => {
  window.removeEventListener(THEME_EVENT, onChange);
  window.removeEventListener('storage', storageChange);
  media.removeEventListener('change', syncPreference);
 };
}

export function useTheme(): Theme {
 return useSyncExternalStore(subscribe, snapshot, () => 'light');
}

export const chartPalette = {
  light: {sustainable:'#1d6a4b', conventional:'#8a8880', grid:'#deded7', text:'#62695f', surface:'#ffffff', foreground:'#222820', components:['#1d6a4b','#6f9b83','#9db8a4','#bcae86','#8f9aa3','#a89b8c','#7e827b','#b47f87']},
  dark: {sustainable:'#5cae8c', conventional:'#8f9a93', grid:'#30382e', text:'#a5ada1', surface:'#151815', foreground:'#f7f7f2', components:['#5cae8c','#7fbfa0','#a3cfb5','#c0b48f','#93a3ab','#b0a293','#a0a59b','#c99aa3']},
};

export const compactMoney = formatCompactAUD;
