/**
 * Content script for Edge Increase Font extension
 * Handles:
 * - Increasing font size of text on the page
 * - Applying changes based on domain whitelist/blacklist
 * - Handling dynamic content loading
 */

// Store original font sizes to allow toggling
const originalFontSizes = new WeakMap();

// Main function to increase font size
function increaseFontSize(settings) {
  if (!settings || !settings.enabled) {
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
        // Non-regex matches URL start
        return hostname.startsWith(domain.value) || hostname === domain.value;
      }
    });
    
    // Apply based on list type
    shouldApply = settings.listType === 'whitelist' ? matchesDomain : !matchesDomain;
  }
  
  if (!shouldApply) {
    return;
  }
  
  // Walk through all text nodes and apply font size changes
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
  
  textNodes.forEach(textNode => {
    const parentElement = textNode.parentElement;
    if (!parentElement) return;
    
    // Skip if parent is a script or style tag
    if (['SCRIPT', 'STYLE'].includes(parentElement.tagName)) {
      return;
    }
    
    const computedStyle = window.getComputedStyle(parentElement);
    const currentSize = parseFloat(computedStyle.fontSize);
    
    // Store original size if not already stored
    if (!originalFontSizes.has(parentElement)) {
      originalFontSizes.set(parentElement, currentSize);
    }
    
    // Apply font size change if below threshold
    if (currentSize < settings.threshold) {
      let newSize;
      
      if (settings.increaseMethod.type === 'fixed') {
        newSize = settings.increaseMethod.value;
      } else { // multiplier
        newSize = currentSize * settings.increaseMethod.value;
      }
      
      parentElement.style.fontSize = `${newSize}${settings.increaseMethod.unit}`;
    }
  });
}

// Initialize and listen for settings changes
chrome.storage.local.get('settings', (result) => {
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