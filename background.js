/* global chrome */

const ICONS = {
  prod: 'icons/PROD-128.png',
  dev: 'icons/DEV-128.png',
  default: 'icons/ICON.png'
};

const BADGE_COLORS = {
  prod: '#E53935', // Red
  dev: '#1E88E5'   // Blue
};

const parseUrl = (rawUrl) => {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
};

const getTab = async (tabId) => {
  if (typeof tabId === 'number') {
    try {
      return await chrome.tabs.get(tabId);
    } catch {
      return null;
    }
  }
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return activeTab || null;
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
        name: 'Main Project',
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

const getMatched = async (tabId, existingTab = null) => {
  try {
    const rules = await getRules();
    const tab = existingTab || await getTab(tabId);
    const rawUrl = tab?.url || tab?.pendingUrl;
    const tabUrl = parseUrl(rawUrl);

    if (!rules.length || !tabUrl) {
      return { matched: null, rule: null, tab, tabUrl, rulesCount: rules.length };
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
          tab,
          tabUrl,
          rulesCount: rules.length
        };
      }

      if (devUrl && devUrl.host.toLowerCase() === currentHost) {
        return {
          matched: 'dev',
          rule,
          targetEnv: 'prod',
          targetBase: prodUrl,
          tab,
          tabUrl,
          rulesCount: rules.length
        };
      }
    }

    return { matched: null, rule: null, tab, tabUrl, rulesCount: rules.length };
  } catch (err) {
    console.error('getMatched error:', err);
    return { matched: null, rule: null, tab: null, tabUrl: null, rulesCount: 0 };
  }
};

const init = async (tabId, existingTab = null) => {
  if (typeof tabId !== 'number') return;

  const matchResult = await getMatched(tabId, existingTab);
  const { matched, rule, targetEnv, targetBase, rulesCount } = matchResult;

  const langRes = await chrome.storage.sync.get(['lang']).catch(() => ({}));
  const isPl = langRes?.lang === 'pl';

  if (matched && rule && targetBase) {
    const badgeText = matched.toUpperCase();
    const iconPath = ICONS[matched] || ICONS.default;
    const projectName = rule.name ? `[${rule.name}] ` : '';
    const tooltip = isPl
      ? `${projectName}Przełącz na ${targetEnv.toUpperCase()} (${targetBase.origin})`
      : `${projectName}Switch to ${targetEnv.toUpperCase()} (${targetBase.origin})`;

    await chrome.action.setIcon({ tabId, path: iconPath }).catch(() => {});
    await chrome.action.setBadgeText({ tabId, text: badgeText }).catch(() => {});
    await chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLORS[matched] }).catch(() => {});
    if (chrome.action.setBadgeTextColor) {
      await chrome.action.setBadgeTextColor({ tabId, color: '#FFFFFF' }).catch(() => {});
    }
    await chrome.action.setTitle({ tabId, title: tooltip }).catch(() => {});
  } else {
    await chrome.action.setIcon({ tabId, path: ICONS.default }).catch(() => {});
    await chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});

    let tooltip = '';
    if (isPl) {
      tooltip = rulesCount > 0
        ? 'Prod-Dev Switcher (Kliknij, aby wyświetlić zapisane projekty)'
        : 'Prod-Dev Switcher (Kliknij, aby skonfigurować projekty w ustawieniach)';
    } else {
      tooltip = rulesCount > 0
        ? 'Prod-Dev Switcher (Click to view saved projects)'
        : 'Prod-Dev Switcher (Click to configure projects in settings)';
    }
    await chrome.action.setTitle({ tabId, title: tooltip }).catch(() => {});
  }

  // Ensure popup is set to open every time on all tabs
  await chrome.action.setPopup({ tabId, popup: 'popup.html' }).catch(() => {});
};

const click = async (tab) => {
  try {
    const matchResult = await getMatched(tab?.id, tab);
    const { matched, targetBase, tabUrl, rulesCount } = matchResult;

    // If no projects configured or current tab doesn't match any project
    if (rulesCount === 0 || !matched || !targetBase) {
      if (chrome.action?.openPopup) {
        try {
          await chrome.action.openPopup();
          return;
        } catch {}
      }
      return chrome.runtime.openOptionsPage();
    }

    const currentUrl = tabUrl || new URL(tab.url || tab.pendingUrl);
    const newUrl = new URL(targetBase.href);

    newUrl.pathname = currentUrl.pathname;
    newUrl.search = currentUrl.search;
    newUrl.hash = currentUrl.hash;

    await chrome.tabs.update(tab.id, { url: newUrl.toString() });
  } catch (err) {
    console.error('click error:', err);
  }
};

chrome.tabs.onActivated.addListener(({ tabId }) => {
  init(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    init(tabId, tab);
  }
});

// Fallback if popup is cleared or disabled
chrome.action.onClicked.addListener((tab) => {
  click(tab);
});

// Keyboard shortcut listener (Alt+Shift+S)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle_env') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await click(tab);
    }
  }
});

// Message listener for popup or background requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === 'toggle_tab') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          await click(tab);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No active tab' });
        }
      } catch (err) {
        console.error('toggle_tab error:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});

// Immediately update all tabs when projects change in settings
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab?.id) init(tab.id, tab);
      });
    });
  }
});

// Initialize all open tabs on extension startup or update
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab?.id) init(tab.id, tab);
    });
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab?.id) init(tab.id, tab);
    });
  });
});
