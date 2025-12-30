const path = require('path');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const http = require('http');
const url = require('url');

let mainWindow;
let oauthCallbackServer;
const REDIRECT_URI = 'http://localhost:8888/oauth/callback';

function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log('Preload path:', preloadPath);
    console.log('Preload file exists:', require('fs').existsSync(preloadPath));

    mainWindow = new BrowserWindow({
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
    //mainWindow.webContents.openDevTools();


    // Remove default menu (File, Edit, Window, Help)
    Menu.setApplicationMenu(null);

    mainWindow.loadFile('index.html');
}

// Setup OAuth callback server
function startOAuthCallbackServer() {
    return new Promise((resolve, reject) => {
        if (oauthCallbackServer) {
            resolve(REDIRECT_URI);
            return;
        }

        oauthCallbackServer = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            
            if (parsedUrl.pathname === '/oauth/callback') {
                const { code, error, error_description } = parsedUrl.query;
                
                if (error) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html>
                            <body style="font-family: sans-serif; padding: 40px; text-align: center;">
                                <h2 style="color: #d73a49;">Authentication Failed</h2>
                                <p>${error}: ${error_description || 'Unknown error'}</p>
                                <p>You can close this window.</p>
                            </body>
                        </html>
                    `);
                    mainWindow.webContents.send('oauth-error', { error, error_description });
                } else if (code) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html>
                            <body style="font-family: sans-serif; padding: 40px; text-align: center;">
                                <h2 style="color: #28a745;">Authentication Successful!</h2>
                                <p>You can close this window and return to the application.</p>
                            </body>
                        </html>
                    `);
                    mainWindow.webContents.send('oauth-callback', code);
                } else {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Invalid callback');
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not found');
            }
        });

        oauthCallbackServer.listen(8888, () => {
            console.log('OAuth callback server listening on port 8888');
            resolve(REDIRECT_URI);
        });

        oauthCallbackServer.on('error', (err) => {
            console.error('OAuth callback server error:', err);
            reject(err);
        });
    });
}

// Load salesforce module once at startup
const salesforce = require('./salesforce.js');

// Handle config operations
ipcMain.handle('set-config-file', async (event, configName) => {
    try {
        return salesforce.setConfigFile(configName);
    } catch (error) {
        console.error('Error setting config file:', error);
        return false;
    }
});

ipcMain.handle('list-configs', async (event) => {
    try {
        return salesforce.listConfigs();
    } catch (error) {
        console.error('Error listing configs:', error);
        return [];
    }
});

ipcMain.handle('get-current-config', async (event) => {
    try {
        return salesforce.getCurrentConfig();
    } catch (error) {
        console.error('Error getting current config:', error);
        return null;
    }
});

ipcMain.handle('requires-oauth', async (event) => {
    try {
        return salesforce.requiresOAuth();
    } catch (error) {
        console.error('Error checking OAuth requirement:', error);
        return false;
    }
});

ipcMain.handle('try-authenticate', async (event) => {
    try {
        return await salesforce.tryAuthenticate();
    } catch (error) {
        console.error('Error trying authentication:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('has-valid-token', async (event) => {
    try {
        return salesforce.hasValidToken();
    } catch (error) {
        console.error('Error checking token:', error);
        return false;
    }
});

// Handle OAuth flow initiation
ipcMain.handle('start-oauth-flow', async (event) => {
    try {
        // Debug: Check current config state
        const configState = salesforce.getCurrentConfig();
        console.log('OAuth flow - Current config state:', configState);
        
        if (!configState.currentConfigFile) {
            throw new Error('No configuration file selected. Please select an environment first.');
        }
        
        const redirectUri = await startOAuthCallbackServer();
        const authUrl = salesforce.getAuthorizationUrl(redirectUri);
        
        // Open in external browser
        await shell.openExternal(authUrl);
        
        return { success: true, redirectUri };
    } catch (error) {
        console.error('Error starting OAuth flow:', error);
        return { success: false, error: error.message };
    }
});

// Handle authorization code exchange
ipcMain.handle('exchange-auth-code', async (event, authCode, redirectUri) => {
    try {
        const tokenData = await salesforce.authenticateWithAuthCode(authCode, redirectUri);
        return { success: true, tokenData };
    } catch (error) {
        console.error('Error exchanging auth code:', error);
        return { success: false, error: error.message };
    }
});

// Handle SOQL execution
ipcMain.handle('execute-soql', async (event, query) => {
    try {
        return await salesforce.executeSOQL(query);
    } catch (error) {
        console.error('Error executing SOQL:', error);
        throw error;
    }
});

// Handle REST execution
ipcMain.handle('execute-rest', async (event, path) => {
    try {
        return await salesforce.executeREST(path);
    } catch (error) {
        console.error('Error executing REST:', error);
        throw error;
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
