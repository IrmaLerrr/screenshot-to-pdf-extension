chrome.commands.onCommand.addListener((command) => {
  if (command === 'take-screenshot') {
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
      chrome.storage.local.get(['screenshots'], (result) => {
        const screenshots = result.screenshots || [];
        screenshots.push(dataUrl);
        chrome.storage.local.set({ screenshots });
      });
    });
  }
});