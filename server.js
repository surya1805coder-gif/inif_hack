import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Load .env.local first, fallback to .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// CORS SECURITY POLICY
// ==========================================
export const ALLOWED_ORIGINS = [
  'https://infinity.akao.in',
  'https://infinity-hackathon-2026.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

export function isAllowedOrigin(origin, appUrl = process.env.APP_URL) {
  if (!origin) return true; // Direct same-origin or non-browser requests
  const cleanOrigin = origin.toLowerCase().trim();
  if (appUrl && cleanOrigin === appUrl.toLowerCase().replace(/\/$/, '')) {
    return true;
  }
  if (ALLOWED_ORIGINS.some(o => o.toLowerCase() === cleanOrigin)) {
    return true;
  }
  if (/^https:\/\/[a-z0-9-]+\.infinity-hackathon-2026\.pages\.dev$/.test(cleanOrigin)) {
    return true;
  }
  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Cross-origin request blocked by CORS security policy.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
};

app.use(cors(corsOptions));

// Explicit CORS Error Interceptor
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes('CORS security policy')) {
    return res.status(403).json({
      success: false,
      error: 'Cross-origin request blocked by CORS security policy.'
    });
  }
  next(err);
});
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ==========================================
// RATE LIMITING & BRUTE-FORCE PROTECTION
// ==========================================
export class MemoryRateLimiter {
  constructor({ windowMs, maxRequests, message }) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message || 'Too many requests. Please try again later.';
    this.hits = new Map();
  }

  isLimited(key) {
    const now = Date.now();
    const timestamps = this.hits.get(key) || [];
    const valid = timestamps.filter(t => now - t < this.windowMs);

    if (valid.length >= this.maxRequests) {
      const oldest = valid[0];
      const retryAfter = Math.max(1, Math.ceil((this.windowMs - (now - oldest)) / 1000));
      return {
        limited: true,
        remaining: 0,
        retryAfter,
        message: this.message
      };
    }

    valid.push(now);
    this.hits.set(key, valid);
    return {
      limited: false,
      remaining: this.maxRequests - valid.length,
      retryAfter: 0
    };
  }

  reset(key) {
    this.hits.delete(key);
  }
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['cf-connecting-ip'] || req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

export const apiRateLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 600,
  message: 'API rate limit exceeded. Please slow down.'
});

export const authRateLimiter = new MemoryRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 30,
  message: 'Too many failed login attempts. Access temporarily locked. Please wait 5 minutes before trying again.'
});

export const regRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 50,
  message: 'Registration rate limit reached. Please wait a few minutes before submitting another registration.'
});

export const fgtRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  message: 'Too many password reset attempts. Please wait 15 minutes before trying again.'
});

// General API Rate Limiting Middleware (600 req / min)
app.use('/api', (req, res, next) => {
  const ip = getClientIp(req);
  const check = apiRateLimiter.isLimited(`${ip}:api`);
  res.setHeader('X-RateLimit-Limit', '600');
  res.setHeader('X-RateLimit-Remaining', String(check.remaining));

  if (check.limited) {
    res.setHeader('Retry-After', String(check.retryAfter));
    return res.status(429).json({
      success: false,
      error: check.message,
      retryAfter: check.retryAfter
    });
  }
  next();
});

// ==========================================
// STATIC FILES & SENSITIVE ROUTE SHIELD
// ==========================================
// Explicitly block direct HTTP access to data, source code, and configuration files
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (
    p.startsWith('/data') ||
    p.startsWith('/.env') ||
    p.startsWith('/scratch') ||
    p.startsWith('/functions') ||
    p.startsWith('/node_modules') ||
    p === '/server.js' ||
    p === '/package.json' ||
    p === '/package-lock.json' ||
    p === '/wrangler.toml' ||
    p.endsWith('.tmp')
  ) {
    return res.status(403).json({ success: false, error: 'Access forbidden.' });
  }
  next();
});

// Static public media and uploads
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Serve dist static assets if built
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Serve front-end HTML pages explicitly
const htmlPages = ['admin', 'coordinator', 'judges', 'leader'];
htmlPages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    const distPath = path.join(distDir, `${page}.html`);
    if (fs.existsSync(distPath)) return res.sendFile(distPath);
    return res.sendFile(path.join(__dirname, `${page}.html`));
  });
});

app.get('/', (req, res) => {
  const distIndex = path.join(distDir, 'index.html');
  if (fs.existsSync(distIndex)) return res.sendFile(distIndex);
  return res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// CLOUDFLARE R2 CONFIGURATION
// ==========================================
const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'infinity-hackathon-bucket';
const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

const isR2Enabled = Boolean(accountId && accessKeyId && secretAccessKey && bucketName);

let s3Client = null;
if (isR2Enabled) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });
  console.log(`[R2 Storage] Connected to Cloudflare R2 bucket: ${bucketName}`);
} else {
  console.log('[R2 Storage] Running with local persistent filesystem storage fallback.');
}

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const R2_DB_KEY = 'state/database.json';

// Stone & Domain Normalization Map
export const STONE_DOMAIN_MAP = {
  mind: 'transportation',
  transportation: 'transportation',
  space: 'cybersecurity',
  cybersecurity: 'cybersecurity',
  reality: 'infrastructure',
  infrastructure: 'infrastructure',
  power: 'cleantech',
  cleantech: 'cleantech',
  time: 'education',
  education: 'education',
  soul: 'healthcare',
  healthcare: 'healthcare',
  // Backward compatibility with previous keys
  intelligence: 'transportation',
  connectivity: 'cybersecurity',
  digital: 'infrastructure',
  automation: 'cleantech',
  analytics: 'education',
  impact: 'healthcare'
};

export function normalizeDomainId(val) {
  if (!val) return 'transportation';
  const clean = String(val).toLowerCase().replace(/ stone$/i, '').trim();
  return STONE_DOMAIN_MAP[clean] || clean;
}

// Initial Domains — Marvel Infinity Stones
const INITIAL_DOMAINS = [
  {
    "id": "transportation",
    "stoneId": "mind",
    "stoneName": "Mind Stone",
    "domainName": "TRANSPORTATION & LOGISTICS",
    "tagline": "Mobility • Supply Chain • Routing",
    "marvelTheme": "Vision Neural Gold",
    "accentHex": "#ffd000",
    "accentRgb": "255, 208, 0",
    "iconName": "Navigation",
    "stoneSymbol": "The Vision Core",
    "roomAllocated": "Lab Block 3 (CS-301)",
    "techStackSuggestions": [
      "Python",
      "FastAPI",
      "Mapbox / GIS",
      "Kafka",
      "React",
      "OR-Tools"
    ],
    "isPsReleased": false,
    "psReleaseDate": "2026-10-10T09:00:00Z",
    "description": "Pioneer intelligent traffic management, emergency route optimization, real-time public transit tracking, and dynamic supply chain logistics to eliminate urban congestion.",
    "problemStatements": []
  },
  {
    "id": "cybersecurity",
    "stoneId": "space",
    "stoneName": "Space Stone",
    "domainName": "CYBERSECURITY & DIGITAL TRUST",
    "tagline": "Cybersecurity • Privacy • Cryptography",
    "marvelTheme": "Tesseract Cyan",
    "accentHex": "#00d2ff",
    "accentRgb": "0, 210, 255",
    "iconName": "Shield",
    "stoneSymbol": "The Tesseract",
    "roomAllocated": "Lab Block 2 (IoT-204)",
    "techStackSuggestions": [
      "Rust",
      "Go",
      "Python",
      "eBPF",
      "Cryptography",
      "SIEM / ELK"
    ],
    "isPsReleased": false,
    "psReleaseDate": "2026-10-10T09:00:00Z",
    "description": "Engineer resilient digital trust architectures, intelligent phishing and fraud detection, secure digital identity verification, and proactive cyber threat defense.",
    "problemStatements": []
  },
  {
    "id": "infrastructure",
    "stoneId": "reality",
    "stoneName": "Reality Stone",
    "domainName": "DIGITAL PUBLIC INFRASTRUCTURE",
    "tagline": "Digital Platforms • Services • E-Governance",
    "marvelTheme": "Aether Crimson",
    "accentHex": "#ff2a4b",
    "accentRgb": "255, 42, 75",
    "iconName": "Globe",
    "stoneSymbol": "The Aether Prism",
    "roomAllocated": "Innovation Wing (IW-102)",
    "techStackSuggestions": [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "PostgreSQL",
      "Flutter"
    ],
    "isPsReleased": false,
    "psReleaseDate": "2026-10-10T09:00:00Z",
    "description": "Construct unified digital public infrastructure, smart civic grievance platforms, transparent governance dashboards, and verified digital citizen services.",
    "problemStatements": []
  },
  {
    "id": "cleantech",
    "stoneId": "power",
    "stoneName": "Power Stone",
    "domainName": "CLEAN & GREEN TECHNOLOGY",
    "tagline": "Environment • Waste • Sustainability",
    "marvelTheme": "Thanos Void Purple",
    "accentHex": "#b026ff",
    "accentRgb": "176, 38, 255",
    "iconName": "Zap",
    "stoneSymbol": "The Orb of Morag",
    "roomAllocated": "Hardware & IoT Arena (HA-01)",
    "techStackSuggestions": [
      "Python",
      "IoT / ESP32",
      "React",
      "MQTT",
      "TensorFlow",
      "FastAPI"
    ],
    "isPsReleased": false,
    "psReleaseDate": "2026-10-10T09:00:00Z",
    "description": "Develop sustainable clean technologies, intelligent waste and recycling systems, smart water conservation platforms, and real-time carbon footprint optimization.",
    "problemStatements": []
  },
  {
    "id": "education",
    "stoneId": "time",
    "stoneName": "Time Stone",
    "domainName": "SMART EDUCATION",
    "tagline": "EdTech • Learning • Assessment",
    "marvelTheme": "Doctor Strange Emerald",
    "accentHex": "#00ff88",
    "accentRgb": "0, 255, 136",
    "iconName": "BookOpen",
    "stoneSymbol": "Eye of Agamotto",
    "roomAllocated": "CS Block (DataLab-401)",
    "techStackSuggestions": [
      "Python",
      "LangChain",
      "React",
      "FastAPI",
      "Node.js",
      "PostgreSQL"
    ],
    "isPsReleased": false,
    "psReleaseDate": "2026-10-10T09:00:00Z",
    "description": "Architect personalized AI learning platforms, intelligent academic mentors, student performance analytics, and accessible assistive education tools.",
    "problemStatements": []
  },
  {
    "id": "healthcare",
    "stoneId": "soul",
    "stoneName": "Soul Stone",
    "domainName": "MEDTECH / BIOTECH / HEALTHCARE",
    "tagline": "Healthcare • Medical AI • Assistive Technology",
    "marvelTheme": "Vormir Sunset Orange",
    "accentHex": "#ff7700",
    "accentRgb": "255, 119, 0",
    "iconName": "Heart",
    "stoneSymbol": "Vormir Altar",
    "roomAllocated": "Seminar Hall 2",
    "techStackSuggestions": [
      "Python",
      "Flutter",
      "FastAPI",
      "OpenCV",
      "PyTorch",
      "PostgreSQL"
    ],
    "isPsReleased": false,
    "psReleaseDate": "2026-10-10T09:00:00Z",
    "description": "Advance transformative medical AI, remote patient diagnostic networks, emergency healthcare coordination, and accessible assistive health technologies.",
    "problemStatements": []
  }
];

