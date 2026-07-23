(function () {
  const STORAGE_KEYS = {
    users: 'serviceflow-users',
    currentUser: 'serviceflow-current-user',
    authToken: 'serviceflow-auth-token',
  };

  const DEFAULT_API_BASE = '/api';

  function getConfig() {
    return window.SERVICEFLOW_CONFIG || {};
  }

  function getApiBaseUrl() {
    return getConfig().apiBaseUrl || DEFAULT_API_BASE;
  }

  function normalizeRole(role) {
    return String(role || '').trim();
  }

  function getStoredUsers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.users);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.warn('Unable to read stored users', error);
      return [];
    }
  }

  function saveStoredUsers(users) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Unable to read current user', error);
      return null;
    }
  }

  function saveCurrentUser(user, token) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
    if (token) {
      localStorage.setItem(STORAGE_KEYS.authToken, token);
    }
  }

  function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    localStorage.removeItem(STORAGE_KEYS.authToken);
  }

  function getDashboardPage(role) {
    const normalizedRole = normalizeRole(role).toLowerCase();
    if (normalizedRole === 'staff') return 'staffs_dashboard.html';
    if (normalizedRole === 'admin') return 'admin_dashboard.html';
    return 'customer_dashboard.html';
  }

  async function request(path, options = {}) {
    const token = localStorage.getItem(STORAGE_KEYS.authToken);
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || 'Request failed.');
    }
    return result;
  }

  async function login(credentials) {
    try {
      const result = await request('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (result.user) {
        saveCurrentUser(result.user, result.token || 'mock-token');
        return result;
      }
      throw new Error('Login failed.');
    } catch (error) {
      if (error instanceof TypeError) {
        return localLogin(credentials);
      }
      throw error;
    }
  }

  async function localLogin(credentials) {
    const savedUsers = getStoredUsers();
    const user = savedUsers.find((entry) => entry.email?.toLowerCase() === credentials.email?.toLowerCase());
    if (!user) {
      throw new Error('No account found for that email.');
    }
    if (user.password !== credentials.password) {
      throw new Error('Invalid password.');
    }
    if (normalizeRole(user.role) !== normalizeRole(credentials.role)) {
      throw new Error('Please select the correct role for this account.');
    }
    saveCurrentUser(user, 'mock-token');
    return { user, token: 'mock-token' };
  }

  async function signup(payload) {
    try {
      const result = await request('/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (result.user) {
        saveCurrentUser(result.user, result.token || 'mock-token');
        return result;
      }
      throw new Error('Signup failed.');
    } catch (error) {
      if (error instanceof TypeError) {
        return localSignup(payload);
      }
      throw error;
    }
  }

  async function localSignup(payload) {
    const savedUsers = getStoredUsers();
    const existingUser = savedUsers.find((entry) => entry.email?.toLowerCase() === payload.email?.toLowerCase());
    if (existingUser) {
      throw new Error('An account with that email already exists.');
    }

    const user = {
      id: `user-${Date.now()}`,
      username: payload.username,
      email: payload.email,
      role: normalizeRole(payload.role) || 'Customer',
      password: payload.password,
      createdAt: new Date().toISOString(),
    };

    savedUsers.push(user);
    saveStoredUsers(savedUsers);
    saveCurrentUser(user, 'mock-token');
    return { user, token: 'mock-token' };
  }

  async function logout() {
    clearCurrentUser();
    return true;
  }

  window.ServiceFlowAuth = {
    getCurrentUser,
    saveCurrentUser,
    clearCurrentUser,
    login,
    signup,
    logout,
    getDashboardPage,
    getApiBaseUrl,
  };
})();
