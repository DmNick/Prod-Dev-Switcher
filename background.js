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
            if(!(res.prod && res.dev)) {
                return null;
            }
            
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

const click = async (tab) => {
    let matched = await getMatched(tab.id) || [];
    if(!matched.length) {
        return;
    }

    let choosedOne = ['prod', 'dev'].find(key => key !== matched[0]);
    let reversed = await chrome.storage.sync.get([choosedOne]);
    let url = new URL(tab.url);
    url.hostname = reversed[choosedOne];

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