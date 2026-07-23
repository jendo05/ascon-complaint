# ASCON Complaint Portal

Project reorganized to separate static client files and (future) server code.

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
- Two empty utility files (store.js, storage.js) were preserved in `public/`. Remove or implement them as needed.

If you want, next steps can include:
- Add a simple dev server and package.json
- Add linting (ESLint) and formatters (Prettier)
- Split client/server responsibilities further and add a build step
- Remove unused/empty files or consolidate duplicate logic

If any files were expected to be server-side, tell me which ones and they'll be moved into `server/` and adjusted accordingly.
