# Edge Increase Font Extension - Development Guidelines

This document provides essential information for developers working on the Edge Increase Font browser extension.

## Build and Configuration Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Initial Setup
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Development Build
The extension uses a simple structure without a build process for development:
1. Open Edge browser
2. Navigate to `edge://extensions/`
3. Enable "Developer mode" (toggle in the bottom-left)
4. Click "Load unpacked"
5. Select the project's `src` directory

### Production Build
For production deployment:
1. Create a zip file containing the contents of the `src` directory
2. Submit to the Edge Add-ons store

## Testing Information

### Test Configuration
The project uses Jest for unit testing:
- Test files are located in the `__tests__` directory
- Browser APIs are mocked in `jest.setup.js`
- Configuration is in `jest.config.js`

### Running Tests
Execute tests with npm:
```
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
```

### Adding New Tests
1. Create test files in the `__tests__` directory with the naming pattern `*.test.js`
2. For component tests, use the JSDOM environment (already configured)
3. For testing browser extension APIs, use the mocks provided in `jest.setup.js`

### Example Test
Here's a simple test for the font utilities:

```javascript
const { calculateNewFontSize } = require('../src/utils/fontUtils');

describe('Font Utilities', () => {
  test('should calculate font size correctly', () => {
    const result = calculateNewFontSize(12, { 
      type: 'multiplier', 
      value: 1.5, 
      unit: 'px' 
    });
    expect(result).toBe('18px');
  });
});
```

### Manual Testing
For manual testing of the extension:
1. Load the extension in developer mode as described in the Development Build section
2. Test on various websites with different font sizes
3. Verify domain whitelist/blacklist functionality
4. Test the import/export functionality

## Extension Structure

### Key Files and Directories
- `manifest.json` - Extension configuration
- `background.js` - Background service worker
- `content.js` - Content script for modifying web pages
- `popup.html/js` - UI for the extension
- `utils/` - Utility functions

### Code Style Guidelines
- Use modern JavaScript (ES6+) features
- Follow consistent indentation (2 spaces)
- Add JSDoc comments for functions
- Handle errors gracefully, especially for regex operations
- Use descriptive variable and function names

### Debugging Tips
1. Background script debugging:
   - Open `edge://extensions`
   - Find the extension and click "background page" under "Inspect views"

2. Content script debugging:
   - Open DevTools on any page where the extension is active
   - Navigate to the "Sources" tab
   - Look for content scripts under "Content scripts" in the file tree

3. Storage inspection:
   - In the background page DevTools
   - Run in console: `chrome.storage.local.get(null, console.log)`

## Security Considerations
- Validate all user inputs, especially regex patterns
- Implement timeouts for regex operations to prevent catastrophic backtracking
- Use content security policy in the manifest
- Be cautious when injecting styles to avoid breaking page layouts

## Performance Optimization
- Use efficient DOM traversal methods
- Debounce operations on dynamically loaded content
- Cache computed styles where possible
- Use MutationObserver efficiently by batching updates