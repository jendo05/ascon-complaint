(function () {
  function getCurrentUser() {
    return window.ServiceFlowAuth?.getCurrentUser?.() || null;
  }

  function getDashboardPage(role) {
    return window.ServiceFlowAuth?.getDashboardPage?.(role) || 'customer_dashboard.html';
  }

  function isTestMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('test') === 'true' || params.get('debug') === 'true';
  }

  function ensureAuthenticated(allowedRoles = []) {
    if (isTestMode()) {
      return true;
    }

    const user = getCurrentUser();
    if (!user) {
      const currentPage = window.location.pathname.split('/').pop() || window.location.pathname;
      const redirect = encodeURIComponent(currentPage);
      window.location.replace(`login.html?redirect=${redirect}`);
      return false;
    }

    if (allowedRoles.length) {
      const role = String(user.role || '').toLowerCase();
      const allowed = allowedRoles.map((entry) => String(entry).toLowerCase());
      if (!allowed.includes(role)) {
        window.location.replace(getDashboardPage(user.role));
        return false;
      }
    }

    return true;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (isTestMode()) {
      return;
    }

    const path = window.location.pathname.split('/').pop() || '';
    if (path.includes('customer_dashboard')) {
      ensureAuthenticated(['customer']);
    } else if (path.includes('staffs_dashboard')) {
      ensureAuthenticated(['staff']);
    } else if (path.includes('admin_dashboard')) {
      ensureAuthenticated(['admin']);
    }
  });
})();
