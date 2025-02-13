import isset from './utils/isset.js';

const type = {
    prod: 'PROD-128.png',
    dev: 'DEV-128.png',
    default: 'ICON.png'
};

const getMatched = (tabId) => {
    const result = chrome.storage.sync.get(['prod', 'dev']);
    const tab = tabId 
        ? chrome.tabs.get(tabId)
        : chrome.tabs.query({ active: true, currentWindow: true });


    return Promise.all([result, tab])
        .then(([res, tab]) => {
            let tabUrl = new URL(isset(tab.url) 
                ?? isset(tab.pendingUrl) 
                ?? isset(tab[0].url) 
                ?? isset(tab[0].pendingUrl)
            );

            return Object.entries(res).find(([key, path]) => path === tabUrl.hostname);
        })
        .catch(err => {
            console.error(err);

            return null;
        });
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

chrome.tabs.onActivated.addListener(async ({tabId}) => init(tabId));
chrome.tabs.onUpdated.addListener(async ({tabId}) => init(tabId));

chrome.action.onClicked.addListener(async (tab) => {
    const result = await chrome.storage.sync.get(['prod', 'dev']);
    let url = new URL(tab.url);

    let isMatched = Object.entries(result).find(([key, path]) => path === url.hostname);
    if (!isMatched) {
        chrome.tabs.create({ url: "https://" + result.prod });

        return;
    }
    
    let reversed = Object.entries(result).find(([key, path]) => path !== url.hostname);
    url.hostname = chrome.action.setIcon({ path: type[reversed[0]]}) && result[reversed[0]];
    if (!url.hostname || url.hostname === 'null' || url.hostname === '') {
        return;
    }

    chrome.tabs.update(tab.id, { url: url.toString() });
});