const { default: axios, AxiosHeaders } = require('axios');

class PinarkiveClient {
  constructor({ token, apiKey }, baseURL = 'https://api.pinarkive.com/api/v2') {
    this.auth = { token, apiKey };
    this.axios = axios.create({ baseURL });
    this.axios.interceptors.request.use((config) => {
      const headers = new AxiosHeaders(config.headers);
      if (this.auth.token) {
        headers.set('Authorization', `Bearer ${this.auth.token}`);
      } else if (this.auth.apiKey) {
        headers.set('Authorization', `Bearer ${this.auth.apiKey}`);
      }
      config.headers = headers;
      return config;
    });
  }

  // --- Authentication ---

  // --- File Management ---
  uploadFile(file) {
    const form = new FormData();
    form.append('file', file);
    return this.axios.post('/files', form);
  }
  uploadDirectory(dirPath) {
    return this.axios.post('/files/directory', { dirPath });
  }
  
  // New: Directory DAG upload
  uploadDirectoryDAG(files, dirName = null) {
    const form = new FormData();
    if (dirName) {
      form.append('dirName', dirName);
    }
    
    // Handle array of files or file objects
    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        if (file.path && file.content) {
          form.append(`files[${index}][path]`, file.path);
          form.append(`files[${index}][content]`, file.content);
        } else {
          form.append('files', file);
        }
      });
    } else {
      // Handle object with file paths as keys
      Object.keys(files).forEach((path, index) => {
        form.append(`files[${index}][path]`, path);
        form.append(`files[${index}][content]`, files[path]);
      });
    }
    
    return this.axios.post('/files/directory-dag', form);
  }
  
  
  // New: Rename file
  renameFile(uploadId, newName) {
    return this.axios.put(`/files/rename/${uploadId}`, { newName });
  }
  
  pinCid(cid, filename = null) {
    const payload = {};
    if (filename) {
      payload.filename = filename;
    }
    return this.axios.post(`/files/pin/${cid}`, payload);
  }
  
  removeFile(cid) {
    return this.axios.delete(`/files/remove/${cid}`);
  }

  listUploads(page = 1, limit = 10) {
    return this.axios.get('/users/me/uploads', { params: { page, limit } });
  }

  // --- Token Management ---
  generateToken(name, options = {}) {
    const payload = { name };
    
    // Support both old format (permissions) and new format (options object)
    if (options.permissions) {
      payload.permissions = options.permissions;
    }
    if (options.expiresInDays) {
      payload.expiresInDays = options.expiresInDays;
    }
    if (options.ipAllowlist) {
      payload.ipAllowlist = options.ipAllowlist;
    }
    
    return this.axios.post('/tokens/generate', payload);
  }
  listTokens() {
    return this.axios.get('/tokens/list');
  }
  revokeToken(name) {
    return this.axios.delete(`/tokens/revoke/${name}`);
  }

  // --- Status and Monitoring ---
  getStatus(cid) {
    return this.axios.get(`/status/${cid}`);
  }
  getAllocations(cid) {
    return this.axios.get(`/status/allocations/${cid}`);
  }
}

module.exports = PinarkiveClient;