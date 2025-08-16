/**
 * Background script for Edge Increase Font extension
 * Handles:
 * - Auto-export functionality
 * - Communication between popup and content scripts
 * - Storage management
 */

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  threshold: 9,
  increaseMethod: {
    type: 'fixed', // 'fixed' or 'multiplier'
    unit: 'px',    // 'px', 'em', or 'rem'
    value: 16
  },
  listType: 'blacklist', // 'whitelist' or 'blacklist'
  domains: []
};

// Initialize settings when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('settings', (result) => {
    if (!result.settings) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    }
  });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'exportSettings') {
    exportSettings(message.auto);
  }
  return true;
});

// Export settings to a JSON file
function exportSettings(auto = false) {
  chrome.storage.local.get('settings', (result) => {
    const settings = result.settings || {};
    const date = new Date();
    const fileName = `extension-settings-${date.getFullYear().toString().substr(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}.json`;
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: fileName,
      saveAs: !auto
    });
  });
}