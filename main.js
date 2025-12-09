const path = require('path');
const { app, BrowserWindow, Menu } = require('electron'); // <-- add Menu

function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log('Preload path:', preloadPath);
    console.log('Preload file exists:', require('fs').existsSync(preloadPath));

    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
            sandbox: false
        }
    });

    // Open DevTools automatically
   // win.webContents.openDevTools();


    // Remove default menu (File, Edit, Window, Help)
    Menu.setApplicationMenu(null);

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
