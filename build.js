/**
 * Build script for the FontScaler browser extension
 * 
 * This script:
 * 1. Minifies JavaScript files
 * 2. Copies all necessary files to a dist directory
 * 3. Creates a zip file for distribution if the --package flag is provided
 * 4. Skips minification if the --dev flag is provided
 * 
 * Usage:
 *   npm run build         - Build for production (minified)
 *   npm run build:dev     - Build for development (not minified)
 *   npm run package       - Build for production and create a zip file
 */

const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');
const archiver = require('archiver');

// Parse command line arguments
const args = process.argv.slice(2);
const isDev = args.includes('--dev');
const shouldPackage = args.includes('--package');

// Paths
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');
const zipPath = path.join(__dirname, 'extension.zip');

// Files to process
const jsFiles = [
  'background.js',
  'content.js',
  'popup.js',
  'utils/fontUtils.js'
];

// Files to copy without processing
const staticFiles = [
  'manifest.json',
  'popup.html',
  'icons'
];

// Ensure dist directory exists
fs.ensureDirSync(distDir);

// Process JavaScript files
async function processJsFiles() {
  console.log(`Processing JavaScript files (${isDev ? 'development' : 'production'} mode)...`);
  
  for (const file of jsFiles) {
    const srcPath = path.join(srcDir, file);
    const distPath = path.join(distDir, file);
    
    // Ensure directory exists
    fs.ensureDirSync(path.dirname(distPath));
    
    if (isDev) {
      // In dev mode, just copy the file
      fs.copyFileSync(srcPath, distPath);
      console.log(`Copied: ${file}`);
    } else {
      // In production mode, minify the file
      const code = fs.readFileSync(srcPath, 'utf8');
      try {
        const minified = await minify(code, {
          compress: {
            drop_console: false, // Keep console logs for debugging
            drop_debugger: true
          },
          mangle: true,
          output: {
            comments: false
          }
        });
        
        fs.writeFileSync(distPath, minified.code);
        console.log(`Minified: ${file}`);
      } catch (err) {
        console.error(`Error minifying ${file}:`, err);
        // Fall back to copying the file
        fs.copyFileSync(srcPath, distPath);
        console.log(`Copied (fallback): ${file}`);
      }
    }
  }
}

// Copy static files
function copyStaticFiles() {
  console.log('Copying static files...');
  
  for (const file of staticFiles) {
    const srcPath = path.join(srcDir, file);
    const distPath = path.join(distDir, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      // If it's a directory, copy recursively
      fs.copySync(srcPath, distPath);
      console.log(`Copied directory: ${file}`);
    } else {
      // If it's a file, copy directly
      fs.copyFileSync(srcPath, distPath);
      console.log(`Copied: ${file}`);
    }
  }
}

// Create a zip file for distribution
function createZipFile() {
  console.log('Creating zip file...');
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    output.on('close', () => {
      console.log(`Zip file created: ${zipPath} (${archive.pointer()} bytes)`);
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    archive.directory(distDir, false);
    archive.finalize();
  });
}

// Main build process
async function build() {
  console.log('Starting build process...');
  
  try {
    await processJsFiles();
    copyStaticFiles();
    
    if (shouldPackage) {
      await createZipFile();
    }
    
    console.log('Build completed successfully!');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

// Run the build
build();