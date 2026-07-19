const signupForm = document.querySelector('.auth-form');
const formError = document.getElementById('form-error');
const fullnameError = document.getElementById('fullname-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const confirmPasswordError = document.getElementById('confirm-password-error');

const nameOfUser = document.getElementById('username');
const emailOfUser = document.getElementById('email');
const roleOfUser = document.getElementById('role');
const passwordOfUser = document.getElementById('password');
const confirmPasswordOfUser = document.getElementById('confirm-password');

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

function validateName(value) {
  if (!value.trim()) return 'Fullname is required';
  if (value.trim().length < 3) return 'Fullname must be at least 3 characters';
  return '';
}

function validateEmail(value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!value.trim()) return 'Please enter your email address';
  if (!emailRegex.test(value)) return 'Please enter a valid email address';
  return '';
}

function validatePassword(value) {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(value)) return 'Password must contain at least one letter and one number';
  return '';
}

function validateConfirmPassword(value) {
  if (value !== passwordOfUser.value) return 'Passwords do not match';
  return '';
}

nameOfUser?.addEventListener('blur', () => {
  fullnameError.textContent = validateName(nameOfUser.value);
});

emailOfUser?.addEventListener('blur', () => {
  emailError.textContent = validateEmail(emailOfUser.value);
});

passwordOfUser?.addEventListener('blur', () => {
  passwordError.textContent = validatePassword(passwordOfUser.value);
  confirmPasswordError.textContent = validateConfirmPassword(confirmPasswordOfUser.value);
});

confirmPasswordOfUser?.addEventListener('blur', () => {
  confirmPasswordError.textContent = validateConfirmPassword(confirmPasswordOfUser.value);
});

signupForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.textContent = '';

  const fullnameErrorMessage = validateName(nameOfUser?.value || '');
  const emailErrorMessage = validateEmail(emailOfUser?.value || '');
  const passwordErrorMessage = validatePassword(passwordOfUser?.value || '');
  const confirmPasswordErrorMessage = validateConfirmPassword(confirmPasswordOfUser?.value || '');

  fullnameError.textContent = fullnameErrorMessage;
  emailError.textContent = emailErrorMessage;
  passwordError.textContent = passwordErrorMessage;
  confirmPasswordError.textContent = confirmPasswordErrorMessage;

  if (fullnameErrorMessage || emailErrorMessage || passwordErrorMessage || confirmPasswordErrorMessage) {
    return;
  }

  const formData = new FormData(signupForm);
  const payload = {
    username: String(formData.get('username') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    role: String(formData.get('role') || 'Customer').trim(),
    password: String(formData.get('password') || ''),
  };

  try {
    await window.ServiceFlowAuth.signup(payload);
    window.location.href = window.ServiceFlowAuth.getDashboardPage(payload.role);
  } catch (error) {
    formError.textContent = error.message || 'Signup failed. Please try again.';
  }
});