// Helper: Ensure Data Directory
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache for high-throughput reads (TTL: 5s)
let dbMemoryCache = null;
let dbMemoryCacheTimestamp = 0;
const DB_CACHE_TTL_MS = 5000;

// Load Database (Cache First, R2, then Local Disk)
export async function loadDb(forceFresh = false) {
  if (!forceFresh && dbMemoryCache && (Date.now() - dbMemoryCacheTimestamp < DB_CACHE_TTL_MS)) {
    return JSON.parse(JSON.stringify(dbMemoryCache));
  }

  if (isR2Enabled && s3Client) {
    try {
      const res = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: R2_DB_KEY }));
      if (res.Body) {
        const text = await res.Body.transformToString();
        const parsed = JSON.parse(text);
        if (parsed.domains && parsed.teams) {
          if (!parsed.settings) parsed.settings = { registrationOpen: true };
          dbMemoryCache = parsed;
          dbMemoryCacheTimestamp = Date.now();
          return parsed;
        }
      }
    } catch (e) {
      console.log('[R2 Storage] database.json not found on R2, checking local.');
    }
  }

  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.settings) parsed.settings = { registrationOpen: true };
      dbMemoryCache = parsed;
      dbMemoryCacheTimestamp = Date.now();
      return parsed;
    } catch (e) {
      console.error('Error reading local db.json:', e);
    }
  }

  const initial = { domains: INITIAL_DOMAINS, teams: [], settings: { registrationOpen: true } };
  await saveDb(initial);
  return initial;
}

// Save Database (Atomic Local Write + R2 Sync + Cache Invalidation)
export async function saveDb(data) {
  ensureDataDir();

  // Invalidate and refresh in-memory cache immediately
  dbMemoryCache = JSON.parse(JSON.stringify(data));
  dbMemoryCacheTimestamp = Date.now();

  // 1. Safe atomic file write: write to temp file, then atomically rename
  const tempFile = path.join(DATA_DIR, `.db.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`);
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    if (fs.existsSync(tempFile)) {
      try { fs.unlinkSync(tempFile); } catch (_) {}
    }
    // Fallback to direct write if rename fails
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  // 2. Sync to R2
  if (isR2Enabled && s3Client) {
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: R2_DB_KEY,
        Body: Buffer.from(JSON.stringify(data, null, 2)),
        ContentType: 'application/json',
      }));
    } catch (err) {
      console.warn('[R2 Sync Error]:', err.message);
    }
  }
}

// ==========================================
// CONCURRENCY & TRANSACTION MUTEX
// ==========================================
class AsyncLock {
  constructor() {
    this.queue = Promise.resolve();
  }

  acquire() {
    let release;
    const waitPromise = new Promise(resolve => {
      release = resolve;
    });
    const ticket = this.queue.then(() => release);
    this.queue = this.queue.then(() => waitPromise).catch(() => {});
    return ticket;
  }
}

const dbLock = new AsyncLock();

export async function withDbLock(fn) {
  const release = await dbLock.acquire();
  try {
    return await fn();
  } finally {
    release();
  }
}

/**
 * Execute an atomic read-modify-write transaction on the database.
 * Serializes concurrent execution, fetches the freshest state, applies the mutator,
 * increments the database version, and saves the state atomically.
 */
export async function updateDb(mutatorFn) {
  return withDbLock(async () => {
    const db = await loadDb();
    const result = await mutatorFn(db);
    db._version = (db._version || 0) + 1;
    db._lastModified = new Date().toISOString();
    await saveDb(db);
    return { result, db };
  });
}

// Multer Storage for Payment Proof Screenshots
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB upload limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedMimes.includes((file.mimetype || '').toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only authentic image files (PNG, JPG, JPEG, WEBP) are allowed. SVG and vector formats are strictly rejected for security.'));
    }
  },
});

// Helper: Upload Buffer to Cloudflare R2
async function uploadToR2(buffer, key, contentType) {
  if (!isR2Enabled || !s3Client) {
    const localPath = path.join(uploadDir, path.basename(key));
    fs.writeFileSync(localPath, buffer);
    return `/uploads/${path.basename(key)}`;
  }

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    if (publicDomain) {
      return `${publicDomain.replace(/\/$/, '')}/${key}`;
    }
    return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
  } catch (err) {
    console.error('R2 PutObject error, saving locally fallback:', err);
    const localPath = path.join(uploadDir, path.basename(key));
    fs.writeFileSync(localPath, buffer);
    return `/uploads/${path.basename(key)}`;
  }
}

// ==========================================
// API ROUTES
// ==========================================

// 0. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    server: 'node-express',
    timestamp: new Date().toISOString(),
  });
});

