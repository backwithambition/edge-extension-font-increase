The project is about an Edge extension that increases the font size of text on a page.
I am going to outline the core functionality of the extension in a single document.

### Core Functionality (Text Size Increase)

- **Threshold:** Default 9px, configurable globally via input.
- **Increase Method:** Fixed size only (no multiplier). Unit choice: em/rem/px dropdown.
- **Text Selection:** Enlarge all displayed text nodes (DOM walk), including dynamic/lazy-loaded content.
- **Style Application:** Use most effective approach (e.g., injected CSS + inline if needed); respect and skip !
  important styles.
- **Edge Cases:** Ignore non-text (e.g., icons/binaries); apply changes to late-loading/variable fonts where possible.

### Domain Differentiation (Whitelist/Blacklist)

- **Mode:** Toggle between whitelist (apply only on matches) or blacklist (apply except on matches)—not both at once.
- **Regex Input:** Per-domain checkbox to treat as regex; no upfront validation, but handle errors in UI.
- **Matching:** Non-regex matches URL start (e.g., "example.com" hits "example.com/path" but not "sub.example.com"
  unless specified); full URL for regex.
- **Default:** Apply changes everywhere if no lists defined.

### Storage and Data Management

- **Data Structure:** Store as JSON-like object: enabled state (bool), threshold (num), increase method (obj with
  type/unit/value), list type (white/black), domains array (each with string + isRegex bool).
- **API:** chrome.storage.local only; no sync.
- **Extras:** No additional settings for v1.

### Export Functionality

- **Frequency:** Manual button for immediate export; dropdown for auto (weekly/monthly)—trigger via background script
  timer.
- **Import:** Button to load JSON file, overriding all settings (ignore unknown keys).
- **File Details:** JSON format, named "extension-settings-YYMMDD.json" (e.g., "extension-settings-250816.json"); all
  data included, empty object if no data.
- **Handling:** Use chrome.downloads; no special OS perms/notifications.

### User Interface and Usability

- **Settings Input:** Browser action popup with forms (inputs, dropdowns, checkboxes, toggles).
- **Controls:** Global enable/disable toggle (real-time effect on current tab); no per-domain toggles or preview.
- **Validation/Feedback:** Show UI errors (e.g., invalid regex on apply, non-numeric threshold).
- **Accessibility:** No integration with browser/system settings.

### Extension Structure and Technical Details

- **Activation:** Content script on tab load (match: "<all_urls>").
- **Permissions:** Minimal: "storage", "downloads", "activeTab", "scripting" if needed for injection.
- **Testing/Versioning:** No specific Edge version; no data migrations (ignore unknown import keys).
- **Security:** Limit regex features (e.g., no catastrophic backtracking via safe patterns); add timeouts/safeguards.
- **Dependencies/Issues:** Vanilla JS (ES6+ fine); for CSP blocks, change extension icon color (e.g., grayed out) as
  fallback indicator.
