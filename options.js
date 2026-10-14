/* global chrome */
import { t, getLang, setLang, currentLang, applyI18nToDOM } from './i18n.js';
import { initTheme, toggleTheme, currentTheme } from './theme.js';

const normalizeUrl = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return '';

  let withScheme = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?/i.test(trimmed)) {
      withScheme = `http://${trimmed}`;
    } else {
      withScheme = `https://${trimmed}`;
    }
  }

  const parsed = new URL(withScheme);
  return parsed.origin;
};

const showStatus = (message, type = 'success') => {
  const statusEl = document.getElementById('status-msg');
  statusEl.textContent = message;
  statusEl.className = `status-msg ${type} show`;

  clearTimeout(window.__statusTimeout);
  window.__statusTimeout = setTimeout(() => {
    statusEl.classList.remove('show');
  }, 3500);
};

const escapeHtml = (str) => {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const createCardElement = (project = {}) => {
  const cardId = project.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const card = document.createElement('div');
  card.className = 'project-card';
  card.dataset.id = cardId;

  card.innerHTML = `
    <div class="project-card-header">
      <div class="project-name-wrapper">
        <input 
          type="text" 
          class="project-name-input" 
          placeholder="${escapeHtml(t('projectNamePlaceholder'))}" 
          value="${project.name ? escapeHtml(project.name) : ''}"
          autocomplete="off"
        >
      </div>
      <button type="button" class="btn-delete" title="${escapeHtml(t('deleteTitle'))}">
        ${escapeHtml(t('deleteBtn'))}
      </button>
    </div>
    <div class="grid-fields">
      <div class="field-group">
        <label class="field-label">
          <span class="badge badge-prod">${escapeHtml(t('prodBadge'))}</span>
          <span class="label-prod-text">${escapeHtml(t('prodLabel'))}</span>
        </label>
        <input 
          type="text" 
          class="url-input input-prod" 
          placeholder="${escapeHtml(t('prodPlaceholder'))}" 
          value="${project.prod ? escapeHtml(project.prod) : ''}"
          spellcheck="false" 
          autocomplete="off"
        >
        <p class="field-error error-prod"></p>
        <p class="field-hint">${t('prodHint').replace('https://example.com', '<code>https://example.com</code>').replace('example.com', '<code>example.com</code>')}</p>
      </div>

      <div class="field-group">
        <label class="field-label">
          <span class="badge badge-dev">${escapeHtml(t('devBadge'))}</span>
          <span class="label-dev-text">${escapeHtml(t('devLabel'))}</span>
        </label>
        <input 
          type="text" 
          class="url-input input-dev" 
          placeholder="${escapeHtml(t('devPlaceholder'))}" 
          value="${project.dev ? escapeHtml(project.dev) : ''}"
          spellcheck="false" 
          autocomplete="off"
        >
        <p class="field-error error-dev"></p>
        <p class="field-hint">${t('devHint').replace('http://localhost:3000', '<code>http://localhost:3000</code>').replace('localhost:3000', '<code>localhost:3000</code>')}</p>
      </div>
    </div>
  `;

  // Attach delete action
  const deleteBtn = card.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', () => {
    const container = document.getElementById('projects-container');
    card.remove();
    if (container.children.length === 0) {
      addProjectCard();
    }
    filterProjects();
  });

  // Clear errors on input and re-filter if search active
  card.querySelectorAll('.url-input').forEach((input) => {
    input.addEventListener('input', () => {
      input.classList.remove('input-error');
      const errorEl = input.parentElement.querySelector('.field-error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
      }
      const searchInput = document.getElementById('project-search');
      if (searchInput && searchInput.value.trim()) {
        filterProjects();
      }
    });
  });

  const nameInput = card.querySelector('.project-name-input');
  nameInput?.addEventListener('input', () => {
    const searchInput = document.getElementById('project-search');
    if (searchInput && searchInput.value.trim()) {
      filterProjects();
    }
  });

  return card;
};

