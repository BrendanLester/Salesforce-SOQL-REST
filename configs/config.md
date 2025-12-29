# Playforce Query Salesforce Configurations

This folder is where you put your Salesforce environment configuration files for Playforce Query.

Each environment should have its own JSON file, for example:

- dev.json
- test.json
- prod.json

## Supported Authentication Options

Playforce Query supports multiple Salesforce OAuth authentication flows.
The authentication method is controlled using the optional `grant_type` field.

If `grant_type` is omitted, it defaults to "client_credentials".

### Supported grant_type values

- "client_credentials" (default)  
  Uses only the client ID and client secret to authenticate the application.  
  Requires a Salesforce **External Client App** configured to allow the client credentials flow.  
  No username or password is needed.  
  Note: The client credentials flow is **not supported on standard Connected Apps**; use an External Client App instead.


- "password"  
  Uses a Salesforce username and password to authenticate a user.  
  Requires a Connected App (using an **External Client App is recommended**) and both the client ID and client secret.  
  The client credentials identify the application, while the username and password identify the user.  
  If a security token is required (for example, if the user's IP address is not trusted), append it **directly to the end of the password** when configuring the JSON file.  
  Example: `"password": "MyPasswordMYSECURITYTOKEN"`


## Example Config File (Client Credentials – Default)

```json
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "login_url": "https://login.salesforce.com"
}
```

grant_type can be omitted when using the default client_credentials flow.

## Example Config File (Password Grant)

```json
{
  "grant_type": "password",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "username": "user@example.com",
  "password": "password",
  "login_url": "https://sandbox.my.salesforce.com",
  "apiVersion": "v57.0"
}
```

## apiVersion

If apiVersion is not specified, Playforce Query defaults to Salesforce API version 57.

## login_url behavior

The login_url value should be the base Salesforce login domain only.

Playforce Query automatically appends the OAuth token path:

/services/oauth2/token

Do not include this path in your configuration file.

## Salesforce domain notes

The Salesforce login domain may differ depending on how your org is configured.

Some orgs require authentication via a custom My Domain URL, for example:

https://your-domain.my.salesforce.com

If authentication fails using the standard login or test domains, check the My Domain page in Salesforce Setup to confirm the correct domain for your org.

## Notes

- Do not include username or password when using client_credentials
- login_url may be one of:
  - https://login.salesforce.com (production)
  - https://test.salesforce.com (sandbox)
  - https://your-domain.my.salesforce.com (My Domain)
- Some Salesforce orgs do not allow client_credentials; in those cases, use the password grant
- apiVersion defaults to "v57.0" if not specified
- grant_type defaults to "client_credentials" if not specified
