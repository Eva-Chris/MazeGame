const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['*']
      }
    });
  });
  createWindow();
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    resizable: true,
    fullscreen: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  win.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

  const startUrl = url.format({
    pathname: path.join(__dirname, 'dist/maze-game/browser/index.html'),
    protocol: 'file:',
    slashes: true
  });

  win.loadURL(startUrl);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
