import isset from './utils/isset.js';

const type = {
    prod: 'PROD-128.png',
    dev: 'DEV-128.png',
    default: 'ICON.png'
};

const getMatched = async (tabId) => {
    try {
        const result = await chrome.storage.sync.get(['prod', 'dev']);
        const tab = await (tabId 
            ? chrome.tabs.get(tabId)
            : chrome.tabs.query({ active: true, currentWindow: true }));
        
        if (!(result.prod && result.dev)) {
            return null;
        }

        let tabUrl = new URL(tab.url || tab.pendingUrl || tab[0]?.url || tab[0]?.pendingUrl);

        return Object.entries(result).find(([key, path]) => path === tabUrl.hostname);
    } catch (err) {
        console.error(err);
        return null;
    }
};

const init = async (tabId) => {
    let matched = await getMatched(tabId) || [];

    chrome.action.setIcon({ path: type[matched[0] ?? "default"]});
    chrome.action.setBadgeText(
        {
            tabId: tabId,
            text: matched[0] ?? "OFF"
        }
    );
};

const click = async (tab) => {
    let matched = await getMatched(tab.id) || [];
    let result = await chrome.storage.sync.get(['prod', 'dev']);
    if(!matched.length) {
        return isset(result.prod)
            ? chrome.tabs.create({ url: "https://" + result.prod })
            : false;
    }

    let choosedOne = Object.entries(result).find(([key, path]) => key !== matched[0]);
    let url = new URL(tab.url);
    url.hostname = choosedOne[1];

    if (!isset(url.hostname)) {
        return;
    }

    return chrome.tabs.update(tab.id, { url: url.toString() });
};

chrome.tabs.onActivated.addListener(({tabId}) => init(tabId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => 
    changeInfo?.status === 'complete' && init(tabId)
);
chrome.action.onClicked.addListener((tab) => click(tab));