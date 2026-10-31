'use strict';

(function () {
  const root = document.documentElement;
  const themeKey = 'serviceflow-theme';

  function readTheme() {
    try {
      return localStorage.getItem(themeKey) || 'dark';
    } catch (_error) {
      return 'dark';
    }
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem(themeKey, theme); } catch (_error) { /* Theme still works for this page. */ }
    document.querySelectorAll('.theme-toggle').forEach((button) => {
      button.setAttribute('aria-pressed', String(theme === 'light'));
      button.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
    });
  }

  setTheme(readTheme());

  const loader = document.querySelector('.loader-screen');
  const landing = document.querySelector('.landing-shell');
  if (loader && landing) {
    landing.classList.remove('hidden');
    window.requestAnimationFrame(() => loader.classList.add('fade-out'));
    window.setTimeout(() => loader.classList.add('hidden'), 420);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.theme-toggle');
    if (!button) return;
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  });
})();
