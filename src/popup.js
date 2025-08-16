/**
 * Popup script for Edge Increase Font extension
 * Handles:
 * - UI interactions
 * - Settings management
 * - Import/export functionality
 */

// DOM elements
const enabledToggle = document.getElementById('enabled');
const thresholdInput = document.getElementById('threshold');
const increaseTypeSelect = document.getElementById('increase-type');
const increaseValueInput = document.getElementById('increase-value');
const unitSelect = document.getElementById('unit');
const listTypeSelect = document.getElementById('list-type');
const domainList = document.getElementById('domain-list');
const newDomainInput = document.getElementById('new-domain');
const isRegexCheckbox = document.getElementById('is-regex');
const addDomainButton = document.getElementById('add-domain');
const exportButton = document.getElementById('export');
const importButton = document.getElementById('import');
const importFileInput = document.getElementById('import-file');

// Error elements
const thresholdError = document.getElementById('threshold-error');
const valueError = document.getElementById('value-error');
const domainError = document.getElementById('domain-error');

// Load settings when popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('settings', (result) => {
    const settings = result.settings || {};
    
    // Populate form with current settings
    enabledToggle.checked = settings.enabled !== false;
    thresholdInput.value = settings.threshold || 9;
    
    if (settings.increaseMethod) {
      increaseTypeSelect.value = settings.increaseMethod.type || 'fixed';
      increaseValueInput.value = settings.increaseMethod.value || 16;
      unitSelect.value = settings.increaseMethod.unit || 'px';
    }
    
    listTypeSelect.value = settings.listType || 'blacklist';
    
    // Populate domain list
    if (settings.domains && Array.isArray(settings.domains)) {
      settings.domains.forEach(domain => {
        addDomainToList(domain.value, domain.isRegex);
      });
    }
  });
});

// Save settings and update content script
function saveSettings() {
  // Validate inputs
  let isValid = true;
  
  // Validate threshold
  const threshold = parseFloat(thresholdInput.value);
  if (isNaN(threshold) || threshold < 1) {
    thresholdError.textContent = 'Please enter a valid number (min: 1)';
    isValid = false;
  } else {
    thresholdError.textContent = '';
  }
  
  // Validate increase value
  const increaseValue = parseFloat(increaseValueInput.value);
  if (isNaN(increaseValue) || increaseValue < 0.1) {
    valueError.textContent = 'Please enter a valid number (min: 0.1)';
    isValid = false;
  } else {
    valueError.textContent = '';
  }
  
  if (!isValid) {
    return;
  }
  
  // Collect domains from UI
  const domains = [];
  const domainItems = domainList.querySelectorAll('.domain-item');
  domainItems.forEach(item => {
    domains.push({
      value: item.dataset.domain,
      isRegex: item.dataset.regex === 'true'
    });
  });
  
  // Create settings object
  const settings = {
    enabled: enabledToggle.checked,
    threshold: threshold,
    increaseMethod: {
      type: increaseTypeSelect.value,
      unit: unitSelect.value,
      value: increaseValue
    },
    listType: listTypeSelect.value,
    domains: domains
  };
  
  // Save to storage
  chrome.storage.local.set({ settings }, () => {
    // Notify content scripts of the update
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'settingsUpdated' });
      }
    });
  });
}

// Add domain to the list
function addDomainToList(domain, isRegex) {
  if (!domain) {
    domainError.textContent = 'Please enter a domain';
    return;
  }
  
  // Create domain item
  const item = document.createElement('div');
  item.className = 'domain-item';
  item.dataset.domain = domain;
  item.dataset.regex = isRegex;
  
  // Domain text
  const text = document.createElement('span');
  text.textContent = `${domain} ${isRegex ? '(regex)' : ''}`;
  item.appendChild(text);
  
  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'X';
  removeBtn.style.padding = '2px 5px';
  removeBtn.addEventListener('click', () => {
    item.remove();
    saveSettings();
  });
  item.appendChild(removeBtn);
  
  domainList.appendChild(item);
  domainError.textContent = '';
  
  // Clear input
  newDomainInput.value = '';
  isRegexCheckbox.checked = false;
  
  saveSettings();
}

// Event listeners
enabledToggle.addEventListener('change', saveSettings);
thresholdInput.addEventListener('change', saveSettings);
increaseTypeSelect.addEventListener('change', saveSettings);
increaseValueInput.addEventListener('change', saveSettings);
unitSelect.addEventListener('change', saveSettings);
listTypeSelect.addEventListener('change', saveSettings);

addDomainButton.addEventListener('click', () => {
  addDomainToList(newDomainInput.value, isRegexCheckbox.checked);
});

// Export settings
exportButton.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'exportSettings', auto: false });
});

// Import settings
importButton.addEventListener('click', () => {
  importFileInput.click();
});

importFileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const settings = JSON.parse(e.target.result);
      chrome.storage.local.set({ settings }, () => {
        // Reload popup to show new settings
        window.location.reload();
      });
    } catch (error) {
      alert('Invalid settings file');
    }
  };
  reader.readAsText(file);
});