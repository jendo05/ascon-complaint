'use strict';

const signupForm = document.querySelector('.auth-form');
const formError = document.getElementById('form-error');
const nameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const signupButton = signupForm?.querySelector('button[type="submit"]');

function validateName(value) {
  const name = value.trim();
  if (!name) return 'Full name is required.';
  if (name.length < 2) return 'Enter at least 2 characters.';
  return '';
}

function validatePassword(value) {
  if (value.length < 8) return 'Password must be at least 8 characters.';
  return '';
}

function setFieldError(id, message) {
  const element = document.getElementById(id);
  if (element) element.textContent = message;
}

document.querySelectorAll('.password-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    button.textContent = input.type === 'password' ? 'Show' : 'Hide';
  });
});

nameInput?.addEventListener('blur', () => setFieldError('fullname-error', validateName(nameInput.value)));
passwordInput?.addEventListener('blur', () => setFieldError('password-error', validatePassword(passwordInput.value)));
confirmPasswordInput?.addEventListener('blur', () => {
  setFieldError('confirm-password-error', confirmPasswordInput.value === passwordInput?.value ? '' : 'Passwords do not match.');
});

signupForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!formError || !signupButton) return;
  formError.textContent = '';

  const nameError = validateName(nameInput?.value || '');
  const passwordError = validatePassword(passwordInput?.value || '');
  const confirmError = confirmPasswordInput?.value === passwordInput?.value ? '' : 'Passwords do not match.';
  setFieldError('fullname-error', nameError);
  setFieldError('password-error', passwordError);
  setFieldError('confirm-password-error', confirmError);
  setFieldError('email-error', emailInput?.validity.valid ? '' : 'Enter a valid email address.');

  if (nameError || passwordError || confirmError || !emailInput?.validity.valid) return;

  signupButton.disabled = true;
  signupButton.textContent = 'Creating account…';
  try {
    const result = await window.ServiceFlowAuth.signup({
      full_name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
    });
    if (result.requiresEmailConfirmation) {
      formError.textContent = result.message || 'Account created. Check your email to confirm the address, then sign in.';
      signupForm.reset();
      return;
    }
    window.location.replace(window.ServiceFlowAuth.getDashboardPage(result.user.role));
  } catch (error) {
    formError.textContent = error.message || 'Account creation failed. Please try again.';
  } finally {
    signupButton.disabled = false;
    signupButton.textContent = 'Sign up';
  }
});
