# Playforce Query Configuration Guide

This folder is where you put your Salesforce environment configuration files for Playforce Query. Each environment should have its own JSON file (e.g., dev.json, test.json, prod.json).

**File Naming**: The filename (without the .json extension) appears as the environment name in the application dropdown. For example, `production.json` will appear as "production" in the dropdown.

## Quick Start

1. Create a JSON configuration file in this directory
2. Add your credentials (see examples below)
3. Select the environment from the dropdown in the application
4. Authentication happens automatically!

## Authentication Methods

Playforce Query uses **automatic authentication detection** with the following priority:

1. **Password Grant** - If `username` and `password` are present
2. **Client Credentials** - If only `client_id` and `client_secret` are present (attempted first)
3. **OAuth 2.0 Authorization Code Flow** - If client credentials fail, automatically switches to interactive OAuth

**No need to specify `grant_type`** - Playforce Query chooses the right method!

### Method Comparison

| Method |  Security | User Interaction | Auto-Detected When |
|----------|----------|------------------|-------------------|
| Password Grant | ⚠️ Medium | ❌ No | Config has username + password |
| Client Credentials | ✅ High | ❌ No | No username/password (tried first) |
| OAuth 2.0 (Authorization Code) | ✅ High | ✅ Yes | No username/password (tried second) |


**Recommendation**: Use OAuth 2.0

## Configuration Options

### Required Fields

- `client_id`: The Consumer Key from your Salesforce External Client App
- `client_secret`: The Consumer Secret from your Salesforce External Client App
- `login_url`: The Salesforce login URL
  - Production/Developer orgs: `https://login.salesforce.com`
  - Sandbox orgs: `https://test.salesforce.com`
  - Custom domain: `https://yourdomain.my.salesforce.com`

### Optional Fields

- `username`: Salesforce username
- `password`: Salesforce password 
  -  If a security token is required (for example, if the user's IP address is not trusted) + security token concatenated 
  -  Example: `"password": "MyPasswordMYSECURITYTOKEN"`
- `apiVersion`: Salesforce API version (default: `v57.0`)
  - Examples: `"v58.0"`, `"v59.0"`, `"v60.0"`
  - Format: Must include the `v` prefix

## Setting Up OAuth 2.0 (Authorization Code Flow)

OAuth 2.0 is the recommended method for interactive use. It provides secure authentication without storing passwords.

**Note**: Playforce Query supports both legacy Connected Apps and the newer External Client Apps. For new setups, we recommend using External Client Apps as they provide better support for modern OAuth flows.

### Step 1: Create a External Client App in Salesforce

1. Log in to Salesforce
2. Navigate to **Setup** → **App Manager**  → **External Client Apps** →  **External Client App Manager**
3. Click **New External Client App**
4. Fill in basic information:
   - **External Client App Name**: e.g., "Playforce Query Tool"
   - **Contact Email**: Your email
5. Enable OAuth Settings:
   - Check **Enable OAuth Settings**
   - **Callback URL**: `http://localhost:8888/oauth/callback` (must be exact)
   - **Selected OAuth Scopes**: Add at least:
     - `Full access (full)`
     - `Perform requests at any time (refresh_token, offline_access)`
     - Or select specific scopes as needed (e.g., `api`, `refresh_token`)
   - Unselect check boxes in **Flow Enablement** and **Security**   
   - Select **Enable Authorization Code and Credentials Flow**
     - Alternative is to Select **Enable Client Credentials Flow** for Client Credentials flow that would also need a 'Run As' user specified
   
6. Click **Save**
7. **Wait 2-10 minutes** for the External Client App to propagate
8. Copy your credentials:
   - **Consumer Key** → This is your `client_id`
   - **Consumer Secret** → This is your `client_secret`

### Step 2: Create Configuration File

Create a JSON file in this directory:

```json
{
  "client_id": "3MVG9...YOUR_CONSUMER_KEY",
  "client_secret": "1234567890ABCDEF...YOUR_CONSUMER_SECRET",
  "login_url": "https://login.salesforce.com"
}
```

**That's it!** The system will automatically:
1. Try client credentials authentication
2. Switch to OAuth if client credentials are not available

## Configuration Examples

### OAuth-Ready Config

```json
{
  "client_id": "3MVG9...",
  "client_secret": "ABC123...",
  "login_url": "https://login.salesforce.com",
  "apiVersion": "v58.0"
}
```

**Behavior**: Tries client credentials, switches to OAuth if needed.

### Password Grant

```json
{
  "client_id": "3MVG9...",
  "client_secret": "ABC123...",  
  "username": "user@example.com",
  "password": "MyPassword123SecToken456",
  "login_url": "https://login.salesforce.com",
  "apiVersion": "v58.0"
}
```

**Behavior**: Uses password grant automatically (no OAuth needed).

**Important notes:**
- The `password` field may optionally require your security token appended to your password. Required for example, if the user's IP address is not trusted
  - e.g. If password is `MyPassword123` and token is `SecToken456`, use `MyPassword123SecToken456`
- Security tokens can be reset from Salesforce under: Setup → My Personal Information → Reset My Security Token


## API Version

The `apiVersion` field specifies which Salesforce REST API version to use:

- **Default**: `v58.0` (if not specified)
- **Format**: Must include the `v` prefix (e.g., `"v58.0"`, `"v59.0"`)
- **Behavior**: This version is used for all SOQL and REST API calls

## Login URL Behavior

The `login_url` determines which Salesforce instance to authenticate against:

- **Production/Developer orgs**: `https://login.salesforce.com`
- **Sandbox orgs**: `https://test.salesforce.com`
- **Custom domains**: Use your org's My Domain URL
  - Format: `https://yourdomain.my.salesforce.com`
  - Example: `https://acme.my.salesforce.com`

**Important:** 
- Do not include `/services/oauth2/token` or other paths - just the base domain
- Playforce Query automatically appends the OAuth token path
- If authentication fails using the standard login or test domains, check the My Domain page in Salesforce Setup to confirm the correct domain for your org

## Security Notes

- **Access tokens are stored in memory only** per environment and not persisted to disk
- **Token caching** allows switching between environments without re-authentication
- The OAuth callback server only runs on `localhost:8888` and is not accessible externally
- Client secrets should be kept secure; do not commit config files with real credentials to version control

## Troubleshooting

### "OAuth callback server error"
- **Cause**: Port 8888 is already in use
- **Solution**: Close other applications using port 8888

### "redirect_uri_mismatch"
- **Cause**: Callback URL in External Client App doesn't match
- **Solution**: Ensure the External Client App has exactly `http://localhost:8888/oauth/callback` as a callback URL

### "invalid_client_id" or "invalid_client"
- **Cause**: Incorrect credentials in config file
- **Solution**: Double-check your `client_id` and `client_secret` in the config file

### "INVALID_SESSION_ID" during query execution
- **Cause**: Token expired or invalid
- **Solution**: Switch to another environment and back - the system will automatically re-authenticate

### External Client App not working immediately
- **Cause**: Salesforce takes 2-10 minutes to propagate new External Client Apps
- **Solution**: Wait a few minutes after creating the External Client App, then try again



