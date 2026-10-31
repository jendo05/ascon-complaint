(function () {
  'use strict';

  const TOKEN_KEY = 'serviceflow-access-token';
  const USER_KEY = 'serviceflow-current-user';
  const config = () => window.SERVICEFLOW_CONFIG || {};
  const apiBaseUrl = () => String(config().apiBaseUrl || '/api/v1').replace(/\/$/, '');

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Could not read the current session.', error);
      return null;
    }
  }

  function saveSession(user, token) {
    if (!user || !token) throw new Error('The server did not return a valid session.');
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  async function request(path, options = {}) {
    const { token: explicitToken, ...fetchOptions } = options;
    const token = explicitToken || getToken();
    const headers = new Headers(fetchOptions.headers || {});
    if (options.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const timeoutMs = Number(config().requestTimeoutMs) || 15000;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch(`${apiBaseUrl()}${path}`, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
        cache: 'no-store',
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('The server took too long to respond. Please try again.');
      }
      if (error instanceof TypeError) {
        throw new Error('Unable to reach the ServiceFlow. Check your connection.');
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && path !== '/auth/signin' && path !== '/auth/signup') {
        clearSession();
      }
      throw new Error(result.error || result.message || `Request failed (${response.status}).`);
    }
    return result;
  }

  function dashboardPage(role) {
    const normalized = String(role || '').toLowerCase();
    if (normalized === 'admin') return 'admin_dashboard.html';
    if (normalized === 'dept_member' || normalized === 'staff') return 'staffs_dashboard.html';
    return 'customer_dashboard.html';
  }

  async function login(credentials) {
    const result = await request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });
    const token = result.session?.access_token;
    if (!token) throw new Error('The server did not return an access token.');
    sessionStorage.setItem(TOKEN_KEY, token);
    const profile = await request('/auth/me', { token });
    saveSession(profile.user, token);
    return { user: profile.user, token };
  }

  async function signup(payload) {
    const result = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        full_name: payload.full_name,
        email: payload.email,
        password: payload.password,
      }),
    });

    const token = result.session?.access_token;
    if (!token) return { requiresEmailConfirmation: true, message: result.message };

    sessionStorage.setItem(TOKEN_KEY, token);
    const profile = await request('/auth/me', { token });
    saveSession(profile.user, token);
    return { user: profile.user, token };
  }

  async function refreshCurrentUser() {
    if (!getToken()) return null;
    const result = await request('/auth/me');
    sessionStorage.setItem(USER_KEY, JSON.stringify(result.user));
    return result.user;
  }

  async function logout() {
    clearSession();
    return true;
  }

  window.ServiceFlowAuth = {
    getCurrentUser,
    getToken,
    saveSession,
    clearSession,
    refreshCurrentUser,
    login,
    signup,
    logout,
    getDashboardPage: dashboardPage,
  };

  window.ServiceFlowApi = {
    getDepartments: async () => (await request('/departments')).data || [],
    getStaff: async (departmentId) => {
      const query = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : '';
      return (await request(`/staff${query}`)).data || [];
    },
    getComplaints: async () => (await request('/complaints')).data || [],
    createComplaint: async (payload) => (await request('/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    })).data,
    updateComplaintStatus: async (id, status) => (await request(`/complaints/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })).data,
    addReply: async (id, message) => (await request(`/complaints/${encodeURIComponent(id)}/replies`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })).data,
    getAnnouncements: async () => (await request('/announcements')).data || [],
    createAnnouncement: async (payload) => (await request('/announcements', {
      method: 'POST',
      body: JSON.stringify(payload),
    })).data,
    request,
  };
})();
