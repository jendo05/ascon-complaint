# ASCON Complaint Portal

Project reorganized to separate static client files.

Structure after cleanup:

- public/             — static website files (HTML, CSS, JS, images)
  - API/              — client-side API helpers (e.g., Auth.js)
  - utils/            — client utilities (e.g., authguard.js)
  - shared/           — shared client modules (portal-state, dashboard-sync)
  - img/              — images and static assets
  - *.html, *.css, *.js — main entry files


Notes:
- Open the site by serving the `public/` folder (e.g., `npx serve public` or any static file server).
- Client code was left intact but moved into `public/` so references remain consistent with the HTML files.
