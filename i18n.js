/* global chrome */

export const translations = {
  en: {
    // Header & Meta
    appTitle: 'Prod-Dev Switcher',
    optionsTitle: 'Prod-Dev Switcher Settings',
    appSubtitle: 'Configure multiple project domain pairs for one-click switching.',
    savedProjects: 'Saved Projects',

    // Search
    searchPlaceholderOptions: 'Search projects by name, PROD or DEV URL...',
    searchPlaceholderPopup: 'Search projects...',
    noProjectsMatch: 'No projects found matching',
    noProjectsMatchPopup: 'No projects match',
    clearSearch: 'Clear search',

    // Project Form Cards
    projectNamePlaceholder: 'Project name (e.g. My Website)',
    deleteBtn: '✕ Delete',
    deleteTitle: 'Delete this project',
    prodBadge: 'PROD',
    prodLabel: 'Production URL:',
    prodPlaceholder: 'https://example.com',
    prodHint: 'e.g. https://example.com or example.com',
    devBadge: 'DEV',
    devLabel: 'Development URL:',
    devPlaceholder: 'http://localhost:3000',
    devHint: 'e.g. http://localhost:3000 or localhost:3000',
    addProjectBtn: '+ Add Another Project',
    saveBtn: 'Save All Changes',
    shortcutLabel: 'Toggle switch shortcut:',

    // Status & Validation
    savedSuccess: 'Saved {count} project(s) successfully!',
    fixErrors: 'Please fix the errors highlighted above.',
    saveError: 'Failed to save projects to storage.',
    errorProdRequired: 'PROD URL is required.',
    errorDevRequired: 'DEV URL is required.',
    errorInvalidProd: 'Invalid PROD URL or domain.',
    errorInvalidDev: 'Invalid DEV URL or domain.',
    errorSameHost: 'DEV and PROD cannot have the exact same host.',
    defaultProjectName: 'Project {index}',
    mainProject: 'Main Project',
    unnamedProject: 'Unnamed Project',

    // Popup
    toggleBtnMain: 'Toggle PROD / DEV',
    toggleBtnSwitchTo: 'Switch to {env}',
    toggleSubtitleSwitchActive: 'Switch environment for active tab',
    toggleSubtitleClickConfig: 'Click to configure projects in settings',
    toggleSubtitleNoMatch: 'Active tab does not match any project',
    popupNoProjectsYet: 'No projects configured yet.',
    popupAddProject: '+ Add Project in Settings',
    activeBadge: 'Active',
    openProdTitle: 'Open PROD in new tab: {url}',
    openDevTitle: 'Open DEV in new tab: {url}',
    btnOptions: 'Settings / Options',

    // Controls
    themeLabel: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeToggleTitle: 'Toggle theme (Dark / Light)',
    langLabel: 'Language',
    langEn: 'English',
    langPl: 'Polski',

    // Counts
    countTotal: '({total})',
    countFiltered: '({visible} of {total})',
    countFilteredPopup: '({visible}/{total})'
  },
  pl: {
    // Header & Meta
    appTitle: 'Prod-Dev Switcher',
    optionsTitle: 'Ustawienia Prod-Dev Switcher',
    appSubtitle: 'Skonfiguruj pary domen dla projektów do szybkiego przełączania środowisk.',
    savedProjects: 'Zapisane Projekty',

    // Search
    searchPlaceholderOptions: 'Szukaj projektów po nazwie, adresie PROD lub DEV...',
    searchPlaceholderPopup: 'Szukaj projektów...',
    noProjectsMatch: 'Nie znaleziono projektów pasujących do',
    noProjectsMatchPopup: 'Brak projektów pasujących do',
    clearSearch: 'Wyczyść wyszukiwanie',

    // Project Form Cards
    projectNamePlaceholder: 'Nazwa projektu (np. Mój Serwis)',
    deleteBtn: '✕ Usuń',
    deleteTitle: 'Usuń ten projekt',
    prodBadge: 'PROD',
    prodLabel: 'Adres Produkcyjny:',
    prodPlaceholder: 'https://example.com',
    prodHint: 'np. https://example.com lub example.com',
    devBadge: 'DEV',
    devLabel: 'Adres Deweloperski:',
    devPlaceholder: 'http://localhost:3000',
    devHint: 'np. http://localhost:3000 lub localhost:3000',
    addProjectBtn: '+ Dodaj kolejny projekt',
    saveBtn: 'Zapisz wszystkie zmiany',
    shortcutLabel: 'Skrót do przełączania:',

    // Status & Validation
    savedSuccess: 'Pomyślnie zapisano {count} projekt(ów)!',
    fixErrors: 'Popraw błędy zaznaczone powyżej.',
    saveError: 'Nie udało się zapisać projektów w pamięci.',
    errorProdRequired: 'Adres PROD jest wymagany.',
    errorDevRequired: 'Adres DEV jest wymagany.',
    errorInvalidProd: 'Nieprawidłowy adres lub domena PROD.',
    errorInvalidDev: 'Nieprawidłowy adres lub domena DEV.',
    errorSameHost: 'DEV i PROD nie mogą mieć tego samego hosta.',
    defaultProjectName: 'Projekt {index}',
    mainProject: 'Główny Projekt',
    unnamedProject: 'Projekt bez nazwy',

    // Popup
    toggleBtnMain: 'Przełącz PROD / DEV',
    toggleBtnSwitchTo: 'Przełącz na {env}',
    toggleSubtitleSwitchActive: 'Przełącz środowisko dla aktywnej karty',
    toggleSubtitleClickConfig: 'Kliknij, aby skonfigurować projekty w ustawieniach',
    toggleSubtitleNoMatch: 'Aktywna karta nie pasuje do żadnego projektu',
    popupNoProjectsYet: 'Brak skonfigurowanych projektów.',
    popupAddProject: '+ Dodaj projekt w ustawieniach',
    activeBadge: 'Aktywny',
    openProdTitle: 'Otwórz PROD w nowej karcie: {url}',
    openDevTitle: 'Otwórz DEV w nowej karcie: {url}',
    btnOptions: 'Ustawienia / Opcje',

    // Controls
    themeLabel: 'Motyw',
    themeDark: 'Ciemny',
    themeLight: 'Jasny',
    themeToggleTitle: 'Zmień motyw (Ciemny / Jasny)',
    langLabel: 'Język',
    langEn: 'English',
    langPl: 'Polski',

    // Counts
    countTotal: '({total})',
    countFiltered: '({visible} z {total})',
    countFilteredPopup: '({visible}/{total})'
  }
};

export let currentLang = 'en';

export const getLang = async () => {
  try {
    const data = await chrome.storage.sync.get(['lang']);
    if (data.lang && (data.lang === 'en' || data.lang === 'pl')) {
      currentLang = data.lang;
    } else {
      currentLang = 'en';
    }
  } catch {
    currentLang = 'en';
  }
  return currentLang;
};

export const setLang = async (lang) => {
  currentLang = (lang === 'pl') ? 'pl' : 'en';
  try {
    await chrome.storage.sync.set({ lang: currentLang });
  } catch (err) {
    console.error('Failed to set language in storage:', err);
  }
  return currentLang;
};

export const t = (key, params = {}) => {
  const dict = translations[currentLang] || translations.en;
  let text = dict[key] || translations.en[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
};

export const applyI18nToDOM = () => {
  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', t(key));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', t(key));
  });
};
