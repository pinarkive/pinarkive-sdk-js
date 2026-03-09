/**
 * Pinarkive SDK JavaScript – API v3
 * Uses native fetch; Bearer token for authenticated calls; optional onUnauthorized (e.g. logout).
 * Base URL: pass in options or set in .env (PINARKIVE_API_BASE_URL or VITE_BACKEND_API_URL + VITE_API_BASE).
 */

/** Thrown on API 4xx/5xx. For 403 missing_scope check .code and .required; for 429 check .retryAfterSeconds. */
class PinarkiveAPIError extends Error {
  constructor(message, statusCode, code, required, retryAfterSeconds, body) {
    super(message);
    this.name = 'PinarkiveAPIError';
    this.statusCode = statusCode;
    this.code = code;
    this.required = required;
    this.retryAfterSeconds = retryAfterSeconds;
    this.body = body;
  }
}

function getDefaultBaseUrl() {
  if (typeof window !== 'undefined' && window.__ENV__) {
    const env = window.__ENV__;
    const backend = (env.VITE_BACKEND_API_URL || '').replace(/\/$/, '');
    const base = env.VITE_API_BASE || '/api/v3';
    return backend ? `${backend}${base.startsWith('/') ? base : `/${base}`}` : '';
  }
  if (typeof process !== 'undefined' && process.env?.PINARKIVE_API_BASE_URL) {
    return process.env.PINARKIVE_API_BASE_URL.replace(/\/$/, '');
  }
  if (typeof process !== 'undefined' && process.env?.VITE_BACKEND_API_URL) {
    const b = process.env.VITE_BACKEND_API_URL.replace(/\/$/, '');
    const apiBase = process.env.VITE_API_BASE || '/api/v3';
    return `${b}${apiBase.startsWith('/') ? apiBase : `/${apiBase}`}`;
  }
  return '';
}

class PinarkiveClient {
  constructor(authOrOptions, baseURL) {
    if (typeof baseURL === 'string') {
      this.baseUrl = baseURL.replace(/\/$/, '');
      this.auth = authOrOptions;
      this.onUnauthorized = undefined;
      this.requestSource = undefined;
    } else {
      const opts = authOrOptions || {};
      const resolved = opts.baseUrl || getDefaultBaseUrl();
      if (!resolved) {
        throw new Error(
          'PinarkiveClient: baseUrl is required. Pass it in options or set in .env: PINARKIVE_API_BASE_URL or VITE_BACKEND_API_URL + VITE_API_BASE (browser: window.__ENV__)'
        );
      }
      this.baseUrl = resolved.replace(/\/$/, '');
      this.auth = { token: opts.token, apiKey: opts.apiKey };
      this.onUnauthorized = opts.onUnauthorized;
      this.requestSource = opts.requestSource;
    }
  }

