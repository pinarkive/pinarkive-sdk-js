# Pinarkive JavaScript SDK

JavaScript client for the Pinarkive API v2.3.1. Easy IPFS file management with directory DAG uploads, file renaming, and enhanced API key management. Perfect for Node.js and browser applications.

## Installation

```bash
npm install @pinarkive/pinarkive-sdk-js
```

## Quick Start

```javascript
const PinarkiveClient = require('@pinarkive/pinarkive-sdk-js');

// Initialize with API key
const client = new PinarkiveClient({ 
  apiKey: 'your-api-key-here' 
});

// Upload a file
const fs = require('fs');
const file = fs.createReadStream('document.pdf');
const result = await client.uploadFile(file);
console.log('File uploaded:', result.data.cid);

// Generate API key
const token = await client.generateToken('my-app', { 
  expiresInDays: 30 
});
console.log('New API key:', token.data.token);
```

## Authentication

The SDK supports two authentication methods:

### API Key Authentication (Recommended)
```javascript
const client = new PinarkiveClient({ 
  apiKey: 'your-api-key-here' 
});
```
**Note:** The SDK automatically sends the API key using the `Authorization: Bearer` header format, not `X-API-Key`.

### JWT Token Authentication
```javascript
const client = new PinarkiveClient({ 
  token: 'your-jwt-token-here' 
});
```

## Basic Usage

### File Upload
```javascript
// Upload single file
const fs = require('fs');
const file = fs.createReadStream('document.pdf');
const result = await client.uploadFile(file);
console.log('CID:', result.data.cid);
console.log('Status:', result.data.status);
```

### Directory Upload
```javascript
// Upload directory from local path
const result = await client.uploadDirectory('/path/to/directory');
console.log('Directory CID:', result.data.cid);
```

### List Uploads
```javascript
// List all uploaded files with pagination
const uploads = await client.listUploads(1, 20);
console.log('Uploads:', uploads.data.uploads);
console.log('Total:', uploads.data.pagination.total);
```

## Advanced Features

### Directory DAG Upload
Upload entire directory structures as DAG (Directed Acyclic Graph):

```javascript
// Method 1: Array of file objects
const files = [
  { path: 'folder1/file1.txt', content: 'Hello World' },
  { path: 'folder1/file2.txt', content: 'Another file' },
  { path: 'folder2/subfolder/file3.txt', content: 'Nested file' }
];

const result = await client.uploadDirectoryDAG(files, 'my-project');
console.log('DAG CID:', result.data.dagCid);
console.log('Files:', result.data.files);

// Method 2: Object with file paths as keys
const filesObj = {
  'folder1/file1.txt': 'Hello World',
  'folder1/file2.txt': 'Another file',
  'folder2/subfolder/file3.txt': 'Nested file'
};

const result2 = await client.uploadDirectoryDAG(filesObj);
```

### Directory Cluster Upload
Upload directories using cluster-based approach:

```javascript
const files = [
  { path: 'file1.txt', content: 'Content 1' },
  { path: 'file2.txt', content: 'Content 2' }
];

const result = await client.uploadDirectoryCluster(files);
console.log('Cluster CID:', result.data.cid);
```

### Upload File to Existing Directory
```javascript
const file = fs.createReadStream('new-file.txt');
const result = await client.uploadFileToDirectory(file, 'existing-directory-path');
console.log('File added to directory:', result.data.cid);
```

### File Renaming
```javascript
// Rename an uploaded file
const result = await client.renameFile('upload-id-here', 'new-file-name.pdf');
console.log('File renamed:', result.data.updated);
```

### File Removal
```javascript
// Remove a file from storage
const result = await client.removeFile('QmYourCIDHere');
console.log('File removed:', result.data.success);
```

### Pinning Operations

#### Basic CID Pinning
```javascript
// Pin with filename
const result = await client.pinCid('QmYourCIDHere', 'my-file.pdf');
console.log('CID pinned:', result.data.pinned);

// Pin without filename (backend will use default)
const result2 = await client.pinCid('QmYourCIDHere');
console.log('CID pinned:', result2.data.pinned);
```

#### Pin with Custom Name
```javascript
const result = await client.pinCid('QmYourCIDHere', 'my-important-file');
console.log('CID pinned with name:', result.data.pinned);
```

### API Key Management

#### Generate API Key
```javascript
// Basic token generation
const token = await client.generateToken('my-app');

// Advanced token with options
const token = await client.generateToken('my-app', {
  expiresInDays: 30,
  ipAllowlist: ['192.168.1.1', '10.0.0.1'],
  permissions: ['upload', 'pin']
});
console.log('New API key:', token.data.token);
```

