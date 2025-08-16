/**
 * Content script for Edge Increase Font extension
 * Handles:
 * - Increasing font size of text on the page
 * - Applying changes based on domain whitelist/blacklist
 * - Handling dynamic content loading
 */

// Debug function to log messages to console with a prefix
function debugLog(message, data = null) {
  const prefix = '[Font Extension]';
  if (data) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

// Store original font sizes to allow toggling
const originalFontSizes = new Map();

// Main function to increase font size
function increaseFontSize(settings) {
  if (!settings) {
    debugLog('Extension is disabled or settings are missing');
    return;
  } else if (!settings.enabled) {
    debugLog('Extension is disabled, restoring original font sizes');
    return;
  }

  // Check if current domain is in whitelist/blacklist
  const currentUrl = window.location.href;
  const hostname = window.location.hostname;

  // Determine if we should apply changes based on domain lists
  let shouldApply = true;

  if (settings.domains && settings.domains.length > 0) {
    const matchesDomain = settings.domains.some(domain => {
      if (domain.isRegex) {
        try {
          const regex = new RegExp(domain.value);
          return regex.test(currentUrl);
        } catch (e) {
          console.error('Invalid regex:', domain.value, e);
          return false;
        }
      } else {
        return hostname.startsWith(domain.value) || hostname === domain.value;
      }
    });

    shouldApply = settings.listType === 'whitelist' ? matchesDomain : !matchesDomain;
  }

  if (!shouldApply) {
    return;
  }

  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    if (node.nodeValue.trim().length > 0) {
      textNodes.push(node);
    }
  }

  let changedNodes = 0;
  let skippedNodes = 0;
  let thresholdSkipped = 0;

  textNodes.forEach(textNode => {
    const parentElement = textNode.parentElement;
    if (!parentElement || ['SCRIPT', 'STYLE'].includes(parentElement.tagName)) {
      skippedNodes++;
      return;
    }

    const computedStyle = window.getComputedStyle(parentElement);
    const currentSize = parseFloat(computedStyle.fontSize);

    if (!originalFontSizes.has(parentElement)) {
      originalFontSizes.set(parentElement, currentSize);
    }

    if (currentSize < settings.threshold) {
      let newSize;
      if (settings.increaseMethod.type === 'fixed') {
        newSize = settings.increaseMethod.value;
      } else {
        newSize = currentSize * settings.increaseMethod.value;
      }
      parentElement.style.fontSize = `${newSize}${settings.increaseMethod.unit}`;
      changedNodes++;
    } else {
      thresholdSkipped++;
    }
  });

  debugLog(`Font processing complete. Modified: ${changedNodes} elements`);
}

// Initialize and listen for settings changes
chrome.storage.local.get('settings', (result) => {
  if (chrome.runtime.lastError) {
    debugLog('Error retrieving settings:', chrome.runtime.lastError);
    return;
  }

  if (result.settings) {
    increaseFontSize(result.settings);
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'settingsUpdated') {
    chrome.storage.local.get('settings', (result) => {
      if (result.settings) {
        increaseFontSize(result.settings);
      }
    });
  }
  return true;
});

// Handle dynamically loaded content
const observer = new MutationObserver((mutations) => {
  chrome.storage.local.get('settings', (result) => {
    if (result.settings && result.settings.enabled) {
      increaseFontSize(result.settings);
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});