// 1. Get Domains & Problem Statements
app.get('/api/domains', async (req, res) => {
  try {
    const db = await loadDb();
    const registrationOpen = db.settings ? db.settings.registrationOpen !== false : true;
    res.json({ success: true, domains: db.domains, registrationOpen });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1b. Public Registration Status
app.get('/api/registration-status', async (req, res) => {
  try {
    const db = await loadDb();
    const registrationOpen = db.settings ? db.settings.registrationOpen !== false : true;
    res.json({ success: true, registrationOpen });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Validation & Deduplication Helpers
export function stripHtmlTags(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^https?:\/\/[^\s"'<>]+$/i.test(trimmed) || /^\/(?:uploads|receipts|assets|qrs)\/[a-zA-Z0-9_\-\.\/]+$/i.test(trimmed) || trimmed === '/placeholder-receipt.png') {
    return trimmed;
  }
  return '/placeholder-receipt.png';
}

// Neutralize CSV / Spreadsheet Formula Injection (CWE-1236)
export function sanitizeCsvFormula(val) {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^[=\+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return val;
}

// PBKDF2 Password Hashing (100,000 iterations, 16-byte random salt, SHA-256)
export function hashPassword(password) {
  if (!password || typeof password !== 'string') return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  if (!storedHash.startsWith('pbkdf2:')) {
    return password === storedHash;
  }
  try {
    const [algo, iterStr, salt, expectedHash] = storedHash.split(':');
    const iterations = parseInt(iterStr, 10);
    if (!salt || !expectedHash || isNaN(iterations)) return false;

    const actualHash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch (e) {
    return false;
  }
}

// Cryptographic Team Bearer Token Generator & Verifier
export function generateTeamToken(teamId, secret) {
  const ts = Date.now().toString();
  const signature = crypto.createHmac('sha256', secret).update(`team:${teamId}:${ts}`).digest('hex');
  return Buffer.from(`team:${teamId}:${ts}:${signature}`).toString('base64');
}

export function verifyTeamToken(token, expectedTeamId, secret) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [role, tId, ts, sig] = decoded.split(':');
    if (role !== 'team' || tId !== expectedTeamId || !ts || !sig || sig.length !== 64) return false;

    const age = Date.now() - parseInt(ts, 10);
    if (isNaN(age) || age < 0 || age > 24 * 60 * 60 * 1000) return false; // 24-hour expiration

    const expectedSig = crypto.createHmac('sha256', secret).update(`team:${tId}:${ts}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
  } catch (e) {
    return false;
  }
}

// Cryptographic Password Reset Token Generator & Verifier (10-minute validity)
export function generatePasswordResetToken(teamId, secret) {
  const ts = Date.now().toString();
  const signature = crypto.createHmac('sha256', secret).update(`reset:${teamId}:${ts}`).digest('hex');
  return Buffer.from(`reset:${teamId}:${ts}:${signature}`).toString('base64');
}

export function verifyPasswordResetToken(token, secret) {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [purpose, teamId, ts, sig] = decoded.split(':');
    if (purpose !== 'reset' || !teamId || !ts || !sig || sig.length !== 64) return null;

    const age = Date.now() - parseInt(ts, 10);
    if (isNaN(age) || age < 0 || age > 10 * 60 * 1000) return null; // 10-minute expiration window

    const expectedSig = crypto.createHmac('sha256', secret).update(`reset:${teamId}:${ts}`).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    return teamId;
  } catch (e) {
    return null;
  }
}

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim();
  if (clean.length < 5 || clean.length > 100) return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(clean);
}

export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

export function isValidPhone(phone) {
  const digits = normalizePhone(phone);
  // Valid phone: 10 digits (standard Indian mobile) or 10-14 digits international
  return digits.length >= 10 && digits.length <= 14;
}

export function getImageDimensions(data) {
  if (!data) return null;
  try {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.length < 24) return null;

    // PNG: signature 0x89 0x50 0x4E 0x47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      return { width: width >>> 0, height: height >>> 0, format: 'png', mimeType: 'image/png' };
    }

    // JPEG: starts with 0xFF 0xD8
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      let offset = 2;
      while (offset < bytes.length - 8) {
        if (bytes[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = bytes[offset + 1];
        if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc9 && marker <= 0xcb)) {
          const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
          const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
          return { width, height, format: 'jpg', mimeType: 'image/jpeg' };
        }
        const len = (bytes[offset + 2] << 8) | bytes[offset + 3];
        offset += 2 + len;
      }
    }

    // WebP: RIFF ... WEBP
    if (bytes.length > 30 &&
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
        const width = ((bytes[27] << 8) | bytes[26]) & 0x3fff;
        const height = ((bytes[29] << 8) | bytes[28]) & 0x3fff;
        return { width, height, format: 'webp', mimeType: 'image/webp' };
      }
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4c) {
        const b1 = bytes[21], b2 = bytes[22], b3 = bytes[23], b4 = bytes[24];
        const width = 1 + (((b2 & 0x3f) << 8) | b1);
        const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        return { width, height, format: 'webp', mimeType: 'image/webp' };
      }
    }
  } catch (_) {}
  return null;
}

export function checkParticipantConflicts(existingTeams, participants, currentTeamId = null) {
  const seenEmails = new Map();
  const seenPhones = new Map();

  // 1. Intra-team duplicates (within the newly submitted squad)
  for (const p of participants) {
    const cleanEmail = (p.email || '').trim().toLowerCase();
    const cleanPhone = normalizePhone(p.phone);

    if (cleanEmail) {
      if (seenEmails.has(cleanEmail)) {
        return {
          conflict: true,
          type: 'intra_team',
          field: 'email',
          value: cleanEmail,
          message: `Duplicate email '${cleanEmail}' detected within your squad (${seenEmails.get(cleanEmail)} and ${p.role}). Each participant must have a distinct, personal email address.`,
        };
      }
      seenEmails.set(cleanEmail, p.role);
    }

    if (cleanPhone) {
      if (seenPhones.has(cleanPhone)) {
        return {
          conflict: true,
          type: 'intra_team',
          field: 'phone',
          value: p.phone,
          message: `Duplicate phone number '${p.phone}' detected within your squad (${seenPhones.get(cleanPhone)} and ${p.role}). Each participant must have their own unique mobile number.`,
        };
      }
      seenPhones.set(cleanPhone, p.role);
    }
  }

  // 2. Cross-team duplicates (against already registered teams in the database)
  for (const team of existingTeams || []) {
    if (currentTeamId && team.id === currentTeamId) continue;

    const registered = [];
    if (team.leader?.email) {
      registered.push({
        role: 'Team Leader',
        name: team.leader.name,
        email: team.leader.email.trim().toLowerCase(),
        phone: normalizePhone(team.leader.phone),
      });
    }
    if (Array.isArray(team.members)) {
      team.members.forEach((m, idx) => {
        registered.push({
          role: `Member 0${idx + 2}`,
          name: m.name,
          email: (m.email || '').trim().toLowerCase(),
          phone: normalizePhone(m.phone),
        });
      });
    }

    for (const p of participants) {
      const cleanEmail = (p.email || '').trim().toLowerCase();
      const cleanPhone = normalizePhone(p.phone);

      const emailMatch = registered.find((r) => r.email && r.email === cleanEmail);
      if (emailMatch) {
        return {
          conflict: true,
          type: 'cross_team',
          field: 'email',
          value: cleanEmail,
          teamName: team.teamName,
          teamId: team.id,
          message: `The email '${cleanEmail}' (${p.role}) is already registered with team '${team.teamName}' (${team.id}). A participant can only participate in one team.`,
        };
      }

      const phoneMatch = registered.find((r) => r.phone && r.phone === cleanPhone);
      if (phoneMatch) {
        return {
          conflict: true,
          type: 'cross_team',
          field: 'phone',
          value: p.phone,
          teamName: team.teamName,
          teamId: team.id,
          message: `The mobile number '${p.phone}' (${p.role}) is already registered with team '${team.teamName}' (${team.id}). A participant can only participate in one team.`,
        };
      }
    }
  }

  return { conflict: false };
}

export function isDummyUtr(utr) {
  if (!utr || typeof utr !== 'string') return true;
  const clean = utr.trim();
  if (/^(\d)\1+$/.test(clean)) return true; // 000000000000, 111111111111
  const dummies = ['123456789012', '12345678901', '012345678901', '987654321098', '112233445566', '998877665544', '123456123456'];
  return dummies.includes(clean);
}

// 2. Real-time UTR Uniqueness Verification
app.get('/api/verify-utr', async (req, res) => {
  try {
    const utr = (req.query.utr || '').toString().trim();
    if (!utr) return res.json({ exists: false });

    const db = await loadDb();
    const existing = db.teams.find((t) => t.payment && t.payment.utr && t.payment.utr.trim().toLowerCase() === utr.toLowerCase());
    res.json({ exists: Boolean(existing), utr });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Real-time Participant (Email & Phone) Verification Endpoint
app.get('/api/verify-participant', async (req, res) => {
  try {
    const email = (req.query.email || '').toString().trim().toLowerCase();
    const phone = normalizePhone((req.query.phone || '').toString());
    const excludeTeamId = (req.query.teamId || '').toString().trim();

    if (!email && !phone) {
      return res.json({ exists: false });
    }

    const db = await loadDb();
    for (const team of db.teams || []) {
      if (excludeTeamId && team.id === excludeTeamId) continue;

      if (email) {
        if (team.leader?.email?.trim().toLowerCase() === email) {
          return res.json({ exists: true, field: 'email', value: email, teamName: team.teamName, teamId: team.id, role: 'Team Leader' });
        }
        const m = (team.members || []).find((mem) => mem.email?.trim().toLowerCase() === email);
        if (m) {
          return res.json({ exists: true, field: 'email', value: email, teamName: team.teamName, teamId: team.id, role: 'Team Member' });
        }
      }

      if (phone) {
        if (normalizePhone(team.leader?.phone) === phone) {
          return res.json({ exists: true, field: 'phone', value: phone, teamName: team.teamName, teamId: team.id, role: 'Team Leader' });
        }
        const m = (team.members || []).find((mem) => normalizePhone(mem.phone) === phone);
        if (m) {
          return res.json({ exists: true, field: 'phone', value: phone, teamName: team.teamName, teamId: team.id, role: 'Team Member' });
        }
      }
    }

    res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Team Registration Endpoint
// Enforces:
// - Mandatory fields (all leader and team details)
// - Team size: strictly 3 or 4
// - Strict email format validation for leader and all members
// - Strict mobile phone format validation (10 digits)
// - Strictly unique UTR
// - Strictly unique emails and phones (intra-team and cross-team)
// - Auto stores reviews & food structures
// - Uploads screenshot to Cloudflare R2
app.post('/api/register', upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const regCheck = regRateLimiter.isLimited(`${clientIp}:register`);
    if (regCheck.limited) {
      res.setHeader('Retry-After', String(regCheck.retryAfter));
      return res.status(429).json({
        success: false,
        error: regCheck.message,
        retryAfter: regCheck.retryAfter
      });
    }

    const dbCheck = await loadDb();
    if (dbCheck.settings && dbCheck.settings.registrationOpen === false) {
      return res.status(403).json({
        success: false,
        error: 'Registrations for Infinity Hackathon 2026 are currently closed by the organizers.'
      });
    }

    const {
      teamName,
      college,
      preferredDomain,
      techStack,
      teamSize,
      teamPassword,
      leaderName,
      leaderEmail,
      leaderPhone,
      paymentUtr,
      paymentPhone,
      members,
    } = req.body;

    if (!teamName || !college || !preferredDomain || !teamPassword || !leaderName || !leaderEmail || !leaderPhone || !paymentUtr) {
      return res.status(400).json({ success: false, error: 'Missing mandatory registration fields. All leader and squad details are required.' });
    }

    const cleanLeaderEmail = leaderEmail.trim().toLowerCase();
    if (!isValidEmail(cleanLeaderEmail)) {
      return res.status(400).json({
        success: false,
        error: `Invalid Leader Email format: '${leaderEmail}'. Please enter a valid email address (e.g. name@domain.com).`,
      });
    }

    const cleanLeaderPhone = normalizePhone(leaderPhone);
    if (!isValidPhone(cleanLeaderPhone)) {
      return res.status(400).json({
        success: false,
        error: `Invalid Leader Phone number: '${leaderPhone}'. Please provide a valid 10-digit mobile number.`,
      });
    }

    const cleanUtr = paymentUtr.trim();
    if (cleanUtr.length < 10 || cleanUtr.length > 22 || !/^[A-Za-z0-9]+$/.test(cleanUtr) || isDummyUtr(cleanUtr)) {
      return res.status(400).json({
        success: false,
        error: `Invalid or fake Payment UTR: '${paymentUtr}'. Authentic 12-digit UPI reference number required.`,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Payment confirmation screenshot is required. Please upload your payment receipt (Max 20MB).',
      });
    }

    if (req.file.size < 15 * 1024) {
      return res.status(400).json({
        success: false,
        error: `Uploaded image file size (${(req.file.size / 1024).toFixed(1)} KB) is too small to be a payment receipt. Logos, icons, and small images are not accepted.`,
      });
    }

    const imgDim = getImageDimensions(req.file.buffer);
    if (!imgDim) {
      return res.status(400).json({
        success: false,
        error: 'Invalid receipt file format. Only authentic PNG, JPEG, or WebP screenshot files are accepted. SVG and vector formats are strictly rejected for security.',
      });
    }

    if ((imgDim.width < 250 && imgDim.height < 300) && (imgDim.height < 250 && imgDim.width < 300)) {
      return res.status(400).json({
        success: false,
        error: `Uploaded image dimensions (${imgDim.width}x${imgDim.height}px) are too small for a payment receipt screenshot. Logos, icons, and small images are not accepted.`,
      });
    }

    // Process screenshot file with cryptographically random key and verified extension
    let screenshotUrl = '/placeholder-receipt.png';
    if (req.file) {
      const ext = `.${imgDim.format}`;
      const key = `receipts/${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      screenshotUrl = await uploadToR2(req.file.buffer, key, imgDim.mimeType);
    }

    // Parse teammates
    let parsedMembers = [];
    if (typeof members === 'string') {
      try {
        parsedMembers = JSON.parse(members);
      } catch (e) {
        parsedMembers = [];
      }
    } else if (Array.isArray(members)) {
      parsedMembers = members;
    }

    const parsedSize = parseInt(teamSize, 10) || (parsedMembers.length + 1);
    if (parsedSize < 3 || parsedSize > 4) {
      return res.status(400).json({ success: false, error: 'Team size must be strictly 3 or 4 members.' });
    }

    const expectedMemberCount = parsedSize - 1; // 2 teammates for size 3, 3 teammates for size 4
    if (parsedMembers.length < expectedMemberCount) {
      return res.status(400).json({
        success: false,
        error: `Team size is ${parsedSize} members, but details for only ${parsedMembers.length + 1} were provided. Please fill all member details.`,
      });
    }

    // Validate each teammate's name, email, and phone
    const validatedMembers = [];
    for (let i = 0; i < expectedMemberCount; i++) {
      const m = parsedMembers[i] || {};
      const mName = (m.name || '').trim();
      const mEmail = (m.email || '').trim().toLowerCase();
      const mPhone = normalizePhone(m.phone);

      if (!mName) {
        return res.status(400).json({ success: false, error: `Member 0${i + 2} name is required.` });
      }
      if (!isValidEmail(mEmail)) {
        return res.status(400).json({
          success: false,
          error: `Invalid email format for Member 0${i + 2} (${mName}): '${m.email}'. Please provide a valid email.`,
        });
      }
      if (!isValidPhone(mPhone)) {
        return res.status(400).json({
          success: false,
          error: `Invalid mobile number for Member 0${i + 2} (${mName}): '${m.phone}'. Please provide a valid 10-digit number.`,
        });
      }

      validatedMembers.push({
        name: mName,
        email: mEmail,
        phone: mPhone,
      });
    }

    // Calculate dynamic fee at ₹349 per member
    const calculatedAmount = 349 * parsedSize; // 3 => ₹1,047; 4 => ₹1,396

    // Parse tech stack
    let parsedTechStack = [];
    if (Array.isArray(techStack)) {
      parsedTechStack = techStack;
    } else if (typeof techStack === 'string') {
      parsedTechStack = techStack.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Construct squad record
    const teamId = `INF-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTeam = {
      id: teamId,
      teamName: stripHtmlTags(teamName),
      college: stripHtmlTags(college),
      preferredDomain: stripHtmlTags(preferredDomain).toLowerCase(),
      techStack: parsedTechStack.map(s => stripHtmlTags(s)),
      teamSize: parsedSize,
      teamPassword: hashPassword(teamPassword.trim()),
      leader: {
        name: leaderName ? stripHtmlTags(leaderName) : '',
        email: cleanLeaderEmail,
        phone: cleanLeaderPhone,
      },
      members: validatedMembers.map(m => ({
        name: stripHtmlTags(m.name),
        email: m.email,
        phone: m.phone,
      })),
      roomAllocated: 'TBA (Lab Block 3)',
      selectedProblemStatement: null,
      payment: {
        utr: stripHtmlTags(cleanUtr),
        phone: paymentPhone ? stripHtmlTags(paymentPhone) : cleanLeaderPhone,
        screenshotUrl: sanitizeUrl(screenshotUrl),
        submittedAt: new Date().toISOString(),
        amount: calculatedAmount,
        status: 'pending',
      },
      // Review milestones (for Team Leader timeline and Coordinator checkoff)
      reviews: {
        r1: { attended: false, time: null, notes: '' },
        r2: { attended: false, time: null, notes: '' },
        r3: { attended: false, time: null, notes: '' }
      },
      // Food meal tokens (for Coordinator and Team Leader dashboard)
      food: {
        dinner: { collected: false, time: null },
        breakfast: { collected: false, time: null },
        lunch: { collected: false, time: null }
      },
      // Judges marks (STRICTLY HIDDEN from Team Leader view)
      scores: {
        innovation: 0,
        technical: 0,
        execution: 0,
        presentation: 0,
        total: 0,
        remarks: ''
      },
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };

    const allParticipants = [
      { role: 'Team Leader', name: leaderName.trim(), email: cleanLeaderEmail, phone: cleanLeaderPhone },
      ...validatedMembers.map((m, i) => ({
        role: `Member 0${i + 2}`,
        name: m.name,
        email: m.email,
        phone: m.phone,
      })),
    ];

    // Atomic Registration Transaction
    const { result } = await updateDb(async (db) => {
      // Check for duplicate participants (Intra-team & Cross-team)
      const conflict = checkParticipantConflicts(db.teams, allParticipants);
      if (conflict.conflict) {
        const err = new Error(conflict.message);
        err.statusCode = 409;
        throw err;
      }

      // Enforce strictly UNIQUE UTR across all teams
      const duplicateUtr = db.teams.find(
        (t) => t.payment && t.payment.utr && t.payment.utr.trim().toLowerCase() === cleanUtr.toLowerCase()
      );
      if (duplicateUtr) {
        const err = new Error(`The payment UTR '${cleanUtr}' has already been registered with another team. Every transaction UTR must be unique.`);
        err.statusCode = 409;
        throw err;
      }

      // Ensure unique team ID inside atomic transaction
      let assignedId = newTeam.id;
      while (db.teams.some((t) => t.id === assignedId)) {
        assignedId = `INF-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      newTeam.id = assignedId;

      const normDomain = normalizeDomainId(newTeam.preferredDomain);
      const matchedDomain = db.domains.find(d => d.id === normDomain || d.stoneId === normDomain);
      newTeam.roomAllocated = matchedDomain?.roomAllocated || 'TBA (Lab Block 3)';

      db.teams.push(newTeam);
      return { newTeam, calculatedAmount };
    });

    // Automatically dispatch confirmation email with squad pass and verification details
    let mailDispatched = false;
    let mailError = null;
    try {
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      await sendPaymentVerifiedEmail({
        team: result.newTeam,
        appUrl,
        env: process.env,
        rawPassword: teamPassword ? teamPassword.trim() : null
      });
      mailDispatched = true;
      // Mark mailSent in database
      await updateDb(async (db) => {
        const t = db.teams.find(x => x.id === result.newTeam.id);
        if (t && t.payment) {
          t.payment.mailSent = true;
          t.payment.mailSentAt = new Date().toISOString();
        }
      });
    } catch (mErr) {
      console.warn('Auto registration confirmation email warning:', mErr.message);
      mailError = mErr.message;
    }

    res.json({
      success: true,
      message: `Registration successful for ${result.newTeam.teamName}! Total registration fee: ₹${result.calculatedAmount}.`,
      mailSent: mailDispatched,
      mailError: mailError,
      team: {
        id: result.newTeam.id,
        teamName: result.newTeam.teamName,
        college: result.newTeam.college,
        preferredDomain: result.newTeam.preferredDomain,
        leader: result.newTeam.leader,
        members: result.newTeam.members,
        leaderEmail: result.newTeam.leader.email,
        amount: result.calculatedAmount,
        utr: result.newTeam.payment.utr,
      },
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Team Leader Portal Login
// CRITICAL: Strictly HIDE judges' scores from teams!
app.post('/api/teams/login', async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const authKey = `${clientIp}:teams-login`;
    const check = authRateLimiter.isLimited(authKey);
    if (check.limited) {
      res.setHeader('Retry-After', String(check.retryAfter));
      return res.status(429).json({
        success: false,
        error: check.message,
        retryAfter: check.retryAfter
      });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Leader email and team password are required.' });
    }
    const db = await loadDb();
    const cleanEmail = email.trim().toLowerCase();
    const team = db.teams.find((t) => t.leader && t.leader.email && t.leader.email.trim().toLowerCase() === cleanEmail);

    const isPasswordValid = team ? verifyPassword(password, team.teamPassword) : false;
    if (!team || !isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid leader email or team password.' });
    }

    // Reset rate limiter on successful authentication
    authRateLimiter.reset(authKey);

    // Transparently upgrade legacy plaintext password to PBKDF2 if needed
    if (!team.teamPassword.startsWith('pbkdf2:')) {
      await updateDb(async (db) => {
        const t = db.teams.find((x) => x.id === team.id);
        if (t && !t.teamPassword.startsWith('pbkdf2:')) {
          t.teamPassword = hashPassword(password);
        }
      });
    }

    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, error: 'Server authentication secret is not configured.' });
    }
    const token = generateTeamToken(team.id, secret);

    // Map stone or domain
    const assignedDomain = db.domains.find(
      (d) => d.id === team.preferredDomain || d.stoneId === team.preferredDomain
    ) || db.domains[0];

    // Create safe payload: STRIP SCORES AND PASSWORD HASH
    const safeTeam = JSON.parse(JSON.stringify(team));
    delete safeTeam.scores; // STRICTLY HIDDEN FROM TEAMS
    delete safeTeam.teamPassword; // NEVER EXPOSE TO CLIENT

    res.json({ success: true, token, team: safeTeam, domainInfo: assignedDomain });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4.1 Get Current Team Session Profile
app.get('/api/teams/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authorization token required.' });
    }

    let teamId = null;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const [role, tId] = decoded.split(':');
      if (role === 'team' && tId) teamId = tId;
    } catch (e) {}

    if (!teamId) {
      return res.status(401).json({ success: false, error: 'Invalid token format.' });
    }

    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, error: 'Server authentication secret is not configured.' });
    }
    if (!verifyTeamToken(token, teamId, secret)) {
      return res.status(401).json({ success: false, error: 'Invalid or expired team token.' });
    }

    const db = await loadDb();
    const team = db.teams.find((t) => t.id === teamId);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }

    const assignedDomain = db.domains.find(
      (d) => d.id === team.preferredDomain || d.stoneId === team.preferredDomain
    ) || db.domains[0];

    const safeTeam = JSON.parse(JSON.stringify(team));
    delete safeTeam.scores; // STRICTLY HIDDEN FROM TEAMS
    delete safeTeam.teamPassword; // NEVER EXPOSE TO CLIENT

    res.json({ success: true, team: safeTeam, domainInfo: assignedDomain });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4.2 Team Leader Forgot Password - Verify Identity
app.post('/api/teams/forgot-password/verify', async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const authKey = `${clientIp}:teams-forgot-password`;
    const check = fgtRateLimiter.isLimited(authKey);
    if (check.limited) {
      res.setHeader('Retry-After', String(check.retryAfter));
      return res.status(429).json({
        success: false,
        error: check.message,
        retryAfter: check.retryAfter
      });
    }

    const { email, phone, utr } = req.body;
    if (!email || !phone || !utr) {
      return res.status(400).json({
        success: false,
        error: 'Leader email, phone number, and payment UTR are required.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = normalizePhone(phone);
    const cleanUtr = String(utr).trim().toLowerCase();

    const db = await loadDb();
    const team = db.teams.find((t) => {
      if (!t.leader || !t.leader.email) return false;
      const tEmail = t.leader.email.trim().toLowerCase();
      if (tEmail !== cleanEmail) return false;

      const tPhone = normalizePhone(t.leader.phone);
      if (tPhone !== cleanPhone) return false;

      const tUtr = String(t.payment?.utr || '').trim().toLowerCase();
      const tId = String(t.id || '').trim().toLowerCase();
      return tUtr === cleanUtr || tId === cleanUtr;
    });

    if (!team) {
      return res.status(401).json({
        success: false,
        error: 'Verification failed. The provided email, phone number, or payment reference does not match our registration records.'
      });
    }

    // Reset rate limiter on successful verification
    fgtRateLimiter.reset(authKey);

    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, error: 'Server authentication secret is not configured.' });
    }

    const resetToken = generatePasswordResetToken(team.id, secret);

    res.json({
      success: true,
      message: 'Identity verified successfully.',
      resetToken,
      teamId: team.id,
      teamName: team.teamName
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4.3 Team Leader Forgot Password - Reset Password
app.post('/api/teams/forgot-password/reset', async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const authKey = `${clientIp}:teams-forgot-password`;
    const check = fgtRateLimiter.isLimited(authKey);
    if (check.limited) {
      res.setHeader('Retry-After', String(check.retryAfter));
      return res.status(429).json({
        success: false,
        error: check.message,
        retryAfter: check.retryAfter
      });
    }

    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Reset token and new password are required.'
      });
    }

    if (typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.'
      });
    }

    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, error: 'Server authentication secret is not configured.' });
    }

    const teamId = verifyPasswordResetToken(resetToken, secret);
    if (!teamId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired password reset pass. Please verify your details again.'
      });
    }

    fgtRateLimiter.reset(authKey);

    await updateDb(async (db) => {
      const team = db.teams.find((t) => t.id === teamId);
      if (!team) {
        const err = new Error('Team not found.');
        err.statusCode = 404;
        throw err;
      }

      team.teamPassword = hashPassword(newPassword.trim());
      team.updatedAt = new Date().toISOString();
    });

    res.json({
      success: true,
      message: 'Password has been successfully updated. You may now log in.'
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// 5. Team Leader Select Problem Statement or Change Domain
app.post('/api/teams/update-selection', async (req, res) => {
  try {
    const { email, password, token, newDomainId, problemStatementId } = req.body;
    const authHeader = req.headers['authorization'] || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    const tokenToUse = bearerToken || token;

    if (!email && !tokenToUse) {
      return res.status(400).json({ success: false, error: 'Authentication credentials required.' });
    }

    const db = await loadDb();
    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, error: 'Server authentication secret is not configured.' });
    }

    const { result } = await updateDb(async (db) => {
      let team = null;
      if (email) {
        const cleanEmail = email.trim().toLowerCase();
        team = db.teams.find((t) => t.leader && t.leader.email && t.leader.email.trim().toLowerCase() === cleanEmail);
      }

      if (!team && tokenToUse) {
        try {
          const decoded = Buffer.from(tokenToUse, 'base64').toString('utf8');
          const [role, tId] = decoded.split(':');
          if (role === 'team' && tId) {
            team = db.teams.find((t) => t.id === tId);
          }
        } catch (e) {}
      }

      if (!team) {
        const err = new Error('Team not found.');
        err.statusCode = 404;
        throw err;
      }

      const isAuth = (tokenToUse && verifyTeamToken(tokenToUse, team.id, secret)) ||
                     (password && verifyPassword(password, team.teamPassword));

      if (!isAuth) {
        const err = new Error('Authentication failed.');
        err.statusCode = 401;
        throw err;
      }

      // Change domain if specified
      if (newDomainId && db.domains.some((d) => d.id === newDomainId || d.stoneId === newDomainId)) {
        team.preferredDomain = newDomainId;
        team.selectedProblemStatement = null;
      }

      const currentDomain = db.domains.find(
        (d) => d.id === team.preferredDomain || d.stoneId === team.preferredDomain
      );

      // Select 1 Problem Statement if specified
      if (problemStatementId && currentDomain) {
        const ps = currentDomain.problemStatements?.find(
          (p) => p.id === problemStatementId || p.code === problemStatementId
        );
        if (ps) {
          team.selectedProblemStatement = {
            id: ps.id,
            code: ps.code,
            title: ps.title,
            category: ps.category,
            selectedAt: new Date().toISOString(),
          };
        }
      }

      const safeTeam = JSON.parse(JSON.stringify(team));
      delete safeTeam.scores;
      delete safeTeam.teamPassword;
      return { team: safeTeam, domainInfo: currentDomain };
    });

    res.json({ success: true, team: result.team, domainInfo: result.domainInfo });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Cryptographic Token Generation & Role Verification
// ==========================================
function generateRoleToken(role, secret) {
  const ts = Date.now().toString();
  const signature = crypto.createHmac('sha256', secret).update(`${role}:${ts}`).digest('hex');
  return Buffer.from(`${role}:${ts}:${signature}`).toString('base64');
}

function verifyRoleToken(token, role, secret) {
  if (!token) return false;
  if (token === secret) return true; // Direct role secret / passphrase fallback
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    let tokRole = '';
    let ts = '';
    let sig = '';

    if (parts.length === 3) {
      [tokRole, ts, sig] = parts;
      if (tokRole !== role) return false;
    } else if (parts.length === 2 && role === 'admin') {
      // Legacy admin format ts:sig
      [ts, sig] = parts;
      tokRole = 'admin';
    } else {
      return false;
    }

    if (!ts || !sig || sig.length !== 64) return false;

    const age = Date.now() - parseInt(ts, 10);
    if (isNaN(age) || age < 0 || age > 24 * 60 * 60 * 1000) return false; // 24-hour expiration

    const expectedSig = crypto.createHmac('sha256', secret).update(`${role}:${ts}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
  } catch (e) {
    return false;
  }
}

function generateAdminToken(secret) {
  return generateRoleToken('admin', secret);
}

function verifyAdminToken(token, secret) {
  return verifyRoleToken(token, 'admin', secret);
}

function extractBearerOrQueryToken(req) {
  const authHeader = req.headers['authorization'] || '';
  const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  const tokenFromQuery = (req.query.token || '').toString().trim();
  return tokenFromHeader || tokenFromQuery;
}

function requireCoordinatorAuth(req, res, next) {
  const secret = process.env.COORDINATOR_PASS;
  if (!secret) {
    return res.status(500).json({ success: false, error: 'Coordinator authentication is not configured.' });
  }
  const token = extractBearerOrQueryToken(req);

  if (!token || !verifyRoleToken(token, 'coordinator', secret)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Valid Coordinator clearance required.' });
  }
  next();
}

function requireJudgeAuth(req, res, next) {
  const secret = process.env.JUDGES_PASS;
  if (!secret) {
    return res.status(500).json({ success: false, error: 'Judge authentication is not configured.' });
  }
  const token = extractBearerOrQueryToken(req);

  if (!token || !verifyRoleToken(token, 'judge', secret)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Valid Judge clearance required.' });
  }
  next();
}

function requireAdminAuth(req, res, next) {
  const secret = process.env.ADMIN_SECRET || 'admin123';
  const token = extractBearerOrQueryToken(req);

  if (!token || !verifyAdminToken(token, secret)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Valid Admin Authorization required.' });
  }
  next();
}

// 6. Coordinator Authentication & Data
app.post('/api/coordinator/login', (req, res) => {
  const clientIp = getClientIp(req);
  const authKey = `${clientIp}:coordinator-login`;
  const check = authRateLimiter.isLimited(authKey);
  if (check.limited) {
    res.setHeader('Retry-After', String(check.retryAfter));
    return res.status(429).json({
      success: false,
      error: check.message,
      retryAfter: check.retryAfter
    });
  }

  const { password } = req.body || {};
  const secret = process.env.COORDINATOR_PASS || 'coord123';
  if (!password) {
    return res.status(400).json({ success: false, error: 'Passcode is required.' });
  }
  if (password === secret) {
    authRateLimiter.reset(authKey);
    const token = generateRoleToken('coordinator', secret);
    return res.json({ success: true, token, message: 'Coordinator clearance granted.' });
  }
  return res.status(401).json({ success: false, error: 'Invalid coordinator password.' });
});

app.get('/api/coordinator/teams', requireCoordinatorAuth, async (req, res) => {
  try {
    const db = await loadDb();
    // Coordinators can view teams, reviews, and food status
    const teams = db.teams.map(t => {
      const copy = { ...t };
      delete copy.scores; // hide judge scores from coordinators as well
      delete copy.teamPassword;
      return copy;
    });
    res.json({ success: true, teams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Coordinator Mark Food or Review (Protected)
app.post('/api/coordinator/mark', requireCoordinatorAuth, async (req, res) => {
  try {
    const { teamId, type, key, value, memberIndex, notes } = req.body;
    if (!teamId || !type || !key) {
      return res.status(400).json({ success: false, error: 'Missing teamId, type, or key.' });
    }

    const { result } = await updateDb(async (db) => {
      const team = db.teams.find(t => t.id === teamId);
      if (!team) {
        const err = new Error('Team not found.');
        err.statusCode = 404;
        throw err;
      }

      if (type === 'food' || type === 'meal') {
        if (!team.food) team.food = {};
        const teamSize = team.teamSize || (team.members ? team.members.length + 1 : 4);

        let existingMembers = [];
        if (Array.isArray(team.food[key]?.members)) {
          existingMembers = [...team.food[key].members];
        } else if (team.food[key]?.collected) {
          existingMembers = Array(teamSize).fill(true);
        } else {
          existingMembers = Array(teamSize).fill(false);
        }

        while (existingMembers.length < teamSize) existingMembers.push(false);
        if (existingMembers.length > teamSize) existingMembers = existingMembers.slice(0, teamSize);

        if (memberIndex !== undefined && memberIndex !== null) {
          const idx = parseInt(memberIndex, 10);
          if (idx >= 0 && idx < teamSize) {
            existingMembers[idx] = Boolean(value);
          }
        } else {
          existingMembers = Array(teamSize).fill(Boolean(value));
        }

        const count = existingMembers.filter(Boolean).length;
        team.food[key] = {
          collected: count > 0,
          count: count,
          members: existingMembers,
          time: count > 0 ? (team.food[key]?.time || new Date().toISOString()) : null,
        };
      } else if (type === 'review') {
        if (!team.reviews) team.reviews = {};
        team.reviews[key] = {
          attended: Boolean(value),
          time: value ? new Date().toISOString() : null,
          notes: notes || team.reviews[key]?.notes || '',
        };
      }

      return { team };
    });

    res.json({ success: true, team: result.team });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Judges Authentication & Data
app.post('/api/judges/login', (req, res) => {
  const clientIp = getClientIp(req);
  const authKey = `${clientIp}:judges-login`;
  const check = authRateLimiter.isLimited(authKey);
  if (check.limited) {
    res.setHeader('Retry-After', String(check.retryAfter));
    return res.status(429).json({
      success: false,
      error: check.message,
      retryAfter: check.retryAfter
    });
  }

  const { password } = req.body || {};
  const secret = process.env.JUDGES_PASS || 'judge123';
  if (!password) {
    return res.status(400).json({ success: false, error: 'Passcode is required.' });
  }
  if (password === secret) {
    authRateLimiter.reset(authKey);
    const token = generateRoleToken('judge', secret);
    return res.json({ success: true, token, message: 'Judge clearance granted.' });
  }
  return res.status(401).json({ success: false, error: 'Invalid judges password.' });
});

app.get('/api/judges/teams', requireJudgeAuth, async (req, res) => {
  try {
    const db = await loadDb();
    // Judges can view teams, domains, problem statement, and scores
    const teams = db.teams.map(t => ({
      id: t.id,
      teamName: t.teamName,
      college: t.college,
      preferredDomain: t.preferredDomain,
      techStack: t.techStack,
      teamSize: t.teamSize,
      leader: t.leader,
      members: t.members,
      roomAllocated: t.roomAllocated,
      selectedProblemStatement: t.selectedProblemStatement,
      reviews: t.reviews,
      scores: t.scores || { innovation: 0, technical: 0, execution: 0, presentation: 0, total: 0, remarks: '' }
    }));
    res.json({ success: true, teams, domains: db.domains });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Judges Submit Marks (STRICTLY HIDDEN FROM TEAMS) (Protected)
app.post('/api/judges/score', requireJudgeAuth, async (req, res) => {
  try {
    const { teamId, innovation, technical, execution, presentation, remarks } = req.body;
    if (!teamId) return res.status(400).json({ success: false, error: 'teamId is required.' });

    const numInno = Math.min(25, Math.max(0, parseFloat(innovation) || 0));
    const numTech = Math.min(25, Math.max(0, parseFloat(technical) || 0));
    const numExec = Math.min(25, Math.max(0, parseFloat(execution) || 0));
    const numPres = Math.min(25, Math.max(0, parseFloat(presentation) || 0));
    const total = numInno + numTech + numExec + numPres;

    const { result } = await updateDb(async (db) => {
      const team = db.teams.find(t => t.id === teamId);
      if (!team) {
        const err = new Error('Team not found.');
        err.statusCode = 404;
        throw err;
      }

      team.scores = {
        innovation: numInno,
        technical: numTech,
        execution: numExec,
        presentation: numPres,
        total,
        remarks: remarks || '',
        updatedAt: new Date().toISOString()
      };

      return { teamId, scores: team.scores };
    });

    res.json({ success: true, teamId: result.teamId, scores: result.scores });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Admin Authentication & Authorization
app.post('/api/admin/login', (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const authKey = `${clientIp}:admin-login`;
    const check = authRateLimiter.isLimited(authKey);
    if (check.limited) {
      res.setHeader('Retry-After', String(check.retryAfter));
      return res.status(429).json({
        success: false,
        error: check.message,
        retryAfter: check.retryAfter
      });
    }

    const { password } = req.body || {};
    const secret = process.env.ADMIN_SECRET || 'admin123';

    if (!password) return res.status(400).json({ success: false, error: 'Passphrase is required.' });
    if (password === secret) {
      authRateLimiter.reset(authKey);
      const token = generateAdminToken(secret);
      return res.status(200).json({ success: true, token, message: 'Organizer clearance granted.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid admin passphrase.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Admin Get All Teams (Protected)
app.get('/api/admin/teams', requireAdminAuth, async (req, res) => {
  try {
    const db = await loadDb();
    const safeTeams = db.teams.map((t) => {
      const copy = { ...t };
      delete copy.teamPassword; // NEVER leak password or hash to admin browser
      copy.hasPassword = Boolean(t.teamPassword);
      return copy;
    });
    res.json({
      success: true,
      teams: safeTeams,
      settings: db.settings || { registrationOpen: true }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9b. Admin Settings Get & Toggle Registration
app.get('/api/admin/settings', requireAdminAuth, async (req, res) => {
  try {
    const db = await loadDb();
    res.json({
      success: true,
      settings: db.settings || { registrationOpen: true }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/toggle-registration', requireAdminAuth, async (req, res) => {
  try {
    const { registrationOpen } = req.body || {};
    const { result } = await updateDb(async (db) => {
      db.settings = db.settings || { registrationOpen: true };
      if (typeof registrationOpen === 'boolean') {
        db.settings.registrationOpen = registrationOpen;
      } else {
        db.settings.registrationOpen = !db.settings.registrationOpen;
      }
      return { registrationOpen: db.settings.registrationOpen };
    });

    res.json({
      success: true,
      registrationOpen: result.registrationOpen,
      message: result.registrationOpen ? 'Public registrations are now OPEN.' : 'Public registrations are now CLOSED.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9c. Admin Purge All Teams / User Data (Dangerous - strictly requires confirm: "ERASE")
app.post('/api/admin/purge-data', requireAdminAuth, async (req, res) => {
  try {
    const { confirm } = req.body || {};
    if (!confirm || (confirm !== 'ERASE' && confirm !== 'DELETE')) {
      return res.status(400).json({
        success: false,
        error: 'Confirmation failed. You must provide confirm: "ERASE" to purge all user data.'
      });
    }

    const { result } = await updateDb(async (db) => {
      const count = Array.isArray(db.teams) ? db.teams.length : 0;
      db.teams = [];
      return { purgedCount: count };
    });

    res.json({
      success: true,
      purgedCount: result.purgedCount,
      message: `All ${result.purgedCount} squad(s) and user data have been permanently erased.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Admin Edit ANYTHING about Teams (Protected)
app.put('/api/admin/teams/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let finalScreenshotUrl = updates.payment?.screenshotUrl;
    if (finalScreenshotUrl && typeof finalScreenshotUrl === 'string' && finalScreenshotUrl.startsWith('data:image/')) {
      try {
        const match = finalScreenshotUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) {
          const mime = match[1];
          const base64Data = match[2];
          const ext = mime.includes('jpeg') || mime.includes('jpg') ? '.jpg' : mime.includes('webp') ? '.webp' : '.png';
          const filename = `receipt-admin-${id}-${Date.now()}${ext}`;
          const filePath = path.join(uploadDir, filename);
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          finalScreenshotUrl = `/uploads/${filename}`;
        }
      } catch (err) {
        console.warn('Failed to save receipt file locally:', err);
      }
    }

    let updatedTeamPassword = null;
    if (updates.teamPassword && typeof updates.teamPassword === 'string' && updates.teamPassword.trim()) {
      updatedTeamPassword = hashPassword(updates.teamPassword.trim());
    }

    const { result } = await updateDb(async (db) => {
      const idx = db.teams.findIndex((t) => t.id === id);
      if (idx === -1) {
        const err = new Error(`Team ${id} not found.`);
        err.statusCode = 404;
        throw err;
      }

      const existing = db.teams[idx];
      const updatedPayment = updates.payment ? {
        ...existing.payment,
        ...updates.payment,
        screenshotUrl: finalScreenshotUrl ? sanitizeUrl(finalScreenshotUrl) : existing.payment?.screenshotUrl,
        utr: updates.payment.utr ? stripHtmlTags(updates.payment.utr) : existing.payment?.utr,
      } : existing.payment;

      db.teams[idx] = {
        ...existing,
        teamName: updates.teamName !== undefined ? stripHtmlTags(updates.teamName) : existing.teamName,
        college: updates.college !== undefined ? stripHtmlTags(updates.college) : existing.college,
        preferredDomain: updates.preferredDomain !== undefined ? stripHtmlTags(updates.preferredDomain) : existing.preferredDomain,
        teamSize: updates.teamSize !== undefined ? updates.teamSize : existing.teamSize,
        techStack: updates.techStack !== undefined ? (Array.isArray(updates.techStack) ? updates.techStack.map(s => stripHtmlTags(s)) : stripHtmlTags(updates.techStack)) : existing.techStack,
        teamPassword: updatedTeamPassword || existing.teamPassword,
        roomAllocated: updates.roomAllocated !== undefined ? stripHtmlTags(updates.roomAllocated) : existing.roomAllocated,
        selectedProblemStatement: updates.selectedProblemStatement !== undefined ? updates.selectedProblemStatement : existing.selectedProblemStatement,
        leader: {
          ...existing.leader,
          ...(updates.leader || {}),
          name: updates.leader?.name ? stripHtmlTags(updates.leader.name) : existing.leader?.name,
        },
        members: updates.members !== undefined ? (Array.isArray(updates.members) ? updates.members.map(m => ({
          ...m,
          name: stripHtmlTags(m.name),
          email: stripHtmlTags(m.email).toLowerCase(),
          phone: stripHtmlTags(m.phone)
        })) : updates.members) : existing.members,
        payment: updatedPayment,
        reviews: {
          ...existing.reviews,
          ...(updates.reviews || {}),
        },
        food: {
          ...existing.food,
          ...(updates.food || {}),
        },
        scores: {
          ...existing.scores,
          ...(updates.scores || {}),
          remarks: updates.scores?.remarks ? stripHtmlTags(updates.scores.remarks) : existing.scores?.remarks,
        }
      };

      const returnTeam = { ...db.teams[idx] };
      delete returnTeam.teamPassword;
      returnTeam.hasPassword = Boolean(db.teams[idx].teamPassword);
      return { team: returnTeam };
    });

    res.json({ success: true, team: result.team });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Admin Delete Team (Protected)
app.delete('/api/admin/teams/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { result } = await updateDb(async (db) => {
      const prevLen = db.teams.length;
      db.teams = db.teams.filter((t) => t.id !== id);
      if (db.teams.length === prevLen) {
        const err = new Error('Team not found');
        err.statusCode = 404;
        throw err;
      }
      return { message: `Team ${id} removed.` };
    });
    res.json({ success: true, message: result.message });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Admin Update Domains & Problem Statements (Protected)
app.put('/api/admin/domains', requireAdminAuth, async (req, res) => {
  try {
    const updatedDomain = req.body;
    const { result } = await updateDb(async (db) => {
      const targetId = normalizeDomainId(updatedDomain.id || updatedDomain.stoneId);
      const idx = db.domains.findIndex((d) => d.id === updatedDomain.id || d.stoneId === updatedDomain.id || d.id === targetId);
      let updatedTeamsCount = 0;

      if (idx >= 0) {
        db.domains[idx] = { ...db.domains[idx], ...updatedDomain };

        // If roomAllocated was updated, optionally sync with teams
        if (updatedDomain.roomAllocated !== undefined && req.body.syncExistingTeams !== false) {
          const cleanRoom = stripHtmlTags(String(updatedDomain.roomAllocated)).trim();
          db.domains[idx].roomAllocated = cleanRoom;
          db.teams.forEach(t => {
            if (normalizeDomainId(t.preferredDomain) === targetId) {
              t.roomAllocated = cleanRoom;
              updatedTeamsCount++;
            }
          });
        }
        return { domain: db.domains[idx], updatedTeamsCount };
      }

      // If not existing, push new domain
      db.domains.push(updatedDomain);
      return { domain: updatedDomain, updatedTeamsCount };
    });
    res.json({ success: true, domain: result.domain, updatedTeamsCount: result.updatedTeamsCount });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12A. Admin Bulk Update Stone Areas / Rooms (Protected)
app.put('/api/admin/stone-areas', requireAdminAuth, async (req, res) => {
  try {
    const { stoneAreas, syncExistingTeams = true } = req.body || {};
    if (!stoneAreas || typeof stoneAreas !== 'object') {
      return res.status(400).json({ success: false, error: 'stoneAreas object is required.' });
    }

    const { result } = await updateDb(async (db) => {
      let updatedTeamsCount = 0;

      // Update each domain in db.domains
      Object.entries(stoneAreas).forEach(([domainKey, area]) => {
        const cleanArea = stripHtmlTags(String(area || '')).trim();
        const normId = normalizeDomainId(domainKey);
        const dom = db.domains.find(d => d.id === normId || d.stoneId === normId || d.id === domainKey);
        if (dom) {
          dom.roomAllocated = cleanArea;
        }

        // If sync requested, update all squads registered under this stone
        if (syncExistingTeams) {
          db.teams.forEach(t => {
            if (normalizeDomainId(t.preferredDomain) === normId) {
              t.roomAllocated = cleanArea;
              updatedTeamsCount++;
            }
          });
        }
      });

      return { domains: db.domains, updatedTeamsCount };
    });

    res.json({ success: true, domains: result.domains, updatedTeamsCount: result.updatedTeamsCount });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12B. Payment QR Codes API (Public GET, Protected PUT/Reset)
app.get('/api/payment-qrs', async (req, res) => {
  try {
    const db = await loadDb();
    const paymentQrs = db.paymentQrs || {
      member3: '/3mem.png',
      member4: '/4mem.png'
    };
    res.json({ success: true, paymentQrs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/payment-qrs', requireAdminAuth, async (req, res) => {
  try {
    const db = await loadDb();
    const paymentQrs = db.paymentQrs || {
      member3: '/3mem.png',
      member4: '/4mem.png'
    };
    res.json({ success: true, paymentQrs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/payment-qrs', requireAdminAuth, async (req, res) => {
  try {
    const { member3, member4 } = req.body || {};
    const { result } = await updateDb(async (db) => {
      if (!db.paymentQrs) {
        db.paymentQrs = { member3: '/3mem.png', member4: '/4mem.png' };
      }
      if (member3) db.paymentQrs.member3 = member3.trim();
      if (member4) db.paymentQrs.member4 = member4.trim();
      db.paymentQrs.updatedAt = new Date().toISOString();
      return { paymentQrs: db.paymentQrs };
    });
    res.json({ success: true, message: 'Payment QR codes updated.', paymentQrs: result.paymentQrs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/payment-qrs/reset', requireAdminAuth, async (req, res) => {
  try {
    const { result } = await updateDb(async (db) => {
      db.paymentQrs = { member3: '/3mem.png', member4: '/4mem.png', updatedAt: new Date().toISOString() };
      return { paymentQrs: db.paymentQrs };
    });
    res.json({ success: true, message: 'Payment QR codes restored to default.', paymentQrs: result.paymentQrs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// EMAIL NOTIFICATION DISPATCH (Resend REST API / Brevo / Dev Simulation)
// ==========================================
export function escapeEmailHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendPaymentVerifiedEmail({ team, appUrl = 'https://infinity.akao.in', env = process.env, rawPassword = null }) {
  const leader = team.leader || {};
  const leaderEmail = (leader.email || '').trim().toLowerCase();
  if (!leaderEmail || !leaderEmail.includes('@')) {
    throw new Error(`Squad ${team.id} (${team.teamName}) has no valid leader email address.`);
  }

  const teamMembers = Array.isArray(team.members) ? team.members : [];
  const memberEmails = teamMembers
    .map(m => (m.email || '').trim().toLowerCase())
    .filter(e => e && e.includes('@') && e !== leaderEmail);

  const teamId = escapeEmailHtml(team.id);
  const teamName = escapeEmailHtml(team.teamName);
  const college = escapeEmailHtml(team.college || 'N/A');
  const domain = escapeEmailHtml((team.preferredDomain || 'intelligence').toUpperCase());
  const room = escapeEmailHtml(team.roomAllocated || 'Lab Block 3 (CS-301)');
  const utr = escapeEmailHtml(team.payment?.utr || 'VERIFIED');
  const amount = escapeEmailHtml(team.payment?.amount || (team.teamSize || 4) * 349);
  const size = escapeEmailHtml(team.teamSize || (teamMembers.length + 1));

  let rosterRows = `
    <tr>
      <td style="padding:10px 14px; border-bottom:1px solid #e4e4e7; width:80px;">
        <span style="display:inline-block; padding:3px 8px; border-radius:4px; background:#09090b; color:#ffffff; font-size:9px; font-weight:800; letter-spacing:0.06em; font-family:monospace;">CAPTAIN</span>
      </td>
      <td style="padding:10px 14px; border-bottom:1px solid #e4e4e7; color:#09090b; font-weight:600; font-size:13px;">
        ${escapeEmailHtml(leader.name || 'Captain')}
      </td>
      <td style="padding:10px 14px; border-bottom:1px solid #e4e4e7; color:#71717a; font-size:12px; font-family:monospace;">
        ${escapeEmailHtml(leader.email || '')} ${leader.phone ? `&bull; ${escapeEmailHtml(leader.phone)}` : ''}
      </td>
    </tr>
  `;

  teamMembers.forEach((m, idx) => {
    const isLast = idx === teamMembers.length - 1;
    const borderStyle = isLast ? '' : 'border-bottom:1px solid #e4e4e7;';
    rosterRows += `
      <tr>
        <td style="padding:10px 14px; ${borderStyle} width:80px;">
          <span style="display:inline-block; padding:3px 8px; border-radius:4px; background:#f4f4f5; border:1px solid #e4e4e7; color:#52525b; font-size:9px; font-weight:700; letter-spacing:0.06em; font-family:monospace;">MEMBER</span>
        </td>
        <td style="padding:10px 14px; ${borderStyle} color:#18181b; font-weight:500; font-size:13px;">
          ${escapeEmailHtml(m.name || 'Squad Member')}
        </td>
        <td style="padding:10px 14px; ${borderStyle} color:#71717a; font-size:12px; font-family:monospace;">
          ${escapeEmailHtml(m.email || '')} ${m.phone ? `&bull; ${escapeEmailHtml(m.phone)}` : ''}
        </td>
      </tr>
    `;
  });

  const subject = `Confirmed Squad Pass — Infinity Hackathon 2026 | Squad ${team.teamName} [${team.id}]`;
  const cleanAppUrl = (appUrl || 'https://infinity.akao.in').replace(/\/$/, '');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#09090b; -webkit-font-smoothing:antialiased;">
  <!-- Outer Wrapper Table -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5; min-height:100vh; padding:36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Minimal Container -->
        <table role="presentation" width="100%" style="max-width:580px; background-color:#ffffff; border:1px solid #e4e4e7; border-radius:10px; overflow:hidden; margin:0 auto; box-shadow:0 4px 16px rgba(0,0,0,0.04);" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Section -->
          <tr>
            <td style="padding:36px 28px 24px 28px; text-align:center; border-bottom:1px solid #f4f4f5;">
              <div style="font-size:10px; font-weight:700; letter-spacing:0.22em; color:#71717a; text-transform:uppercase; margin-bottom:8px;">DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING</div>
              <div style="font-size:18px; font-weight:800; letter-spacing:0.1em; color:#09090b; text-transform:uppercase; margin-bottom:16px;">INFINITY HACKATHON 2026</div>
              
              <!-- Minimalist Pass Badge -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 16px auto;">
                <tr>
                  <td style="padding:5px 14px; border-radius:9999px; background:#09090b; border:1px solid #09090b; color:#ffffff; font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase;">
                    ✓ REGISTRATION CONFIRMED &bull; PASS ISSUED
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 8px 0; font-size:24px; font-weight:800; color:#09090b; letter-spacing:-0.02em;">Squad ${teamName}</h1>
              <p style="margin:0 auto; font-size:13px; color:#71717a; line-height:1.6; max-width:460px;">
                Your squad is confirmed for <strong>Infinity Hackathon 2026</strong>. Keep this email safe for coordinator entrance verification and online portal access.
              </p>
            </td>
          </tr>

          <!-- Ticket Pass Section -->
          <tr>
            <td style="padding:24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border:1px solid #e4e4e7; border-radius:8px; overflow:hidden;">
                
                <!-- Ticket Header -->
                <tr>
                  <td style="padding:14px 18px; border-bottom:1px solid #e4e4e7; background:#f4f4f5;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="left">
                          <span style="font-size:10px; font-weight:600; color:#71717a; letter-spacing:0.14em; text-transform:uppercase;">OFFICIAL PASS ID</span>
                          <div style="font-size:19px; font-weight:800; color:#09090b; font-family:monospace; margin-top:2px;">${teamId}</div>
                        </td>
                        <td align="right">
                          <span style="display:inline-block; padding:4px 10px; border-radius:4px; background:#ffffff; border:1px solid #e4e4e7; color:#09090b; font-size:11px; font-weight:700; font-family:monospace;">${size} MEMBERS</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Specs -->
                <tr>
                  <td style="padding:16px 18px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6" border="0" style="font-size:12px;">
                      <tr>
                        <td style="color:#71717a; font-weight:500; width:34%;">Institution</td>
                        <td style="color:#09090b; font-weight:600;">${college}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:500;">Track / Domain</td>
                        <td style="color:#09090b; font-weight:700;">${domain}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:500;">Venue Block</td>
                        <td style="color:#09090b; font-weight:600;">${room}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:500;">Bank UTR / Ref</td>
                        <td style="color:#18181b; font-family:monospace;">${utr}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:500;">Total Fee Paid</td>
                        <td style="color:#09090b; font-weight:700;">₹${amount}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:500;">Leader Username</td>
                        <td style="color:#09090b; font-family:monospace; font-weight:700;">${leaderEmail}</td>
                      </tr>
                      ${rawPassword ? `
                      <tr>
                        <td style="color:#71717a; font-weight:500;">Team Password</td>
                        <td style="color:#09090b; font-family:monospace; font-weight:700;">${escapeEmailHtml(rawPassword)}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="color:#71717a; font-weight:500;">Verification Link</td>
                        <td style="color:#09090b; font-family:monospace; font-size:11px;">
                          <a href="${cleanAppUrl}/leader?team=${teamId}" target="_blank" style="color:#09090b; text-decoration:underline;">${cleanAppUrl}/leader?team=${teamId}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Roster Section -->
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <div style="font-size:10px; font-weight:700; letter-spacing:0.14em; color:#71717a; text-transform:uppercase; margin-bottom:8px;">
                CONFIRMED SQUAD ROSTER
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border:1px solid #e4e4e7; border-radius:8px; overflow:hidden;">
                ${rosterRows}
              </table>
            </td>
          </tr>

          <!-- Check-In Guidelines Note -->
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border:1px solid #e4e4e7; border-radius:8px; padding:16px 18px;">
                <tr>
                  <td>
                    <div style="font-size:10px; font-weight:700; color:#71717a; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px;">
                      On-Site Check-in Guidelines
                    </div>
                    <ul style="margin:0; padding-left:16px; color:#52525b; font-size:12px; line-height:1.6;">
                      <li>Reporting time: <strong style="color:#09090b;">08:30 AM</strong> at the Main Campus Innovation Arena.</li>
                      <li>Present your <strong style="color:#09090b;">Pass ID (${teamId})</strong> at the Coordinator Entrance desk for verification.</li>
                      <li>Bring original college ID cards, personal laptops, and chargers.</li>
                      <li>Problem statements will unlock on your Leader Portal on hackathon morning.</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Portal CTA Button -->
          <tr>
            <td style="padding:0 28px 32px 28px; text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:6px; background:#09090b;">
                    <a href="${cleanAppUrl}/leader?team=${teamId}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:13px 34px; font-size:12px; font-weight:700; color:#ffffff; text-decoration:none; text-transform:uppercase; letter-spacing:0.08em;">
                      VIEW SQUAD PASS &amp; VERIFICATION &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="margin-top:12px; font-size:11px; color:#71717a;">
                Pass ID: <strong style="color:#09090b; font-family:monospace;">${teamId}</strong> &bull; Log in with your leader email &amp; squad password.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f4f4f5; padding:20px 24px; text-align:center; border-top:1px solid #e4e4e7; font-size:11px; color:#71717a; line-height:1.6;">
              <p style="margin:0 0 4px 0; color:#52525b; font-weight:500;">Infinity Hackathon 2026 &bull; Department of Computer Science &amp; Engineering</p>
              <p style="margin:0;">Need assistance? Contact <a href="mailto:support@infinity.akao.in" style="color:#09090b; text-decoration:underline;">support@infinity.akao.in</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const resendApiKey = (env.RESEND_API_KEY || process.env.RESEND_API_KEY || '').trim();
  const brevoApiKey = (env.BREVO_API_KEY || process.env.BREVO_API_KEY || '').trim();
  const emailFrom = (env.EMAIL_FROM || process.env.EMAIL_FROM || 'Infinity Hackathon 2026 <hackathon@infinity.akao.in>').trim();

  // 1. Resend API (Recommended: 3,000 free/mo, native REST fetch)
  if (resendApiKey && resendApiKey.trim()) {
    const payload = {
      from: emailFrom,
      to: [leaderEmail],
      ...(memberEmails.length > 0 ? { cc: memberEmails } : {}),
      reply_to: 'support@infinity.akao.in',
      subject,
      html: htmlContent,
    };

    let res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let resData = await res.json().catch(() => ({}));

    // If CC failed due to invalid teammate addresses, retry strictly with leaderEmail
    if (!res.ok && payload.cc) {
      const fallbackPayload = {
        from: emailFrom,
        to: [leaderEmail],
        reply_to: 'support@infinity.akao.in',
        subject,
        html: htmlContent,
      };
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fallbackPayload)
      });
      resData = await res.json().catch(() => ({}));
    }

    if (!res.ok) {
      let errMsg = resData.message || resData.error || `HTTP ${res.status}`;
      if (errMsg.includes('only send testing emails to your own email address')) {
        errMsg = `Resend Free Sandbox restriction: To send confirmation emails to all student addresses, please verify your domain at resend.com/domains. (For testing now, you can send to your registered email: white018899@gmail.com).`;
      }
      throw new Error(`Resend email dispatch: ${errMsg}`);
    }
    return { success: true, provider: 'resend', id: resData.id };
  }

  // 2. Brevo API (Fallback: 300 free/day)
  if (brevoApiKey && brevoApiKey.trim()) {
    const senderParts = emailFrom.match(/^(.*)<(.*)>$/) || [null, 'Infinity Hackathon 2026', emailFrom];
    const senderName = (senderParts[1] || 'Infinity Hackathon 2026').trim();
    const senderEmail = (senderParts[2] || emailFrom).trim();

    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: leaderEmail, name: leader.name || 'Captain' }],
      subject,
      htmlContent
    };
    if (memberEmails.length > 0) {
      payload.cc = memberEmails.map(email => ({ email }));
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = resData.message || `HTTP ${res.status}`;
      throw new Error(`Brevo email dispatch error: ${errMsg}`);
    }
    return { success: true, provider: 'brevo', id: resData.messageId };
  }

  // 3. Simulated Dev Mode (No API key configured yet)
  console.log(`\n======================================================`);
  console.log(`[EMAIL SIMULATION] Verification Email Dispatched`);
  console.log(`Squad:       ${team.id} (${team.teamName})`);
  console.log(`Leader:      ${leaderEmail}`);
  console.log(`CC Members:  ${memberEmails.join(', ') || 'None'}`);
  console.log(`Subject:     ${subject}`);
  console.log(`UTR:         ${team.payment?.utr || 'N/A'}`);
  console.log(`Notice: Configure RESEND_API_KEY in .env.local to send live emails!`);
  console.log(`======================================================\n`);

  return {
    success: true,
    simulated: true,
    message: 'Simulated email sent! Configure RESEND_API_KEY in .env.local for live delivery (3,000 free/mo at resend.com).'
  };
}

// 12. Send Payment Verification Email to Single Squad (Protected)
app.post('/api/admin/send-verification-mail', requireAdminAuth, async (req, res) => {
  try {
    const { teamId } = req.body || {};
    if (!teamId) {
      return res.status(400).json({ success: false, error: 'teamId is required' });
    }

    let mailResult = null;
    const { result } = await updateDb(async (db) => {
      const idx = db.teams.findIndex(t => t.id === teamId);
      if (idx === -1) {
        const err = new Error(`Squad ${teamId} not found.`);
        err.statusCode = 404;
        throw err;
      }

      const team = db.teams[idx];
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      // Dispatch Email
      mailResult = await sendPaymentVerifiedEmail({ team, appUrl, env: process.env });

      // Automatically mark payment verified & mailSent
      const now = new Date().toISOString();
      db.teams[idx] = {
        ...team,
        payment: {
          ...team.payment,
          status: 'verified',
          verifiedAt: team.payment?.verifiedAt || now,
          mailSent: true,
          mailSentAt: now
        }
      };

      const copy = { ...db.teams[idx] };
      delete copy.teamPassword;
      copy.hasPassword = Boolean(db.teams[idx].teamPassword);
      return { team: copy };
    });

    res.json({
      success: true,
      message: mailResult?.simulated
        ? 'Verification email simulated (configure RESEND_API_KEY for live delivery).'
        : 'Payment verified email sent successfully!',
      simulated: Boolean(mailResult?.simulated),
      mailSentAt: result.team.payment?.mailSentAt,
      team: result.team
    });
  } catch (err) {
    console.error('send-verification-mail error:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// 13. Send Payment Verification Emails to All Verified Squads (Protected)
app.post('/api/admin/send-all-verification-mails', requireAdminAuth, async (req, res) => {
  try {
    const { force } = req.body || {};
    let sentCount = 0;
    let failCount = 0;
    let isSimulated = false;

    const { result } = await updateDb(async (db) => {
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const verifiedTeams = db.teams.filter(t => {
        if (t.payment?.status !== 'verified') return false;
        if (!force && t.payment?.mailSent) return false;
        return true;
      });

      for (const t of verifiedTeams) {
        try {
          const mRes = await sendPaymentVerifiedEmail({ team: t, appUrl, env: process.env });
          if (mRes.simulated) isSimulated = true;
          const now = new Date().toISOString();
          t.payment.mailSent = true;
          t.payment.mailSentAt = now;
          sentCount++;
        } catch (mErr) {
          console.error(`Failed to send mail to ${t.id}:`, mErr.message);
          failCount++;
        }
      }

      return { total: verifiedTeams.length, sentCount, failCount };
    });

    res.json({
      success: true,
      message: `Processed ${sentCount} squad emails (${failCount} failed).`,
      sentCount,
      failCount,
      simulated: isSimulated
    });
  } catch (err) {
    console.error('send-all-verification-mails error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. Admin Multi-Sheet Excel Export (.xlsx) (Protected)
app.get('/api/admin/export', requireAdminAuth, async (req, res) => {
  try {
    const db = await loadDb();
    const teams = db.teams;

    // Sheet 1: Payment Details & Status
    const paymentRows = teams.map((t, idx) => ({
      'S.No': idx + 1,
      'Team ID': sanitizeCsvFormula(t.id),
      'Team Name': sanitizeCsvFormula(t.teamName),
      'College': sanitizeCsvFormula(t.college),
      'Domain': sanitizeCsvFormula((t.preferredDomain || '').toUpperCase()),
      'Team Size': t.teamSize || (t.members ? t.members.length + 1 : 4),
      'Fee Amount (₹)': t.payment?.amount || (349 * (t.teamSize || 4)),
      'Payment Status': sanitizeCsvFormula((t.payment?.status || 'pending').toUpperCase()),
      'Confirmation Mail Sent': t.payment?.mailSent ? 'YES' : 'NO',
      'Mail Sent At': t.payment?.mailSentAt ? new Date(t.payment.mailSentAt).toLocaleString() : 'N/A',
      'UTR / Transaction No': sanitizeCsvFormula(t.payment?.utr || 'N/A'),
      'Payer Phone': sanitizeCsvFormula(t.payment?.phone || 'N/A'),
      'Leader Email': sanitizeCsvFormula(t.leader?.email || ''),
      'Leader Phone': sanitizeCsvFormula(t.leader?.phone || ''),
      'Proof Screenshot URL': sanitizeCsvFormula(t.payment?.screenshotUrl || 'N/A'),
      'Registration Time': new Date(t.createdAt).toLocaleString(),
    }));

    // Sheet 2: Food & Review Tracking
    const foodReviewRows = teams.map((t, idx) => ({
      'S.No': idx + 1,
      'Team ID': sanitizeCsvFormula(t.id),
      'Team Name': sanitizeCsvFormula(t.teamName),
      'College': sanitizeCsvFormula(t.college),
      'Dinner': t.food?.dinner?.collected ? 'RECEIVED' : 'PENDING',
      'Breakfast': t.food?.breakfast?.collected ? 'RECEIVED' : 'PENDING',
      'Lunch': t.food?.lunch?.collected ? 'RECEIVED' : 'PENDING',
      'Review 1 (Ideation)': t.reviews?.r1?.attended ? 'ATTENDED' : 'PENDING',
      'Review 2 (Midpoint)': t.reviews?.r2?.attended ? 'ATTENDED' : 'PENDING',
      'Review 3 (Final)': t.reviews?.r3?.attended ? 'ATTENDED' : 'PENDING',
      'Room / Lab Block': sanitizeCsvFormula(t.roomAllocated || 'TBA'),
    }));

    // Sheet 3: Judges Scores (Confidential)
    const judgeRows = teams.map((t, idx) => ({
      'S.No': idx + 1,
      'Team ID': sanitizeCsvFormula(t.id),
      'Team Name': sanitizeCsvFormula(t.teamName),
      'Domain': sanitizeCsvFormula((t.preferredDomain || '').toUpperCase()),
      'Selected Problem Statement': sanitizeCsvFormula(t.selectedProblemStatement ? `${t.selectedProblemStatement.code}: ${t.selectedProblemStatement.title}` : 'Not Selected'),
      'Innovation (25)': t.scores?.innovation || 0,
      'Technical Depth (25)': t.scores?.technical || 0,
      'Execution / Demo (25)': t.scores?.execution || 0,
      'UI/UX & Pitch (25)': t.scores?.presentation || 0,
      'Total Score (100)': t.scores?.total || 0,
      'Judge Remarks': sanitizeCsvFormula(t.scores?.remarks || 'None'),
    }));

    // Sheet 4: Full Team Rosters
    const teamRows = teams.map((t, idx) => {
      const row = {
        'S.No': idx + 1,
        'Team ID': sanitizeCsvFormula(t.id),
        'Team Name': sanitizeCsvFormula(t.teamName),
        'College': sanitizeCsvFormula(t.college),
        'Domain': sanitizeCsvFormula((t.preferredDomain || '').toUpperCase()),
        'Tech Stack': sanitizeCsvFormula(Array.isArray(t.techStack) ? t.techStack.join(', ') : (t.techStack || '')),
        'Leader Name': sanitizeCsvFormula(t.leader?.name || ''),
        'Leader Email': sanitizeCsvFormula(t.leader?.email || ''),
        'Leader Phone': sanitizeCsvFormula(t.leader?.phone || ''),
      };
      (t.members || []).forEach((m, mIdx) => {
        row[`Member ${mIdx + 2} Name`] = sanitizeCsvFormula(m.name || '');
        row[`Member ${mIdx + 2} Email`] = sanitizeCsvFormula(m.email || '');
        row[`Member ${mIdx + 2} Phone`] = sanitizeCsvFormula(m.phone || '');
      });
      return row;
    });

    const workbook = XLSX.utils.book_new();
    const pSheet = XLSX.utils.json_to_sheet(paymentRows);
    XLSX.utils.book_append_sheet(workbook, pSheet, 'Payments & UTRs');
    const fSheet = XLSX.utils.json_to_sheet(foodReviewRows);
    XLSX.utils.book_append_sheet(workbook, fSheet, 'Food & Reviews');
    const jSheet = XLSX.utils.json_to_sheet(judgeRows);
    XLSX.utils.book_append_sheet(workbook, jSheet, 'Judges Scores');
    const tSheet = XLSX.utils.json_to_sheet(teamRows);
    XLSX.utils.book_append_sheet(workbook, tSheet, 'Full Team Rosters');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="infinity_hackathon_export_${Date.now()}.xlsx"`);
    res.send(excelBuffer);
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Direct Page URLs
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/leader', (req, res) => res.sendFile(path.join(__dirname, 'leader.html')));
app.get('/coordinator', (req, res) => res.sendFile(path.join(__dirname, 'coordinator.html')));
app.get('/judges', (req, res) => res.sendFile(path.join(__dirname, 'judges.html')));

app.listen(PORT, () => {
  console.log(`[Infinity Hackathon 2026] Backend running on http://localhost:${PORT}`);
});
