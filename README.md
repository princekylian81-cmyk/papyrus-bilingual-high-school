# Papyrus Bilingual High School

Static pages served by a small Node.js/Express web server. The application database and submission service are not integrated yet.

## Requirements

- Node.js 20 or newer
## Local setup

1. Install dependencies with `npm install`.
2. Start the website with `npm start`, then open `http://localhost:3000`.

The admissions form is not active yet; submissions are not saved. Connect and test a storage service before collecting personal information.

The server serves the public website files. Use TLS for production traffic and publish an approved privacy notice and retention policy before collecting personal information.

School photography is stored locally in `assets/` so it does not depend on third-party image hosts at runtime. The illustrative Pexels photographs show African students and vocational training; they are not official photographs of Papyrus Bilingual High School. The homepage credits Pexels. Photo sources: [classroom](https://www.pexels.com/photo/34526416/), [library](https://www.pexels.com/photo/34748122/), [campus](https://www.pexels.com/photo/35305047/), [lesson](https://www.pexels.com/photo/34211747/), [exams](https://www.pexels.com/photo/37456293/), [sports](https://www.pexels.com/photo/37074242/), [computer class](https://www.pexels.com/photo/30879378/), [science](https://www.pexels.com/photo/8515119/), [graduation](https://www.pexels.com/photo/10604063/), [automotive](https://www.pexels.com/photo/28153670/), [electrical systems](https://www.pexels.com/photo/34526423/), [construction learning](https://www.pexels.com/photo/39909710/), [HVAC](https://www.pexels.com/photo/6471913/), and [sewing](https://www.pexels.com/photo/20853652/). Review each source and its license before public deployment.

All pages include an English/French language toggle and an animation control. Preferences are stored in the visitor's browser, and translations are maintained in `language.js`. The homepage carousel advances automatically every seven seconds when motion is enabled, with controls for manual navigation.

The shared visual system uses the school's navy, institutional blue, red and light-blue palette, with editorial page headers, full-bleed carousel photography, staggered image reveals, and subtle pointer-responsive movement on capable desktop devices. Below-the-fold photographs use native lazy loading; decorative pointer and tilt effects are omitted for reduced-motion and coarse-pointer devices. Supported browsers also receive a restrained cross-page view transition. No WebGL dependency is required.

## Fonctionnalités différées

La page `admin.html` est une maquette statique. Aucun dossier n'est enregistré et aucune API d'administration n'est disponible pour le moment.

## Configuration

- `PORT` — HTTP port (defaults to 3000).
- `TRUST_PROXY=true` — set only when the server is behind a trusted reverse proxy.
