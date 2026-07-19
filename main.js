const themeToggleButtons = document.querySelectorAll(
  ".theme-toggle"
);
const storedTheme = localStorage.getItem("serviceflow-theme") || "dark";
const htmlElement = document.documentElement;

function setTheme(theme) {
  htmlElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("serviceflow-theme", theme);
}

function toggleTheme() {
  const next = htmlElement.classList.contains("dark") ? "light" : "dark";
  setTheme(next);
}

if (themeToggleButtons.length) {
  themeToggleButtons.forEach((button) => {
    button.addEventListener("click", toggleTheme);
  });
}

if (!htmlElement.classList.contains("dark") && !htmlElement.classList.contains("light")) {
  setTheme(storedTheme);
}

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.querySelector(".loader-screen");
  const landing = document.querySelector(".landing-shell");
  if (loader && landing) {
    setTimeout(() => {
      loader.classList.add("opacity-0", "invisible", "pointer-events-none");
      landing.classList.remove("hidden");
      loader.classList.add("hidden");
    }, 1000);
  }
});
