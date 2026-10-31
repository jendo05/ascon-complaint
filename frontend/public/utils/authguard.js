(function () {
  'use strict';

  function expectedRole(path) {
    if (path.includes('customer_dashboard')) return ['customer'];
    if (path.includes('staffs_dashboard')) return ['dept_member'];
    if (path.includes('admin_dashboard')) return ['admin'];
    return [];
  }

  const path = window.location.pathname.split('/').pop() || '';
  const roles = expectedRole(path);

  window.ServiceFlowAuthReady = (async () => {
    if (!roles.length) return true;

    if (!window.ServiceFlowAuth?.getToken()) {
      const redirect = encodeURIComponent(path || 'index.html');
      window.location.replace(`login.html?redirect=${redirect}`);
      return false;
    }

    try {
      const user = await window.ServiceFlowAuth.refreshCurrentUser();
      if (!user) throw new Error('No active user session.');
      if (!roles.includes(String(user.role || '').toLowerCase())) {
        window.location.replace(window.ServiceFlowAuth.getDashboardPage(user.role));
        return false;
      }
      return true;
    } catch (_error) {
      window.ServiceFlowAuth.clearSession();
      const redirect = encodeURIComponent(path || 'index.html');
      window.location.replace(`login.html?redirect=${redirect}`);
      return false;
    }
  })();
})();
