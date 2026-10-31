'use strict';

const loginForm = document.querySelector('.auth-form');
const loginError = document.getElementById('login-error');
const loginButton = loginForm?.querySelector('button[type="submit"]');

function getRedirectTarget(role) {
  const redirect = new URLSearchParams(window.location.search).get('redirect');
  const allowedPages = ['customer_dashboard.html', 'staffs_dashboard.html', 'admin_dashboard.html'];
  if (redirect && allowedPages.includes(redirect.split(/[\\/]/).pop())) {
    const requested = redirect.split(/[\\/]/).pop();
    const rolePage = window.ServiceFlowAuth.getDashboardPage(role);
    return requested === rolePage ? requested : rolePage;
  }
  return window.ServiceFlowAuth.getDashboardPage(role);
}

document.querySelectorAll('.password-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    button.textContent = input.type === 'password' ? 'Show' : 'Hide';
  });
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!loginError || !loginButton) return;
  loginError.textContent = '';

  const form = new FormData(loginForm);
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  if (!email || !password) {
    loginError.textContent = 'Enter your email address and password.';
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = 'Signing in…';
  try {
    const result = await window.ServiceFlowAuth.login({ email, password });
    window.location.replace(getRedirectTarget(result.user.role));
  } catch (error) {
    loginError.textContent = error.message || 'Sign-in failed. Please try again.';
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Login';
  }
});
