# Pinarkive JavaScript SDK (API v3)

JavaScript client for the **Pinarkive API v3**. Uses native `fetch`; Bearer auth; **clusterId** (`cl`) and **timelock** (premium); **onUnauthorized** on 401/403.

> **Version policy (as of Mar 2026):** Only **v3.x.x** is supported and maintained. **v2.3.1** and earlier are **obsolete**; please upgrade to v3.

## Installation

You can install from **npm** (recommended) or from **GitHub**.

**From npm:**

```bash
npm install @pinarkive/pinarkive-sdk-js
```

**From GitHub:**

```bash
npm install github:pinarkive/pinarkive-sdk-js
```

For a specific version: `@pinarkive/pinarkive-sdk-js@3.0.1` (npm) or `github:pinarkive/pinarkive-sdk-js#v3.0.1` (GitHub).

## Base URL (.env or constructor)

The base URL must be set in **.env** or passed in the constructor. Browser: `window.__ENV__.VITE_BACKEND_API_URL` + `VITE_API_BASE`. Node: `PINARKIVE_API_BASE_URL` or `VITE_BACKEND_API_URL` + `VITE_API_BASE`. Without this, the constructor throws.

```env
VITE_API_BASE=/api/v3
VITE_BACKEND_API_URL=https://api.pinarkive.com
```

## Quick Start

```javascript
const { PinarkiveClient, getDefaultBaseUrl } = require('@pinarkive/pinarkive-sdk-js');

const client = new PinarkiveClient({
  token: 'your-jwt-token',
  onUnauthorized: () => { /* logout */ },
});

// Responses are the raw JSON body (not .data)
const me = await client.getMe();
const result = await client.uploadFile(file, { clusterId: 'cl0-global' });
console.log(result.cid);
await client.pinCid(cid, { customName: 'doc', clusterId: 'cl0-global' });
```

## Authentication

- **Token:** `new PinarkiveClient({ token: '...' })`
- **API Key:** `new PinarkiveClient({ apiKey: '...' })`
- **onUnauthorized:** optional; called on 401/403

## Upload and pin (v3)

Options: **clusterId** (`cl`) and **timelock** (ISO 8601 UTC, premium only).

```javascript
await client.uploadFile(file, { clusterId: 'cl0-global' });
await client.uploadDirectory(dirPath, { clusterId: 'cl1-eu' });
await client.uploadDirectoryDAG(files, { dirName: 'proj', clusterId: 'cl0-global' });
await client.pinCid(cid, { customName: 'doc', clusterId: 'cl0-global' });
```

## API reference (v3)

- **Files:** `uploadFile`, `uploadDirectory`, `uploadDirectoryDAG`, `renameFile`, `removeFile`, `listUploads`
- **Pin:** `pinCid(cid, options?)` with `customName`, `clusterId`, `timelock`
- **Tokens:** `generateToken`, `listTokens`, `revokeToken`
- **User:** `getMe`, `getClusters`, `getPreferences`, `updatePreferences`, `getMyPlan`, `getPlansForUser`
- **Public (no Bearer):** `getPlans()`, `getLanguages()`, `getCountries()`, `login()`, `signup()`
- **Status:** `getStatus(cid)`, `getAllocations(cid)`

Responses are the raw JSON body. On error an `Error` is thrown; on 401/403 `onUnauthorized` is called if defined.

## Support

- GitHub: [pinarkive/pinarkive-sdk-js](https://github.com/pinarkive/pinarkive-sdk-js)
- API: [api.pinarkive.com/docs](https://api.pinarkive.com/docs)
