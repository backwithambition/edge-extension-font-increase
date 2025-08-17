# FontScaler Browser Extension

A browser extension that increases the font size of text on web pages.

## Features

- Increase font size of text below a specified threshold
- Choose between fixed size or multiplier methods
- Whitelist or blacklist domains
- Import and export settings

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

## Build Process

The extension uses a simple build process to prepare files for development and production.

### Development Build

For development, the build process simply copies files without minification:

```
npm run build:dev
```

This creates a `dist` directory with all the extension files. You can then load this directory as an unpacked extension in your browser:

1. Open Edge browser
2. Navigate to `edge://extensions/`
3. Enable "Developer mode" (toggle in the bottom-left)
4. Click "Load unpacked"
5. Select the `dist` directory

### Production Build

For production, the build process minifies JavaScript files and copies all necessary files:

```
npm run build
```

### Creating a Distribution Package

To create a zip file for submission to the Edge Add-ons store:

```
npm run package
```

This will:
1. Build the extension for production (minified)
2. Create a zip file (`extension.zip`) in the project root

## Testing

The project uses Jest for unit testing:

```
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
```

## Project Structure

- `src/` - Source code
  - `background.js` - Background service worker
  - `content.js` - Content script for modifying web pages
  - `popup.html/js` - UI for the extension
  - `utils/` - Utility functions
  - `manifest.json` - Extension configuration
  - `icons/` - Extension icons
- `__tests__/` - Test files
- `build.js` - Build script
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup file

## Build Script Details

The build script (`build.js`) handles the following tasks:

1. **JavaScript Processing**:
   - In development mode: Copies files as-is
   - In production mode: Minifies files using Terser

2. **Static Files**:
   - Copies manifest.json, popup.html, and icons without processing

3. **Packaging**:
   - Creates a zip file containing all built files

### Command Line Options

- `--dev`: Build for development (skip minification)
- `--package`: Create a zip file after building

## License

Private - All rights reserved