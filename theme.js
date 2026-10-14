/* global chrome */

export let currentTheme = 'dark';

export const getTheme = async () => {
  try {
    const data = await chrome.storage.sync.get(['theme']);
    if (data.theme === 'light' || data.theme === 'dark') {
      currentTheme = data.theme;
    } else {
      currentTheme = 'dark';
    }
  } catch {
    currentTheme = 'dark';
  }
  return currentTheme;
};

export const applyTheme = (theme) => {
  currentTheme = (theme === 'light') ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  return currentTheme;
};

export const setTheme = async (theme) => {
  const targetTheme = applyTheme(theme);
  try {
    await chrome.storage.sync.set({ theme: targetTheme });
  } catch (err) {
    console.error('Failed to save theme to storage:', err);
  }
  return targetTheme;
};

export const toggleTheme = async () => {
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  return await setTheme(nextTheme);
};

export const initTheme = async () => {
  const theme = await getTheme();
  applyTheme(theme);
  return theme;
};
