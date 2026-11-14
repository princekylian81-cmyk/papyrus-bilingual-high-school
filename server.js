import 'dotenv/config';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { fileTypeFromBuffer } from 'file-type';
import multer from 'multer';
import { z } from 'zod';
import { pool } from './db.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.resolve(root, process.env.UPLOAD_DIR || '../papyrus-private-uploads');
const port = Number(process.env.PORT || 3000);
const production = process.env.NODE_ENV === 'production';
const allowedOrigins = new Set((process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean));
const allowedPages = new Set([
  'about.html',
  'admin.html',
  'admissions.html',
  'api-config.js',
  'api-config.js',
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
const allowedClasses = ['6e', 'Form I', 'Form II', 'Form III', 'Form IV', 'Form V', 'Lower Sixth', 'Upper Sixth'];
const allowedEducationTypes = ['General Education', 'Technical Commercial', 'Technical Industrial'];
const documentFields = [
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'previousReportCard', maxCount: 1 },
  { name: 'passportPhotos', maxCount: 4 }
];
const applicationSchema = z.object({
  studentName: z.string().trim().min(2).max(120),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['Female', 'Male']),
  guardianName: z.string().trim().min(2).max(120),
  fatherPhone: z.string().trim().regex(/^[+0-9][0-9+() .-]{5,23}$/),
  motherPhone: z.string().trim().regex(/^[+0-9][0-9+() .-]{5,23}$/),
  email: z.string().trim().email().max(254),
  desiredClass: z.enum(allowedClasses),
  educationType: z.enum(allowedEducationTypes),
  consent: z.literal('yes'),
  specialty: z.string().trim().max(120).optional().default('')
}).strict();

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

app.use((req, res, next) => {
  const origin = req.get('origin');
  const sameOrigin = origin && origin === `${req.protocol}://${req.get('host')}`;

  if (origin && !sameOrigin && !allowedOrigins.has(origin)) {
    res.status(403).json({ error: 'This website is not allowed to use the application service.' });
    return;
  }

  if (origin && (sameOrigin || allowedOrigins.has(origin))) {
    res.set('Access-Control-Allow-Origin', origin);
    res.vary('Origin');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type');
  }

  if (req.method === 'OPTIONS' && req.path.startsWith('/api/')) {
    res.sendStatus(204);
    return;
  }
  next();
});

const applicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many applications from this connection. Please try again later.' }
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
    fields: 11,
    fieldNameSize: 64,
    fieldSize: 1024,
    parts: 17
  }
});

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/applications', applicationLimiter, requireApplicationOrigin, (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  upload.fields(documentFields)(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }
    saveApplication(req, res).catch(next);
  });
});

