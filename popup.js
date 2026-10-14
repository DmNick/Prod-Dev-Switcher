/* global chrome */
import { t, getLang, setLang, currentLang, applyI18nToDOM } from './i18n.js';
import { initTheme, toggleTheme, currentTheme } from './theme.js';

const formatUrl = (input) => {
  if (!input) return '';
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?/i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
};

const parseUrl = (rawUrl) => {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
};

const getRules = async () => {
  try {
    const result = await chrome.storage.sync.get(['rules', 'prod', 'dev']);
    if (Array.isArray(result.rules) && result.rules.length > 0) {
      return result.rules;
    }
    if (result.prod && result.dev) {
      return [{
        id: 'proj_legacy',
        name: t('mainProject'),
        prod: result.prod,
        dev: result.dev
      }];
    }
    return [];
  } catch (err) {
    console.error('getRules error:', err);
    return [];
  }
};

const getMatched = (rules, tab) => {
  const rawUrl = tab?.url || tab?.pendingUrl;
  const tabUrl = parseUrl(rawUrl);

  if (!rules.length || !tabUrl) {
    return { matched: null, rule: null, tabUrl, targetEnv: null, targetBase: null };
  }

  const currentHost = tabUrl.host.toLowerCase();

  for (const rule of rules) {
    if (!rule.prod || !rule.dev) continue;

    const prodUrl = parseUrl(rule.prod);
    const devUrl = parseUrl(rule.dev);

    if (prodUrl && prodUrl.host.toLowerCase() === currentHost) {
      return {
        matched: 'prod',
        rule,
        targetEnv: 'dev',
        targetBase: devUrl,
        tabUrl
      };
    }

    if (devUrl && devUrl.host.toLowerCase() === currentHost) {
      return {
        matched: 'dev',
        rule,
        targetEnv: 'prod',
        targetBase: prodUrl,
        tabUrl
      };
    }
  }

  return { matched: null, rule: null, tabUrl, targetEnv: null, targetBase: null };
};

