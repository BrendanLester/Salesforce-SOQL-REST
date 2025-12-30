const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');

try {
    // All operations now go through IPC to main process
    // This ensures we're using the same salesforce.js module instance
    contextBridge.exposeInMainWorld('api', {
        executeSOQL: (query) => ipcRenderer.invoke('execute-soql', query),
        executeREST: (path) => ipcRenderer.invoke('execute-rest', path),
        setConfigFile: (configName) => ipcRenderer.invoke('set-config-file', configName),
        listConfigs: () => ipcRenderer.invoke('list-configs'),
        getCurrentConfig: () => ipcRenderer.invoke('get-current-config'),
        requiresOAuth: () => ipcRenderer.invoke('requires-oauth'),
        tryAuthenticate: () => ipcRenderer.invoke('try-authenticate'),
        hasValidToken: () => ipcRenderer.invoke('has-valid-token'),
        
        // OAuth flow functions
        startOAuthFlow: () => ipcRenderer.invoke('start-oauth-flow'),
        exchangeAuthCode: (authCode, redirectUri) => ipcRenderer.invoke('exchange-auth-code', authCode, redirectUri),
        onOAuthCallback: (callback) => ipcRenderer.on('oauth-callback', (event, code) => callback(code)),
        onOAuthError: (callback) => ipcRenderer.on('oauth-error', (event, error) => callback(error))
    });

    console.log('API exposed successfully via contextBridge - all operations via IPC');
} catch (error) {
    console.error('Error in preload script:', error);
    console.error('Error stack:', error.stack);
}