app.get('/api/admin/applications', requireAdmin, async (req, res, next) => {
  try {
    const [applications] = await pool.execute(`
      SELECT
        id,
        student_name AS studentName,
        date_of_birth AS dateOfBirth,
        gender,
        guardian_name AS guardianName,
        father_phone AS fatherPhone,
        mother_phone AS motherPhone,
        email,
        desired_class AS desiredClass,
        education_type AS educationType,
        specialty,
        consent_at AS consentAt,
        status,
        created_at AS createdAt
      FROM applications
      ORDER BY created_at DESC
      LIMIT 200
    `);

    if (applications.length === 0) {
      res.set('Cache-Control', 'no-store').json({ applications: [] });
      return;
    }

    const placeholders = applications.map(() => '?').join(', ');
    const applicationIds = applications.map((application) => application.id);
    const [documents] = await pool.execute(`
      SELECT id, application_id AS applicationId, document_type AS type,
        passport_photo_number AS photoNumber, media_type AS mediaType, size_bytes AS sizeBytes
      FROM application_documents
      WHERE application_id IN (${placeholders})
      ORDER BY created_at
    `, applicationIds);
    const documentsByApplication = new Map();
    for (const document of documents) {
      const current = documentsByApplication.get(document.applicationId) || [];
      current.push({
        id: document.id,
        type: document.type,
        photoNumber: document.photoNumber,
        mediaType: document.mediaType,
        sizeBytes: document.sizeBytes
      });
      documentsByApplication.set(document.applicationId, current);
    }

    res.set('Cache-Control', 'no-store').json({
      applications: applications.map((application) => ({
        ...application,
        documents: documentsByApplication.get(application.id) || []
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/applications/:applicationId/documents/:documentId', requireAdmin, async (req, res, next) => {
  try {
    const ids = z.object({
      applicationId: z.string().uuid(),
      documentId: z.string().uuid()
    }).safeParse(req.params);

    if (!ids.success) {
      res.status(400).json({ error: 'Invalid application or document reference.' });
      return;
    }

    const [documents] = await pool.execute(
      `SELECT storage_key AS storageKey, media_type AS mediaType
       FROM application_documents
       WHERE id = ? AND application_id = ?`,
      [ids.data.documentId, ids.data.applicationId]
    );
    if (documents.length === 0) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    const { storageKey, mediaType } = documents[0];
    const documentPath = path.resolve(uploadDirectory, storageKey);
    if (path.dirname(documentPath) !== uploadDirectory) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    res.set({
      'Cache-Control': 'no-store',
      'Content-Type': mediaType,
      'Content-Disposition': `attachment; filename="application-document.${extensionFor(mediaType)}"`,
      'X-Content-Type-Options': 'nosniff'
    });
    res.sendFile(documentPath, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    next(error);
  }
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
  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    res.status(tooLarge ? 413 : 400).json({
      error: tooLarge
        ? 'Each uploaded document must be no larger than 5 MB.'
        : 'The uploaded files or form fields do not match the application requirements.'
    });
    return;
  }

  console.error('Request failed:', error);
  res.status(500).json({
    error: production
      ? 'The application service is temporarily unavailable. Please try again later.'
      : 'The request could not be completed. Check the server logs for details.'
  });
});

async function saveApplication(req, res) {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Please check the application details and try again.' });
    return;
  }

  const data = parsed.data;
  const birthDate = new Date(`${data.dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(birthDate.getTime()) || birthDate.toISOString().slice(0, 10) !== data.dateOfBirth || birthDate > new Date()) {
    res.status(400).json({ error: 'Please enter a valid date of birth.' });
    return;
  }
  if (data.educationType === 'General Education' && data.specialty) {
    res.status(400).json({ error: 'A specialty should only be selected for a technical program.' });
    return;
  }
  if (data.educationType !== 'General Education' && !data.specialty) {
    res.status(400).json({ error: 'Please enter the desired technical specialty.' });
    return;
  }

  const fields = req.files || {};
  const birthCertificate = fields.birthCertificate || [];
  const previousReportCard = fields.previousReportCard || [];
  const passportPhotos = fields.passportPhotos || [];
  if (birthCertificate.length !== 1 || previousReportCard.length !== 1 || passportPhotos.length !== 4) {
    res.status(400).json({ error: 'Please attach one birth certificate, one previous report card and exactly four passport photos.' });
    return;
  }

  const submittedDocuments = [
    { file: birthCertificate[0], type: 'birth_certificate', photoNumber: null },
    { file: previousReportCard[0], type: 'previous_report_card', photoNumber: null },
    ...passportPhotos.map((file, index) => ({ file, type: 'passport_photo', photoNumber: index + 1 }))
  ];
  for (const document of submittedDocuments) {
    const detectedType = await fileTypeFromBuffer(document.file.buffer);
    if (!detectedType || !['application/pdf', 'image/jpeg', 'image/png'].includes(detectedType.mime)) {
      res.status(400).json({ error: 'Documents must be valid PDF, JPEG or PNG files.' });
      return;
    }
    document.mediaType = detectedType.mime;
    document.storageKey = `${randomUUID()}.${extensionFor(detectedType.mime)}`;
    document.id = randomUUID();
  }

  await mkdir(uploadDirectory, { recursive: true, mode: 0o700 });
  const applicationId = randomUUID();
  const writtenFiles = [];
  let connection;
  try {
    for (const document of submittedDocuments) {
      const fullPath = path.join(uploadDirectory, document.storageKey);
      writtenFiles.push(fullPath);
      await writeFile(fullPath, document.file.buffer, { flag: 'wx', mode: 0o600 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO applications (
        id, student_name, date_of_birth, gender, guardian_name, father_phone, mother_phone,
        email, desired_class, education_type, specialty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicationId,
        data.studentName,
        data.dateOfBirth,
        data.gender,
        data.guardianName,
        data.fatherPhone,
        data.motherPhone,
        data.email,
        data.desiredClass,
        data.educationType,
        data.specialty || null
      ]
    );

    for (const document of submittedDocuments) {
      await connection.execute(
        `INSERT INTO application_documents (
          id, application_id, document_type, passport_photo_number, storage_key, media_type, size_bytes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          document.id,
          applicationId,
          document.type,
          document.photoNumber,
          document.storageKey,
          document.mediaType,
          document.file.size
        ]
      );
    }

    await connection.commit();
    res.status(201).json({ reference: applicationId });
  } catch (error) {
    if (connection) await connection.rollback().catch((rollbackError) => {
      console.error('Application transaction rollback failed:', rollbackError);
    });
    await Promise.all(writtenFiles.map((filePath) => unlink(filePath).catch((cleanupError) => {
      console.error('Failed to remove an uncommitted application document:', cleanupError);
    })));
    throw error;
  } finally {
    connection?.release();
  }
}

function requireApplicationOrigin(req, res, next) {
  const origin = req.get('origin');
  const sameOrigin = origin && origin === `${req.protocol}://${req.get('host')}`;
  if (!origin || (!sameOrigin && !allowedOrigins.has(origin))) {
    res.status(403).json({ error: 'Application submission must come from the school website.' });
    return;
  }
  next();
}

function requireAdmin(req, res, next) {
  const configuredToken = process.env.ADMIN_API_TOKEN;
  const supplied = req.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!configuredToken || configuredToken.length < 32 || !supplied) {
    res.status(401).json({ error: 'Administrator authorization required.' });
    return;
  }

  const expectedBuffer = Buffer.from(configuredToken);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    res.status(401).json({ error: 'Administrator authorization required.' });
    return;
  }
  next();
}

function extensionFor(mediaType) {
  return {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png'
  }[mediaType];
}

if (production && (!process.env.ADMIN_API_TOKEN || process.env.ADMIN_API_TOKEN.length < 32)) {
  throw new Error('ADMIN_API_TOKEN must contain at least 32 characters in production.');
}

await pool.query('SELECT 1');
app.listen(port, () => {
  console.log(`Papyrus website and application API listening on port ${port}.`);
});
