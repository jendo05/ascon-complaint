const loginForm = document.querySelector('.auth-form');
const loginError = document.getElementById('login-error');

function getRedirectTarget(defaultRole) {
  const redirect = new URLSearchParams(window.location.search).get('redirect');
  if (!redirect) {
    return window.ServiceFlowAuth.getDashboardPage(defaultRole);
  }
  const page = redirect.split(/[\\/]/).pop();
  const allowedPages = ['customer_dashboard.html', 'staffs_dashboard.html', 'admin_dashboard.html', 'index.html'];
  return allowedPages.includes(page) ? page : window.ServiceFlowAuth.getDashboardPage(defaultRole);
}

document.querySelectorAll('.password-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const targetId = button.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    button.textContent = isPassword ? 'Hide' : 'Show';
  });
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';

  const formData = new FormData(loginForm);
  const data = {
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || ''),
    role: String(formData.get('role') || '').trim(),
  };

  if (!data.email) {
    loginError.textContent = 'Email is required.';
    return;
  }
  if (!data.password) {
    loginError.textContent = 'Password is required.';
    return;
  }
  if (!data.role) {
    loginError.textContent = 'Please select a role.';
    return;
  }

  try {
    const result = await window.ServiceFlowAuth.login(data);
    const redirectTarget = getRedirectTarget(result.user?.role || data.role);
    window.location.href = redirectTarget;
  } catch (error) {
    loginError.textContent = error.message || 'Login failed. Please try again.';
  }
});
