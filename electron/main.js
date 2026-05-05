const { app, BrowserWindow, dialog } = require('electron');
const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

const PORT = 8000;
const BACKEND_URL = `http://127.0.0.1:${PORT}`;
let backendProcess = null;
let mainWindow = null;

function getBackendPath() {
  if (app.isPackaged) {
    // electron-builder: extraResources { to: "backend" } → resources/backend/
    return path.join(process.resourcesPath, 'backend', 'IPO_Mitra.exe');
  }
  return path.join(__dirname, '..', 'backend', 'dist', 'IPO_Mitra', 'IPO_Mitra.exe');
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  try {
    const logDir = app.getPath('userData');
    fs.appendFileSync(path.join(logDir, 'app.log'), line);
  } catch (_) {}
}

function startBackend() {
  const exePath = getBackendPath();
  log(`Starting backend: ${exePath}`);

  if (!fs.existsSync(exePath)) {
    log(`ERROR: Backend not found at ${exePath}`);
    dialog.showErrorBox('IPO Mitra', `Backend not found:\n${exePath}`);
    app.quit();
    return;
  }

  backendProcess = spawn(exePath, [], {
    cwd: path.dirname(exePath),
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProcess.stdout.on('data', (d) => log(`backend: ${d.toString().trim()}`));
  backendProcess.stderr.on('data', (d) => log(`backend err: ${d.toString().trim()}`));
  backendProcess.on('exit', (code) => {
    log(`Backend exited with code ${code}`);
    backendProcess = null;
  });
}

function waitForBackend(retries = 40, interval = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const req = http.get(`${BACKEND_URL}/api/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          log('Backend is ready');
          resolve();
        } else {
          retry();
        }
      });
      req.on('error', retry);
      req.setTimeout(2000, () => { req.destroy(); retry(); });
    };
    const retry = () => {
      attempts++;
      if (attempts >= retries) {
        reject(new Error(`Backend did not start after ${retries}s`));
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
}

const LOADING_HTML = `
<!DOCTYPE html>
<html><head><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#111; color:#fff; font-family:'Segoe UI',sans-serif;
         display:flex; align-items:center; justify-content:center; height:100vh; }
  .c { text-align:center; }
  .spinner { width:40px; height:40px; border:3px solid #333; border-top-color:#fff;
             border-radius:50%; animation:spin .8s linear infinite; margin:0 auto 24px; }
  @keyframes spin { to { transform:rotate(360deg); } }
  h2 { font-size:20px; font-weight:700; margin-bottom:8px; }
  p { font-size:13px; color:#888; }
</style></head><body>
<div class="c"><div class="spinner"></div><h2>IPO Mitra</h2><p>Starting up...</p></div>
</body></html>`;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'IPO Mitra',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    show: false,
    autoHideMenuBar: true,
  });

  // Show loading screen immediately
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(LOADING_HTML)}`);
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('closed', () => { mainWindow = null; });
}

function killBackend() {
  if (!backendProcess) return;
  log('Killing backend...');
  try {
    // Windows: taskkill with /T kills the entire process tree
    execSync(`taskkill /F /T /PID ${backendProcess.pid}`, { windowsHide: true });
  } catch (_) {
    try { backendProcess.kill(); } catch (_) {}
  }
  backendProcess = null;
}

app.whenReady().then(async () => {
  createWindow();   // show loading screen first
  startBackend();

  try {
    await waitForBackend(40, 1000);
    if (mainWindow) mainWindow.loadURL(BACKEND_URL);
  } catch (err) {
    log(`ERROR: ${err.message}`);
    if (mainWindow) {
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(
        `<html><body style="background:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center">
         <div><h2>Failed to start backend</h2><p style="color:#888;margin-top:12px">${err.message}</p></div></body></html>`
      )}`);
    }
  }
});

app.on('window-all-closed', () => {
  killBackend();
  app.quit();
});
