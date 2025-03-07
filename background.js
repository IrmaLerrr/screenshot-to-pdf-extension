chrome.commands.onCommand.addListener((command) => {
  if (command === 'take-screenshot') {
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
      chrome.runtime.sendMessage({ 
        action: 'add-screenshot', 
        dataUrl: dataUrl 
      });
    });
  }
});