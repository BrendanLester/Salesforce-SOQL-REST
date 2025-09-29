const { contextBridge } = require('electron');

console.log('Test preload script starting...');

try {
    console.log('About to require salesforce.js...');
    const salesforce = require('./salesforce.js');
    console.log('salesforce.js loaded, available exports:', Object.keys(salesforce));
    
    const { executeSOQL, executeREST, setConfigFile, listConfigs } = salesforce;
    
    console.log('executeSOQL:', typeof executeSOQL);
    console.log('setConfigFile:', typeof setConfigFile); 
    console.log('listConfigs:', typeof listConfigs);

    contextBridge.exposeInMainWorld('api', {
        executeSOQL: executeSOQL || (() => { throw new Error('executeSOQL not available'); }),
        executeREST: executeREST || (() => { throw new Error('executeREST not available'); }),
        setConfigFile: setConfigFile || (() => { throw new Error('setConfigFile not available'); }),
        listConfigs: listConfigs || (() => { throw new Error('listConfigs not available'); })
    });

    console.log('API exposed successfully via contextBridge');
} catch (error) {
    console.error('Error in test preload script:', error);
    console.error('Error stack:', error.stack);
}