const filterProjects = () => {
  const searchInput = document.getElementById('project-search');
  const clearBtn = document.getElementById('btn-clear-search');
  const emptyState = document.getElementById('search-empty-state');
  const termDisplay = document.getElementById('search-term-display');
  const projectsCount = document.getElementById('projects-count');
  const container = document.getElementById('projects-container');
  const cards = container.querySelectorAll('.project-card');

  const query = (searchInput?.value || '').trim().toLowerCase();

  if (clearBtn) {
    clearBtn.style.display = query ? 'flex' : 'none';
  }

  let visibleCount = 0;
  cards.forEach((card) => {
    const name = (card.querySelector('.project-name-input')?.value || '').toLowerCase();
    const prod = (card.querySelector('.input-prod')?.value || '').toLowerCase();
    const dev = (card.querySelector('.input-dev')?.value || '').toLowerCase();

    const matches = !query || name.includes(query) || prod.includes(query) || dev.includes(query);
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
      projectsCount.textContent = t('countFiltered', { visible: visibleCount, total: cards.length });
    } else {
      projectsCount.textContent = cards.length > 0 ? t('countTotal', { total: cards.length }) : '';
    }
  }
};

const addProjectCard = (projectData = {}) => {
  const container = document.getElementById('projects-container');
  const card = createCardElement(projectData);
  container.appendChild(card);
  filterProjects();
  return card;
};

const refreshAllCardLabels = () => {
  const cards = document.querySelectorAll('.project-card');
  cards.forEach((card) => {
    const nameInput = card.querySelector('.project-name-input');
    if (nameInput) nameInput.placeholder = t('projectNamePlaceholder');

    const deleteBtn = card.querySelector('.btn-delete');
    if (deleteBtn) {
      deleteBtn.textContent = t('deleteBtn');
      deleteBtn.title = t('deleteTitle');
    }

    const prodBadge = card.querySelector('.badge-prod');
    if (prodBadge) prodBadge.textContent = t('prodBadge');

    const prodLabel = card.querySelector('.label-prod-text');
    if (prodLabel) prodLabel.textContent = t('prodLabel');

    const prodHint = card.querySelector('.field-group:first-child .field-hint');
    if (prodHint) prodHint.innerHTML = t('prodHint').replace('https://example.com', '<code>https://example.com</code>').replace('example.com', '<code>example.com</code>');

    const devBadge = card.querySelector('.badge-dev');
    if (devBadge) devBadge.textContent = t('devBadge');

    const devLabel = card.querySelector('.label-dev-text');
    if (devLabel) devLabel.textContent = t('devLabel');

    const devHint = card.querySelector('.field-group:last-child .field-hint');
    if (devHint) devHint.innerHTML = t('devHint').replace('http://localhost:3000', '<code>http://localhost:3000</code>').replace('localhost:3000', '<code>localhost:3000</code>');
  });
};

const updateThemeIcon = (theme) => {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = theme === 'light' ? '☀️' : '🌙';
  }
};

