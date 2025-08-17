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
			chrome.storage.local.set({settings: DEFAULT_SETTINGS});
		}
	});
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
	console.log('EXPORT received message');
	if (message.action === 'exportSettings') {
		exportSettings(message.auto);
	}
	return true;
});
console.log('☑ EXPORT added listener to runtime');

// Export settings to a JSON file using data URL
function exportSettings(auto = false) {
	chrome.storage.local.get('settings', (result) => {
		const settings = result.settings || {};
		const date = new Date();
		const fileName = `extension-settings-${date.getFullYear().toString().substr(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}.json`;

		// Create data URL instead of blob URL
		const jsonData = JSON.stringify(settings, null, 2);
		const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData);

		chrome.downloads.download({
			url: dataUrl,
			filename: fileName,
			saveAs: !auto
		}, (downloadId) => {
			if (chrome.runtime.lastError) {
				console.error('Download failed:', chrome.runtime.lastError);
			} else {
				console.log('Export successful, download ID:', downloadId);
			}
		});
	});
}