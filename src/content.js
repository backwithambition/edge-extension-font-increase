/**
 * Content script for the "FontScaler" extension
 * Handles:
 * - Increasing font size of text on the page
 * - Applying changes based on domain whitelist/blacklist
 * - Handling dynamic content loading
 */

// Debug function to log messages to the console with a prefix
function debugLog(message, data = null) {
	const prefix = '[FontScaler]';
	if (data) {
		console.log(prefix, message, data);
	} else {
		console.log(prefix, message);
	}
}

// Store original font sizes to allow toggling
const originalFontSizes = new Map();
debugLog(`CREATING NEW MAP`);

// Cleanup function to clear the Map and prevent memory leaks
function cleanupMemory() {
	debugLog(`Cleaning up memory - clearing ${originalFontSizes.size} stored font sizes`);
	originalFontSizes.clear();

	// ADDED: disconnect deep observers
	if (window.fontExtensionExtraObservers) {
		for (const obs of window.fontExtensionExtraObservers) {
			try { obs.disconnect(); } catch (_) {}
		}
		window.fontExtensionExtraObservers.clear?.();
	}
}

// Add event listeners for page unload events to cleanup memory
window.addEventListener('beforeunload', cleanupMemory);
window.addEventListener('pagehide', cleanupMemory);

// Also cleanup when the document is about to be unloaded
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'hidden') {
		// Page might be getting unloaded or suspended
		cleanupMemory();
	}
});

/* ===================== deep traversal helpers ===================== */

// Collect all traversal roots: main document, open ShadowRoots, and same-origin iframes
function getAllTraversalRoots() {
	const roots = new Set([document]);
	const queue = [document];

	while (queue.length) {
		const root = queue.shift();
		const scope = root instanceof Document || root instanceof ShadowRoot ? root : document;

		// Query descendants safely
		let nodes = [];
		try { nodes = scope.querySelectorAll('*'); } catch (_) {}

		for (const el of nodes) {
			// open shadow roots
			if (el.shadowRoot) {
				if (!roots.has(el.shadowRoot)) {
					roots.add(el.shadowRoot);
					queue.push(el.shadowRoot);
				}
			}
			// same-origin iframes
			if (el.tagName === 'IFRAME') {
				try {
					const doc = el.contentDocument || el.contentWindow?.document;
					if (doc && !roots.has(doc)) {
						roots.add(doc);
						queue.push(doc);
					}
				} catch (_) { /* cross-origin iframe -> ignore */ }
			}
		}
	}
	return [...roots];
}

// Create a list of text nodes across all roots (document, shadow DOMs, same-origin iframes)
function collectTextNodesDeep() {
	const results = [];
	for (const root of getAllTraversalRoots()) {
		const doc = root.ownerDocument || root; // Document for ShadowRoot, or the Document itself
		let walker;
		try {
			walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
		} catch (_) { continue; }

		let n;
		while ((n = walker.nextNode())) {
			if (n.nodeValue && n.nodeValue.trim().length > 0) {
				results.push(n);
			}
		}
	}
	return results;
}

// Observe mutations in shadow roots and same-origin iframes as they appear
const observedRoots = new WeakSet();
window.fontExtensionExtraObservers = window.fontExtensionExtraObservers || new Set();

function attachObserverToRoot(root) {
	if (observedRoots.has(root)) return;
	try {
		const obs = new MutationObserver(onMutationsDebounced);
		obs.observe(root, { childList: true, subtree: true });
		window.fontExtensionExtraObservers.add(obs);
		observedRoots.add(root);
	} catch (_) {}
}

function ensureDeepObservers() {
	for (const root of getAllTraversalRoots()) {
		attachObserverToRoot(root instanceof Document ? (root.body || root) : root);
	}
}
/* =================== end deep traversal helpers =================== */

// Main function to increase font size
function increaseFontSize(settings) {
	if (!settings) {
		debugLog('Extension is disabled or settings are missing');
		return;
	} else if (!settings.enabled) {
		debugLog('Extension is disabled, restoring original font sizes');

		// Iterate through all elements with stored original sizes
		for (const [element, originalSize] of originalFontSizes.entries()) {
			element.style.fontSize = `${originalSize}px`;
		}
		debugLog(`Restored original font sizes for ${originalFontSizes.size} elements`);
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
				return hostname.endsWith(domain.value) || hostname === domain.value;
			}
		});

		// Apply based on list type
		shouldApply = settings.listType === 'whitelist' ? matchesDomain : !matchesDomain;
	}

	if (!shouldApply) {
		return;
	}

	// ensure we also watch late/hydrated content in shadow DOM/iframes
	ensureDeepObservers();

	// Walk through all text nodes (document + shadow DOM + same-origin iframes) and apply font size changes
	const textNodes = collectTextNodesDeep();

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

		// Store original size if not already stored
		if (!originalFontSizes.has(parentElement)) {
			originalFontSizes.set(parentElement, currentSize);
		}

		// Apply font size change if below threshold
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
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
	if (message.action === 'settingsUpdated') {
		chrome.storage.local.get('settings', (result) => {
			if (result.settings) {
				increaseFontSize(result.settings);
			}
		});
	}
	return true;
});

function isExtensionContextValid() {
	try {
		return chrome && chrome.runtime && chrome.runtime.id;
	} catch (error) {
		return false;
	}
}

// Handle dynamically loaded content
let timeout;
function onMutationsDebounced() {
	clearTimeout(timeout);
	timeout = setTimeout(() => {
		if (!isExtensionContextValid()) {
			debugLog('Extension context invalidated, disconnecting observer');
			observer.disconnect();
			return;
		}

		// new roots may have appeared; observe them too
		ensureDeepObservers();

		// Process mutations after a delay
		try {
			chrome.storage.local.get('settings', (result) => {
				if (chrome.runtime.lastError) {
					debugLog('Error retrieving settings for dynamic content:', chrome.runtime.lastError);
					return;
				}

				if (result.settings && result.settings.enabled) {
					increaseFontSize(result.settings);
				}
			});
		} catch (error) {
			debugLog('Chrome API call failed:', error.message);
		}
	}, 100); // Debounce for 100 ms
}

const observer = new MutationObserver((_mutations) => onMutationsDebounced());

observer.observe(document.body, {
	childList: true,
	subtree: true
});

// also attach observers to existing deep roots at startup
ensureDeepObservers();

// Store reference for cleanup
window.fontExtensionObserver = observer;

// Add cleanup when page unloads
window.addEventListener('beforeunload', () => {
	if (window.fontExtensionObserver) {
		window.fontExtensionObserver.disconnect();
	}
	// disconnect deep observers as well
	if (window.fontExtensionExtraObservers) {
		for (const obs of window.fontExtensionExtraObservers) {
			try { obs.disconnect(); } catch (_) {}
		}
	}
});
