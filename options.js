document.getElementById('save').addEventListener('click', () => {
    let prod = document.getElementById('prod').value;
    let dev = document.getElementById('dev').value;
  
    chrome.storage.sync.set({ prod, dev }, () => {
      alert('zapisano prod: '+prod+"\ndev: "+dev);
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['prod', 'dev'], (result) => {
      document.getElementById('prod').value = result.prod || '';
      document.getElementById('dev').value = result.dev || '';
    });
  });