const escapeHtml = (str) => {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const getHostDisplay = (urlStr) => {
  try {
    return new URL(formatUrl(urlStr)).host;
  } catch {
    return urlStr || '';
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await initTheme();
  await getLang();
  applyI18nToDOM();

  const toggleBtn = document.getElementById('btn-toggle-current');
  const toggleLabel = document.getElementById('toggle-label');
  const toggleDesc = document.getElementById('toggle-desc');
  const optionsBtn = document.getElementById('btn-options');
  const projectsContainer = document.getElementById('projects-container');
  const projectsCount = document.getElementById('projects-count');
  const searchBox = document.getElementById('search-box');
  const searchInput = document.getElementById('project-search');
  const clearBtn = document.getElementById('btn-clear-search');
  const emptyState = document.getElementById('search-empty-state');
  const termDisplay = document.getElementById('search-term-display');
  const langBtn = document.getElementById('btn-popup-lang');
  const langText = document.getElementById('popup-lang-text');
  const themeBtn = document.getElementById('btn-popup-theme');
  const themeIcon = document.getElementById('popup-theme-icon');

  const updateControlsUI = () => {
    if (langText) langText.textContent = currentLang.toUpperCase();
    if (themeIcon) themeIcon.textContent = currentTheme === 'light' ? '☀️' : '🌙';
  };
  updateControlsUI();

  // Load current tab and rules in parallel
  const [tabs, rules] = await Promise.all([
    chrome.tabs.query({ active: true, currentWindow: true }),
    getRules()
  ]);

  const activeTab = tabs && tabs[0] ? tabs[0] : null;
  const matchResult = getMatched(rules, activeTab);

  const updateTopToggleUI = () => {
    toggleBtn.classList.remove('env-prod', 'env-dev', 'env-unmatched');

    if (matchResult.matched && matchResult.targetBase) {
      const targetEnv = matchResult.targetEnv.toUpperCase();
      const projPrefix = matchResult.rule?.name ? `[${matchResult.rule.name}] ` : '';
      const targetHost = matchResult.targetBase.host;

      if (matchResult.matched === 'prod') {
        toggleBtn.classList.add('env-dev');
      } else {
        toggleBtn.classList.add('env-prod');
      }
      toggleLabel.textContent = t('toggleBtnSwitchTo', { env: targetEnv });
      toggleDesc.textContent = `${projPrefix}${targetHost}`;
    } else {
      toggleBtn.classList.add('env-unmatched');
      toggleLabel.textContent = t('toggleBtnMain');
      if (rules.length === 0) {
        toggleDesc.textContent = t('toggleSubtitleClickConfig');
      } else {
        toggleDesc.textContent = t('toggleSubtitleNoMatch');
      }
    }
  };

  updateTopToggleUI();

  // Toggle button click handler
  toggleBtn.addEventListener('click', async () => {
    if (!matchResult.matched || !matchResult.targetBase || !activeTab?.id) {
      chrome.runtime.openOptionsPage();
      window.close();
      return;
    }

    try {
      const currentUrl = matchResult.tabUrl || new URL(activeTab.url || activeTab.pendingUrl);
      const newUrl = new URL(matchResult.targetBase.href);

      newUrl.pathname = currentUrl.pathname;
      newUrl.search = currentUrl.search;
      newUrl.hash = currentUrl.hash;

      await chrome.tabs.update(activeTab.id, { url: newUrl.toString() });
    } catch (err) {
      console.error('Toggle error:', err);
    }
    window.close();
  });

  const filterPopupProjects = () => {
    const query = (searchInput?.value || '').trim().toLowerCase();
    const cards = projectsContainer.querySelectorAll('.project-card');

    if (clearBtn) {
      clearBtn.style.display = query ? 'flex' : 'none';
    }

    let visibleCount = 0;
    cards.forEach((card) => {
      const text = card.dataset.searchText || '';
      const matches = !query || text.includes(query);
      if (matches) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (emptyState && termDisplay) {
      if (query && visibleCount === 0 && cards.length > 0) {
        termDisplay.textContent = searchInput.value.trim();
        emptyState.style.display = 'block';
      } else {
        emptyState.style.display = 'none';
      }
    }

    if (projectsCount) {
      if (query) {
        projectsCount.textContent = t('countFilteredPopup', { visible: visibleCount, total: cards.length });
      } else {
        projectsCount.textContent = cards.length > 0 ? t('countTotal', { total: cards.length }) : '';
      }
    }
  };

  const renderProjects = () => {
    projectsContainer.innerHTML = '';

    if (rules.length === 0) {
      if (searchBox) searchBox.style.display = 'none';
      if (projectsCount) projectsCount.textContent = '';
      projectsContainer.innerHTML = `
        <div class="empty-state">
          <p>${escapeHtml(t('popupNoProjectsYet'))}</p>
          <button type="button" class="btn-empty-add" id="btn-empty-add">
            ${escapeHtml(t('popupAddProject'))}
          </button>
        </div>
      `;
      document.getElementById('btn-empty-add')?.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
        window.close();
      });
      return;
    }

    if (searchBox) searchBox.style.display = 'flex';
    if (projectsCount) {
      projectsCount.textContent = t('countTotal', { total: rules.length });
    }

    rules.forEach((proj) => {
      const card = document.createElement('div');
      const isActive = matchResult.rule && proj.id === matchResult.rule.id;
      card.className = `project-card${isActive ? ' active-project' : ''}`;

      const prodHost = getHostDisplay(proj.prod);
      const devHost = getHostDisplay(proj.dev);
      const displayName = proj.name || t('unnamedProject');

      card.dataset.searchText = `${displayName} ${proj.prod || ''} ${proj.dev || ''} ${prodHost} ${devHost}`.toLowerCase();

      card.innerHTML = `
        <div class="project-info">
          <div class="project-name-row">
            <div class="project-name" title="${escapeHtml(displayName)}">${escapeHtml(displayName)}</div>
            ${isActive ? `<span class="active-badge">${escapeHtml(t('activeBadge'))}</span>` : ''}
          </div>
          <div class="project-domains" title="${escapeHtml(prodHost)} &#8644; ${escapeHtml(devHost)}">
            ${escapeHtml(prodHost)} <span style="opacity:0.5;">&#8644;</span> ${escapeHtml(devHost)}
          </div>
        </div>
        <div class="project-actions">
          <button type="button" class="btn-env btn-env-prod" title="${escapeHtml(t('openProdTitle', { url: proj.prod }))}">
            ${escapeHtml(t('prodBadge'))}
          </button>
          <button type="button" class="btn-env btn-env-dev" title="${escapeHtml(t('openDevTitle', { url: proj.dev }))}">
            ${escapeHtml(t('devBadge'))}
          </button>
        </div>
      `;

      card.querySelector('.btn-env-prod').addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.tabs.create({ url: formatUrl(proj.prod) });
        window.close();
      });

      card.querySelector('.btn-env-dev').addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.tabs.create({ url: formatUrl(proj.dev) });
        window.close();
      });

      projectsContainer.appendChild(card);
    });

    filterPopupProjects();
  };

  renderProjects();

  // Search input listeners
  searchInput?.addEventListener('input', () => {
    filterPopupProjects();
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      filterPopupProjects();
      searchInput.blur();
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      filterPopupProjects();
      searchInput.focus();
    }
  });

  // Language switcher button in popup
  langBtn?.addEventListener('click', async () => {
    const nextLang = currentLang === 'en' ? 'pl' : 'en';
    await setLang(nextLang);
    applyI18nToDOM();
    updateControlsUI();
    updateTopToggleUI();
    renderProjects();
  });

  // Theme toggle button in popup
  themeBtn?.addEventListener('click', async () => {
    const nextTheme = await toggleTheme();
    updateControlsUI();
  });

  // Bottom Options button
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
});
