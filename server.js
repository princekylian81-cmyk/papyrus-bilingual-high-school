import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const production = process.env.NODE_ENV === 'production';
const allowedPages = new Set([
  'about.html',
  'admin.html',
  'admissions.html',
  'fees.html',
  'index.html',
  'language.js',
  'papyrus-logo.png',
  'programs.html',
  'school-life.html',
  'specialties.html',
  'styles.css',
  'script.js',
  'robots.txt',
  'sitemap.xml'
]);
const allowedAssets = new Set([
  'automotive-training.jpg',
  'construction-training.jpg',
  'electrical-training.jpg',
  'hvac-training.jpg',
  'learning-pexels.jpg',
  'papyrus-logo.png',
  'sewing-training.jpg',
  'students-campus.jpg',
  'students-classroom.jpg',
  'students-computer-lab.jpg',
  'students-exams.jpg',
  'students-graduation.jpg',
  'students-lecture.jpg',
  'students-science.jpg',
  'students-sports.jpg'
]);
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);

app.use((req, res, next) => {
  if (production && !req.secure) {
    res.status(400).json({ error: 'HTTPS is required.' });
    return;
  }
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  next();
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/applications', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(503).json({ error: 'Application submissions are temporarily unavailable.' });
});

app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));
app.get('/assets/:asset', (req, res, next) => {
  if (!allowedAssets.has(req.params.asset)) {
    next();
    return;
  }
  res.sendFile(path.join(root, 'assets', req.params.asset));
});
app.get('/:file', (req, res, next) => {
  if (!allowedPages.has(req.params.file)) {
    next();
    return;
  }
  res.sendFile(path.join(root, req.params.file));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  console.error('Request failed:', error);
  res.status(500).json({
    error: production
      ? 'The application service is temporarily unavailable. Please try again later.'
      : 'The request could not be completed. Check the server logs for details.'
  });
});

app.listen(port, () => {
  console.log(`Papyrus website listening on port ${port}.`);
});