  async request(path, options = {}) {
    const { requireAuth = true, ...init } = options;
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = new Headers(init.headers || {});

    if (requireAuth) {
      const token = this.auth?.token || this.auth?.apiKey;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      // Only send X-Request-Source: web when using Bearer (JWT), not when using API Key
      if (this.requestSource === 'web' && this.auth?.token) {
        headers.set('X-Request-Source', 'web');
      }
    }

    if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(url, { ...init, headers });
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      let message = 'Request failed';
      let body;
      if (contentType.includes('application/json')) {
        try {
          body = await res.json();
          message = body.message ?? body.error ?? message;
        } catch (_) {}
      }
      if ([401, 403].includes(res.status) && this.onUnauthorized) {
        this.onUnauthorized();
      }
      const code = body?.code;
      const required = body?.required;
      const retryAfterHeader = res.headers.get('Retry-After');
      const retryAfterSeconds =
        res.status === 429
          ? (body?.retryAfter ?? (retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined))
          : undefined;
      throw new PinarkiveAPIError(message, res.status, code, required, retryAfterSeconds, body);
    }

    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined;
    }
    if (!contentType.includes('application/json')) {
      throw new Error('Response is not JSON');
    }
    return res.json();
  }

  // --- Public (no Bearer) ---
  async getPlans() {
    return this.request('/plans', { requireAuth: false });
  }

  async getLanguages() {
    return this.request('/locales/languages', { requireAuth: false });
  }

  async getCountries() {
    return this.request('/locales/countries', { requireAuth: false });
  }

  /** If response has requires2FA and temporaryToken, call verify2FALogin(temporaryToken, code) to get session token. */
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      requireAuth: false,
    });
  }

  async verify2FALogin(temporaryToken, code) {
    return this.request('/auth/2fa/verify-login', {
      method: 'POST',
      body: JSON.stringify({ temporaryToken, code }),
      requireAuth: false,
    });
  }

  async signup(body) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
      requireAuth: false,
    });
  }

  // --- File Management ---
  async uploadFile(file, options = {}) {
    const form = new FormData();
    form.append('file', file);
    if (options.clusterId) form.append('cl', options.clusterId);
    if (options.timelock) form.append('timelock', options.timelock);
    return this.request('/files', { method: 'POST', body: form });
  }

  async uploadDirectory(dirPath, options = {}) {
    return this.request('/files/directory', {
      method: 'POST',
      body: JSON.stringify({
        dirPath,
        ...(options.clusterId && { cl: options.clusterId }),
        ...(options.timelock && { timelock: options.timelock }),
      }),
    });
  }

  async uploadDirectoryDAG(files, options = {}) {
    const form = new FormData();
    if (options.dirName) form.append('dirName', options.dirName);
    if (options.clusterId) form.append('cl', options.clusterId);
    if (options.timelock) form.append('timelock', options.timelock);

    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        form.append(`files[${index}][path]`, file.path);
        form.append(`files[${index}][content]`, file.content);
      });
    } else {
      Object.keys(files).forEach((path, index) => {
        form.append(`files[${index}][path]`, path);
        form.append(`files[${index}][content]`, files[path]);
      });
    }
    return this.request('/files/directory-dag', { method: 'POST', body: form });
  }

  async renameFile(uploadId, newName) {
    return this.request(`/files/rename/${uploadId}`, {
      method: 'PUT',
      body: JSON.stringify({ newName }),
    });
  }

  async pinCid(cid, options = {}) {
    const body = {};
    if (options.customName) body.customName = options.customName;
    if (options.clusterId) body.cl = options.clusterId;
    if (options.timelock) body.timelock = options.timelock;
    return this.request(`/files/pin/${cid}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async removeFile(cid) {
    return this.request(`/files/remove/${cid}`, { method: 'DELETE' });
  }

  async listUploads(page = 1, limit = 10, hasExpiration, params) {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (hasExpiration === true) q.set('hasExpiration', 'true');
    if (params?.parentCid) q.set('parentCid', params.parentCid);
    if (params?.cid) q.set('cid', params.cid);
    return this.request(`/users/me/uploads?${q}`);
  }

  async getDagDetail(cidDag) {
    return this.request(`/users/me/uploads/dag/${encodeURIComponent(cidDag)}`);
  }

  // --- Token Management ---
  async generateToken(name, options = {}) {
    const payload = { name };
    if (options.scopes?.length) payload.scopes = options.scopes;
    if (options.permissions) payload.permissions = options.permissions;
    if (options.expiresInDays != null) payload.expiresInDays = options.expiresInDays;
    if (options.ipAllowlist) payload.ipAllowlist = options.ipAllowlist;
    const totp = options.totpCode ?? options.twoFactorCode;
    if (totp) payload.totpCode = totp;
    return this.request('/tokens/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listTokens() {
    return this.request('/tokens/list');
  }

  /** If account has 2FA, pass { totpCode: '...' } or { twoFactorCode: '...' }. */
  async revokeToken(name, options = {}) {
    const body =
      options.totpCode != null
        ? JSON.stringify({ totpCode: options.totpCode })
        : options.twoFactorCode != null
          ? JSON.stringify({ twoFactorCode: options.twoFactorCode })
          : undefined;
    return this.request(`/tokens/revoke/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      ...(body && { body }),
    });
  }

  // --- Status ---
  async getStatus(cid) {
    return this.request(`/status/${cid}`);
  }

  async getAllocations(cid) {
    return this.request(`/status/allocations/${cid}`);
  }

  // --- User ---
  async getMe() {
    return this.request('/users/me');
  }

  async getClusters() {
    return this.request('/users/me/clusters');
  }

  async getPreferences() {
    return this.request('/users/me/preferences');
  }

  async updatePreferences(language, country) {
    return this.request('/users/me/preferences', {
      method: 'PUT',
      body: JSON.stringify({ language, country }),
    });
  }

  async getMyPlan() {
    return this.request('/plans/my-plan');
  }

  async getPlansForUser() {
    return this.request('/users/me/plans');
  }

  async changePlan(planId) {
    return this.request('/plans/change', {
      method: 'PUT',
      body: JSON.stringify({ planId }),
    });
  }

  async getReferrals() {
    return this.request('/users/me/referrals');
  }

  async updateMe(body) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async updatePassword(body) {
    return this.request('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getFileAllocations(cid) {
    return this.request(`/allocations/${encodeURIComponent(cid)}`);
  }

  async createPaymentOrder(gateway, planId) {
    return this.request(`/payments/${gateway}/create`, {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  async getPaymentStatus(gateway, orderId) {
    return this.request(`/payments/${gateway}/status/${encodeURIComponent(orderId)}`);
  }

  async cancelPayment(gateway, orderId) {
    return this.request(`/payments/${gateway}/cancel/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
    });
  }
}

module.exports = PinarkiveClient;
module.exports.getDefaultBaseUrl = getDefaultBaseUrl;
module.exports.PinarkiveAPIError = PinarkiveAPIError;
