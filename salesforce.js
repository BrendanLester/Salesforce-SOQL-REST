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
let tokenCache = {}; // Store tokens per config file: { configFileName: tokenData }

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
        // Don't clear token - keep it in tokenCache for this config

        if (fs.existsSync(currentConfigFile)) {
            console.log('Config file set to:', currentConfigFile);
            return true;
        } else {
            console.error('Config file does not exist:', currentConfigFile);
            currentConfigFile = null;
            return false;
        }
    } catch (error) {
        console.error('Error setting config file:', error);
        currentConfigFile = null;
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

            // Apply defaults if missing
            if (!configData.apiVersion) {
                configData.apiVersion = "v57.0"; // default API version
            }

            // Automatic grant_type determination - only if not explicitly set
            if (!configData.grant_type) {
                if (configData.username && configData.password) {
                    configData.grant_type = "password";
                } else {
                    // No username/password - will try client_credentials first, then OAuth
                    configData.grant_type = "client_credentials";
                }
            }
        }
        return configData;
    } catch (error) {
        console.error('Error loading config:', error);
        return null;
    }
}

// In-memory token management - per config file
function loadToken() {
    if (!currentConfigFile) return null;
    return tokenCache[currentConfigFile] || null;
}

function saveToken(tokenData) {
    if (!currentConfigFile) return;
    tokenCache[currentConfigFile] = tokenData;
    console.log('Token saved in memory for:', path.basename(currentConfigFile));
}

async function authenticate() {
    console.log("authenticate() called");

    const config = loadConfig();
    if (!config) {
        throw new Error("No config selected or config file not found");
    }

    const {
        login_url,
        client_id,
        client_secret,
        grant_type,
        username,
        password,        
    } = config;

    console.log("Using login_url:", login_url);
    console.log("Using grant_type:", grant_type);

    // For authorization_code, we need to trigger the OAuth flow
    if (grant_type === "authorization_code") {
        throw new Error("Please use startOAuthFlow() for authorization_code grant type");
    }

    const body = new URLSearchParams({
        grant_type,
        client_id,
        client_secret
    });

    // Grant-type–specific fields
    switch (grant_type) {
        case "password":
            if (!username || !password) {
                throw new Error("username and password are required for password grant");
            }
            body.append("username", username);
            body.append("password", password);
            break;

        case "client_credentials":
            // No extra fields
            // Note: Salesforce only allows this for specific connected apps
            break;

        default:
            throw new Error(`Unsupported grant_type: ${grant_type}`);
    }

    try {
        console.log("Making authentication request...");
        const res = await fetch(`${login_url}/services/oauth2/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body
        });

        console.log("Authentication response status:", res.status);
        const data = await res.json();

        if (!res.ok) {
            console.error("Authentication failed:", data);
            throw new Error(`Salesforce auth failed: ${JSON.stringify(data)}`);
        }

        console.log("Authentication successful");
        saveToken(data);
        return data;
    } catch (error) {
        console.error("Authentication error:", error);
        throw error;
    }
}

// Exchange authorization code for access token
async function authenticateWithAuthCode(authCode, redirectUri) {
    console.log("authenticateWithAuthCode() called");

    const config = loadConfig();
    if (!config) {
        throw new Error("No config selected or config file not found");
    }

    const {
        login_url,
        client_id,
        client_secret
    } = config;

    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: authCode,
        client_id,
        client_secret,
        redirect_uri: redirectUri
    });

    try {
        console.log("Exchanging authorization code for access token...");
        const res = await fetch(`${login_url}/services/oauth2/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body
        });

        console.log("Token exchange response status:", res.status);
        const data = await res.json();

        if (!res.ok) {
            console.error("Token exchange failed:", data);
            throw new Error(`Salesforce token exchange failed: ${JSON.stringify(data)}`);
        }

        console.log("Token exchange successful");
        saveToken(data);
        return data;
    } catch (error) {
        console.error("Token exchange error:", error);
        throw error;
    }
}

// Generate OAuth authorization URL
function getAuthorizationUrl(redirectUri) {
    const config = loadConfig();
    if (!config) {
        throw new Error("No config selected or config file not found");
    }

    const { login_url, client_id } = config;
    const params = new URLSearchParams({
        response_type: "code",
        client_id,
        redirect_uri: redirectUri,
        prompt: "login"
    });

    return `${login_url}/services/oauth2/authorize?${params.toString()}`;
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
    const apiVersion = config.apiVersion;

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
    const apiVersion = config.apiVersion;

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

// Get current config info for debugging
function getCurrentConfig() {
    const hasToken = currentConfigFile ? !!tokenCache[currentConfigFile] : false;
    return {
        currentConfigFile,
        hasConfigData: !!configData,
        hasToken
    };
}

// Check if current config requires OAuth
function requiresOAuth() {
    // We'll always try client_credentials first, then fall back to OAuth
    return false;
}

// Check if we have a cached token for current config
function hasValidToken() {
    const token = loadToken();
    return !!token && !!token.access_token;
}

// Try to authenticate with automatic fallback from client_credentials to OAuth
async function tryAuthenticate() {
    const config = loadConfig();
    if (!config) {
        throw new Error("No config selected or config file not found");
    }

    // If it has username/password, use password grant
    if (config.username && config.password) {
        console.log('Using password grant');
        await authenticate();
        return { success: true, method: 'password' };
    }

    // Otherwise, try client_credentials first
    console.log('Attempting client_credentials authentication...');
    try {
        await authenticate();
        console.log('Client credentials authentication successful');
        return { success: true, method: 'client_credentials' };
    } catch (error) {
        console.log('Client credentials failed, OAuth required:', error.message);
        return { success: false, needsOAuth: true, error: error.message };
    }
}

module.exports = {
    executeSOQL,
    executeREST,
    setConfigFile,
    listConfigs,
    getAccessToken,
    getAuthorizationUrl,
    authenticateWithAuthCode,
    getCurrentConfig,
    requiresOAuth,
    tryAuthenticate,
    hasValidToken
};

console.log('salesforce.js loaded successfully');
