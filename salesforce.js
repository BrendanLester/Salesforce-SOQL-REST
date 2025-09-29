console.log('salesforce.js loading...');

const fs = require("fs");
const path = require("path");

// Handle both node-fetch v2 and v3
let fetch;
try {
    fetch = require("node-fetch");
    if (typeof fetch !== 'function') {
        fetch = require("node-fetch").default;
    }
    console.log('node-fetch loaded successfully');
} catch (error) {
    console.error('Failed to load node-fetch:', error);
    throw error;
}

console.log('All dependencies loaded successfully');

const CONFIGS_DIR = path.join(__dirname, "configs");

// Ensure configs directory exists
if (!fs.existsSync(CONFIGS_DIR)) {
    fs.mkdirSync(CONFIGS_DIR);
}

let currentConfigFile = null;
let configData = null;
let currentToken = null; // token kept in memory only

function listConfigs() {
    try {
        if (!fs.existsSync(CONFIGS_DIR)) {
            return [];
        }
        const files = fs.readdirSync(CONFIGS_DIR);
        return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    } catch (error) {
        console.error('Error listing configs:', error);
        return [];
    }
}

function setConfigFile(configName) {
    try {
        currentConfigFile = path.join(CONFIGS_DIR, `${configName}.json`);
        configData = null; // Reset cached config
        currentToken = null; // clear in-memory token when switching config

        if (fs.existsSync(currentConfigFile)) {
            console.log('Config file set to:', currentConfigFile);
            return true;
        } else {
            console.error('Config file does not exist:', currentConfigFile);
            return false;
        }
    } catch (error) {
        console.error('Error setting config file:', error);
        return false;
    }
}

function loadConfig() {
    try {
        if (!currentConfigFile) {
            console.warn('No config file selected');
            return null;
        }
        if (!configData && fs.existsSync(currentConfigFile)) {
            console.log('Loading config from:', currentConfigFile);
            configData = JSON.parse(fs.readFileSync(currentConfigFile, "utf-8"));
            console.log('Config loaded successfully');
        }
        return configData;
    } catch (error) {
        console.error('Error loading config:', error);
        return null;
    }
}

// In-memory token management
function loadToken() {
    return currentToken;
}

function saveToken(tokenData) {
    currentToken = tokenData;
    console.log('Token saved in memory only');
}

async function authenticate() {
    console.log('authenticate() called');
    const config = loadConfig();
    if (!config) {
        throw new Error("No config selected or config file not found");
    }

    const { client_id, client_secret, username, password, login_url } = config;
    console.log('Using login_url:', login_url);

    try {
        console.log('Making authentication request...');
        const res = await fetch(`${login_url}/services/oauth2/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "password",
                client_id,
                client_secret,
                username,
                password
            })
        });

        console.log('Authentication response status:', res.status);
        const data = await res.json();

        if (!res.ok) {
            console.error('Authentication failed:', data);
            throw new Error(`Salesforce auth failed: ${JSON.stringify(data)}`);
        }

        console.log('Authentication successful');
        saveToken(data);
        return data;
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

async function getAccessToken(forceRefresh = false) {
    console.log('getAccessToken() called');
    let tokenData = loadToken();

    if (forceRefresh || !tokenData || !tokenData.access_token) {
        console.log('Authenticating to get new token...');
        tokenData = await authenticate();
    } else {
        console.log('Using existing in-memory token');
    }

    return { token: tokenData.access_token, instanceUrl: tokenData.instance_url };
}

async function withTokenRetry(requestFn) {
    try {
        return await requestFn();
    } catch (err) {
        if (err.message.includes("INVALID_SESSION_ID") || err.message.includes("401")) {
            console.warn("Token expired, retrying authentication...");
            const { token, instanceUrl } = await getAccessToken(true); // force refresh
            return await requestFn(token, instanceUrl);
        }
        throw err;
    }
}

async function executeSOQL(query) {
    console.log('executeSOQL called with:', query);
    const config = loadConfig();
    const apiVersion = config.apiVersion || "v57.0";

    return await withTokenRetry(async (token, instanceUrl) => {
        if (!token || !instanceUrl) {
            ({ token, instanceUrl } = await getAccessToken());
        }

        const url = `${instanceUrl}/services/data/${apiVersion}/query/?q=${encodeURIComponent(query)}`;
        console.log('Making SOQL request to:', url);

        const res = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Salesforce SOQL error: ${text}`);
        }

        const result = await res.json();
        console.log('SOQL success, returned', result.totalSize, 'records');
        return result;
    });
}

async function executeREST(path) {
    const config = loadConfig();
    const apiVersion = config.apiVersion || "v57.0";

    return await withTokenRetry(async (token, instanceUrl) => {
        if (!token || !instanceUrl) {
            ({ token, instanceUrl } = await getAccessToken());
        }

        const url = `${instanceUrl}/services/data/${apiVersion}/sobjects/${path}`;
        console.log("Making REST request to:", url);

        const res = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`REST API error: ${text}\nURL: ${url}`);
        }

        return await res.json();
    });
}

module.exports = {
    executeSOQL,
    executeREST,
    setConfigFile,
    listConfigs,
    getAccessToken
};

console.log('salesforce.js loaded successfully');