#### List API Keys
```javascript
const tokens = await client.listTokens();
console.log('API Keys:', tokens.data.tokens);
```

#### Revoke API Key
```javascript
const result = await client.revokeToken('my-app');
console.log('Token revoked:', result.data.revoked);
```

## Error Handling

```javascript
try {
  const result = await client.uploadFile(file);
  console.log('Success:', result.data);
} catch (error) {
  if (error.response) {
    console.error('API Error:', error.response.data);
    console.error('Status:', error.response.status);
  } else {
    console.error('Network Error:', error.message);
  }
}
```

## Browser Usage

```javascript
// In browser environment
const client = new PinarkiveClient({ 
  apiKey: 'your-api-key' 
});

// Upload file from file input
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

const result = await client.uploadFile(file);
console.log('File uploaded:', result.data.cid);
```

## API Reference

### Constructor
```javascript
new PinarkiveClient(auth, baseURL)
```
- `auth`: Object with either `apiKey` or `token`
- `baseURL`: Optional base URL (defaults to `https://api.pinarkive.com/api/v2`)

### File Operations
- `uploadFile(file)` - Upload single file
- `uploadDirectory(dirPath)` - Upload directory recursively (calls uploadFile for each file)
- `uploadDirectoryDAG(files, dirName)` - Upload directory as DAG structure
- `renameFile(uploadId, newName)` - Rename uploaded file
- `removeFile(cid)` - Remove file from storage

### Pinning Operations
- `pinCid(cid, filename)` - Pin CID to account with optional filename

### User Operations
- `listUploads(page, limit)` - List uploaded files

### Token Management
- `generateToken(name, options)` - Generate API key
- `listTokens()` - List all API keys
- `revokeToken(name)` - Revoke API key

### Status & Monitoring
- `getStatus(cid)` - Get file status
- `getAllocations(cid)` - Get storage allocations

## Examples

### Complete File Management Workflow
```javascript
const PinarkiveClient = require('@pinarkive/pinarkive-sdk-js');
const fs = require('fs');

async function manageFiles() {
  const client = new PinarkiveClient({ 
    apiKey: 'your-api-key' 
  });

  try {
    // 1. Upload a file
    const file = fs.createReadStream('document.pdf');
    const upload = await client.uploadFile(file);
    console.log('Uploaded:', upload.data.cid);

    // 2. Pin the CID with a custom name
    await client.pinCid(upload.data.cid, 'important-document');

    // 3. Rename the file
    await client.renameFile(upload.data.uploadId, 'my-document.pdf');

    // 4. List all uploads
    const uploads = await client.listUploads();
    console.log('All uploads:', uploads.data.uploads);

    // 5. Remove a file (optional)
    // await client.removeFile(upload.data.cid);
    // console.log('File removed successfully');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

manageFiles();
```

### Directory Upload Workflow
```javascript
async function uploadProject() {
  const client = new PinarkiveClient({ 
    apiKey: 'your-api-key' 
  });

  // Create project structure
  const projectFiles = {
    'src/index.js': 'console.log("Hello World");',
    'src/utils.js': 'module.exports = {};',
    'package.json': JSON.stringify({ name: 'my-project' }),
    'README.md': '# My Project\n\nThis is my project.'
  };

  try {
    const result = await client.uploadDirectoryDAG(projectFiles, 'my-project');
    console.log('Project uploaded:', result.data.dagCid);
    console.log('Files:', result.data.files);
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
  }
}

uploadProject();
```

## Publishing Instructions

### Publishing to npm

This package is published to npm using the following process:

```bash
# Update version in package.json
npm version 2.3.1
npm publish --access public
```

### Development Publishing

For testing before publishing:

```bash
# Publish to npm with beta tag for testing
npm version 2.3.1-beta.1
npm publish --tag beta --access public

# Install beta version for testing
npm install @pinarkive/pinarkive-sdk-js@beta
```

### Version Management

- Update version in `package.json`
- Use `npm version` to automatically update version and create git tag
- Publish with `npm publish --access public`
- Use semantic versioning (2.3.1, 2.4.0, etc.)

### npm Best Practices

- Use semantic versioning
- Test with beta/alpha tags before stable releases
- Include comprehensive README and documentation
- Use proper keywords for discoverability
- Set `"access": "public"` in package.json for scoped packages

## Support

For issues or questions:
- GitHub Issues: [https://github.com/pinarkive/pinarkive-sdk-js/issues](https://github.com/pinarkive/pinarkive-sdk-js/issues)
- API Documentation: [https://api.pinarkive.com/docs](https://api.pinarkive.com/docs)
- Contact: [https://pinarkive.com/docs.php](https://pinarkive.com/docs.php) 