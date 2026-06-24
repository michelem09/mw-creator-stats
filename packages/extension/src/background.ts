// MV3 service worker: clicking the toolbar icon opens the dashboard as a full-page tab.
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});
