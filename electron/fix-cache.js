/**
 * Pre-populates the electron-builder winCodeSign cache to work around
 * the "Cannot create symbolic link" error on non-Developer-Mode Windows.
 * 
 * The archive contains 2 macOS symlinks that fail on standard Windows,
 * but all Windows-needed files extract fine. We extract with errors ignored,
 * then create a marker so electron-builder considers the cache valid.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CACHE_DIR = path.join(process.env.LOCALAPPDATA, 'electron-builder', 'Cache', 'winCodeSign');
const VERSION = 'winCodeSign-2.6.0';
const URL = `https://github.com/electron-userland/electron-builder-binaries/releases/download/${VERSION}/${VERSION}.7z`;

// Check if already cached
const versionDir = path.join(CACHE_DIR, VERSION);
if (fs.existsSync(versionDir)) {
  console.log(`winCodeSign cache already exists at ${versionDir}`);
  process.exit(0);
}

// Find 7za.exe from electron-builder's 7zip-bin
let sevenZip;
try {
  sevenZip = require('7zip-bin').path7za;
} catch {
  // Fallback: look in node_modules
  const fallback = path.join(__dirname, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');
  if (fs.existsSync(fallback)) {
    sevenZip = fallback;
  } else {
    console.error('7zip-bin not found. Run npm install first.');
    process.exit(1);
  }
}

console.log(`Downloading ${VERSION}...`);
fs.mkdirSync(CACHE_DIR, { recursive: true });
const archivePath = path.join(CACHE_DIR, `${VERSION}.7z`);

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (url) => {
      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
    };
    follow(url);
  });
}

(async () => {
  try {
    await download(URL, archivePath);
    console.log('Downloaded. Extracting (ignoring macOS symlink errors)...');

    // Extract, ignoring the exit code (2 = symlink errors for darwin files)
    try {
      execSync(`"${sevenZip}" x -bd -y "${archivePath}" "-o${versionDir}"`, {
        stdio: 'pipe',
        windowsHide: true,
      });
    } catch (e) {
      // Exit code 2 = "sub items errors" (the 2 macOS symlinks). Windows files are fine.
      if (e.status === 2) {
        console.log('Extracted with expected macOS symlink warnings (harmless on Windows).');
      } else {
        throw e;
      }
    }

    // Clean up archive
    fs.unlinkSync(archivePath);
    console.log(`winCodeSign cache ready at ${versionDir}`);
  } catch (err) {
    console.error('Failed to prepare winCodeSign cache:', err.message);
    process.exit(1);
  }
})();
