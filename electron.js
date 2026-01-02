const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    resizable: true,
    fullscreen: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // Disable web security to allow loading local resources
    }
  });

  const startUrl = url.format({
    pathname: path.join(__dirname, 'dist/maze-game/browser/index.html'),
    protocol: 'file:',
    slashes: true
  });

  win.loadURL(startUrl);

  win.webContents.openDevTools();

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load page:', errorCode, errorDescription);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
