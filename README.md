# Papyrus Bilingual High School

Papyrus Bilingual High School website with a Node.js/Express admissions API and MySQL storage.

## Requirements

- Node.js 22 or newer
- MySQL 8.0.16 or newer

## Local setup

1. Create a MySQL database and a dedicated database user.
2. Copy `.env.example` to `.env` and set the MySQL credentials and a random `ADMIN_API_TOKEN` of at least 32 characters.
3. Install dependencies with `npm install`.
4. Create the tables with `npm run db:migrate`.
5. Start the site and API with `npm start`, then open `http://localhost:3000`.

`DB_USER` and `DB_PASSWORD` define the least-privilege application account. The migration creates or updates it with only `SELECT` and `INSERT` permissions. Set `DB_MIGRATION_USER`/`DB_MIGRATION_PASSWORD` to a separate MySQL administrator account that can create tables and users and grant permissions; the migration uses the runtime credentials if these are omitted.

The form submits one birth certificate, one previous report card and exactly four passport photos. Files must be valid PDF, JPEG or PNG and no larger than 5 MB each. Documents are stored outside the public web root. The application rows and document metadata are inserted together in a MySQL transaction.

For deployment, use persistent private storage for `UPLOAD_DIR`, enable MySQL TLS with `DB_SSL=true`, set `TRUST_PROXY=true` only behind a trusted reverse proxy, and restrict `CORS_ORIGINS` to the website origin. GitHub Pages can host only the static website, not this Node.js API. To keep the current Pages frontend, set `window.PAPYRUS_API_BASE_URL` in `api-config.js` to the deployed API base URL and deploy the API separately. The backend requires a Node.js host and a reachable MySQL 8.0.16+ database.

School photography is stored locally in `assets/` so it does not depend on third-party image hosts at runtime. The illustrative Pexels photographs show African students and vocational training; they are not official photographs of Papyrus Bilingual High School. The homepage credits Pexels. Photo sources: [classroom](https://www.pexels.com/photo/34526416/), [library](https://www.pexels.com/photo/34748122/), [campus](https://www.pexels.com/photo/35305047/), [lesson](https://www.pexels.com/photo/34211747/), [exams](https://www.pexels.com/photo/37456293/), [sports](https://www.pexels.com/photo/37074242/), [computer class](https://www.pexels.com/photo/30879378/), [science](https://www.pexels.com/photo/8515119/), [graduation](https://www.pexels.com/photo/10604063/), [automotive](https://www.pexels.com/photo/28153670/), [electrical systems](https://www.pexels.com/photo/34526423/), [construction learning](https://www.pexels.com/photo/39909710/), [HVAC](https://www.pexels.com/photo/6471913/), and [sewing](https://www.pexels.com/photo/20853652/). Review each source and its license before public deployment.

All pages include an English/French language toggle and an animation control. Preferences are stored in the visitor's browser, and translations are maintained in `language.js`. The homepage carousel advances automatically every seven seconds when motion is enabled, with controls for manual navigation.

The shared visual system uses the school's navy, institutional blue, red and light-blue palette, with editorial page headers, full-bleed carousel photography, staggered image reveals, and subtle pointer-responsive movement on capable desktop devices. Below-the-fold photographs use native lazy loading; decorative pointer and tilt effects are omitted for reduced-motion and coarse-pointer devices. Supported browsers also receive a restrained cross-page view transition. No WebGL dependency is required.

## Administrator API

The secretary dashboard is served by the Node.js API at `/app/` (for example, `https://<api-domain>/app/`). It is not part of the GitHub Pages static site. Sign in with `ADMIN_API_TOKEN`; the dashboard checks the API every five seconds and lets staff review application details and download submitted documents. The token is kept in the current browser session only.

The `admin.html` page is a public static information page; it does not display private records. Use `/app/` for the secured secretary dashboard.

- `GET /api/admin/applications` — list the latest 200 applications and document metadata.
- `GET /api/admin/applications/:applicationId/documents/:documentId` — download one private document.
- Both endpoints require `Authorization: Bearer <ADMIN_API_TOKEN>`.

The token is never embedded in the site source; staff enter it at sign-in. Keep it private and sign out when finished.

## Configuration

- `PORT` — HTTP port (defaults to 3000).
- `TRUST_PROXY=true` — set only when the server is behind a trusted reverse proxy.
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — MySQL connection settings.
- `DB_SSL=true` — verify TLS for the MySQL connection in production.
- `ADMIN_API_TOKEN` — private bearer token, at least 32 characters.
- `UPLOAD_DIR` — private persistent document directory (defaults outside the project root).
- `CORS_ORIGINS` — comma-separated website origins allowed to call the API.