const updateLangPickerUI = (lang) => {
  document.querySelectorAll('.btn-lang').forEach((btn) => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
};

// Form submission & validation
document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const container = document.getElementById('projects-container');
  const cardElements = container.querySelectorAll('.project-card');

  const validProjects = [];
  let hasErrors = false;

  cardElements.forEach((card, index) => {
    const nameInput = card.querySelector('.project-name-input');
    const prodInput = card.querySelector('.input-prod');
    const devInput = card.querySelector('.input-dev');

    const prodError = card.querySelector('.error-prod');
    const devError = card.querySelector('.error-dev');

    // Reset error states
    prodInput.classList.remove('input-error');
    devInput.classList.remove('input-error');
    prodError.style.display = 'none';
    devError.style.display = 'none';

    const name = nameInput.value.trim() || t('defaultProjectName', { index: index + 1 });
    const rawProd = prodInput.value.trim();
    const rawDev = devInput.value.trim();

    // If whole card is empty and there are other cards, ignore it
    if (!rawProd && !rawDev && !nameInput.value.trim() && cardElements.length > 1) {
      return;
    }

    if (!rawProd && !rawDev) {
      prodInput.classList.add('input-error');
      prodError.textContent = t('errorProdRequired');
      prodError.style.display = 'block';

      devInput.classList.add('input-error');
      devError.textContent = t('errorDevRequired');
      devError.style.display = 'block';
      hasErrors = true;
      return;
    }

    if (!rawProd) {
      prodInput.classList.add('input-error');
      prodError.textContent = t('errorProdRequired');
      prodError.style.display = 'block';
      hasErrors = true;
      return;
    }

    if (!rawDev) {
      devInput.classList.add('input-error');
      devError.textContent = t('errorDevRequired');
      devError.style.display = 'block';
      hasErrors = true;
      return;
    }

    let normalizedProd = '';
    let normalizedDev = '';

    try {
      normalizedProd = normalizeUrl(rawProd);
    } catch {
      prodInput.classList.add('input-error');
      prodError.textContent = t('errorInvalidProd');
      prodError.style.display = 'block';
      hasErrors = true;
    }

    try {
      normalizedDev = normalizeUrl(rawDev);
    } catch {
      devInput.classList.add('input-error');
      devError.textContent = t('errorInvalidDev');
      devError.style.display = 'block';
      hasErrors = true;
    }

    if (normalizedProd && normalizedDev) {
      try {
        const prodHost = new URL(normalizedProd).host.toLowerCase();
        const devHost = new URL(normalizedDev).host.toLowerCase();
        if (prodHost === devHost) {
          devInput.classList.add('input-error');
          devError.textContent = t('errorSameHost');
          devError.style.display = 'block';
          hasErrors = true;
        }
      } catch {}
    }

    if (!hasErrors) {
      prodInput.value = normalizedProd;
      devInput.value = normalizedDev;

      validProjects.push({
        id: card.dataset.id,
        name,
        prod: normalizedProd,
        dev: normalizedDev
      });
    }
  });

  if (hasErrors) {
    cardElements.forEach((card) => {
      if (card.querySelector('.input-error')) {
        card.style.display = '';
      }
    });
    showStatus(t('fixErrors'), 'error');
    return;
  }

  try {
    await chrome.storage.sync.set({ rules: validProjects });
    showStatus(t('savedSuccess', { count: validProjects.length }), 'success');
  } catch (err) {
    console.error('Failed to save rules:', err);
    showStatus(t('saveError'), 'error');
  }
});

// Search bar event listeners
const initSearch = () => {
  const searchInput = document.getElementById('project-search');
  const clearBtn = document.getElementById('btn-clear-search');

  searchInput?.addEventListener('input', () => {
    filterProjects();
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      filterProjects();
      searchInput.blur();
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      filterProjects();
      searchInput.focus();
    }
  });
};

// Add project button
document.getElementById('btn-add-project').addEventListener('click', () => {
  const searchInput = document.getElementById('project-search');
  if (searchInput && searchInput.value) {
    searchInput.value = '';
  }
  const defaultName = t('defaultProjectName', { index: document.querySelectorAll('.project-card').length + 1 });
  const newCard = addProjectCard({ name: defaultName });
  filterProjects();
  const prodInput = newCard.querySelector('.input-prod');
  prodInput?.focus();
});

// Setup language switcher
const initLanguage = async () => {
  const lang = await getLang();
  updateLangPickerUI(lang);
  applyI18nToDOM();

  document.querySelectorAll('.btn-lang').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const selectedLang = btn.getAttribute('data-lang');
      await setLang(selectedLang);
      updateLangPickerUI(selectedLang);
      applyI18nToDOM();
      refreshAllCardLabels();
      filterProjects();
    });
  });
};

// Setup theme switcher
const initThemeToggle = async () => {
  const current = await initTheme();
  updateThemeIcon(current);

  const toggleBtn = document.getElementById('btn-theme-toggle');
  toggleBtn?.addEventListener('click', async () => {
    const newTheme = await toggleTheme();
    updateThemeIcon(newTheme);
  });
};

// Load saved configuration
document.addEventListener('DOMContentLoaded', async () => {
  await initThemeToggle();
  await initLanguage();
  initSearch();

  try {
    const result = await chrome.storage.sync.get(['rules', 'prod', 'dev']);
    let rules = result.rules;

    // Migrate from legacy single-pair storage if needed
    if (!Array.isArray(rules)) {
      if (result.prod || result.dev) {
        rules = [{
          id: 'proj_legacy',
          name: t('mainProject'),
          prod: result.prod || '',
          dev: result.dev || ''
        }];
      } else {
        rules = [];
      }
    }

    if (rules.length > 0) {
      rules.forEach((project) => addProjectCard(project));
    } else {
      addProjectCard({ name: t('defaultProjectName', { index: 1 }) });
    }
  } catch (err) {
    console.error('Error loading configuration:', err);
    addProjectCard({ name: t('defaultProjectName', { index: 1 }) });
  }

  filterProjects();
});