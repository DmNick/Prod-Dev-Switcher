// document.addEventListener('DOMContentLoaded', () => {
    // chrome.storage.sync.get(['prod', 'dev'], (result) => {
    //     const type = {
    //         prod: 'PROD-128.png',
    //         dev: 'DEV-128.png'
    //     };
    
    //   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //     let tab = tabs[0];
    //     let url = new URL(tab.url);

        

    //     let isValid = Object.entries(result).find(([key,link]) => url.hostname === link);
    //     if (!isValid) {
    //         window.close();
    //         return;
    //     }

    //     url.hostname = url.hostname === result.prod
    //         ? chrome.action.setIcon({ path: type.dev}) && result.dev
    //         : chrome.action.setIcon({ path: type.prod}) && result.prod;
    
    //     chrome.tabs.update(tab.id, { url: url.toString() });
    //     window.close();
    //   });
    // });
// });