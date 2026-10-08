import * as XLSX from 'xlsx';

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

export function syncCanonicalDomains(db) {
  if (!db || !Array.isArray(db.domains)) return false;
  let changed = false;

  const stoneOrder = ['mind', 'space', 'reality', 'power', 'time', 'soul'];
  const canonicalMap = {
    mind: {
      id: "transportation",
      stoneId: "mind",
      stoneName: "Mind Stone",
      domainName: "TRANSPORTATION & LOGISTICS",
      tagline: "Mobility • Supply Chain • Routing",
      description: "Pioneer intelligent traffic management, emergency route optimization, real-time public transit tracking, and dynamic supply chain logistics to eliminate urban congestion.",
      accentHex: "#ffd000",
      accentRgb: "255, 208, 0"
    },
    space: {
      id: "cybersecurity",
      stoneId: "space",
      stoneName: "Space Stone",
      domainName: "CYBERSECURITY & DIGITAL TRUST",
      tagline: "Cybersecurity • Privacy • Cryptography",
      description: "Engineer resilient digital trust architectures, intelligent phishing and fraud detection, secure digital identity verification, and proactive cyber threat defense.",
      accentHex: "#00d2ff",
      accentRgb: "0, 210, 255"
    },
    reality: {
      id: "infrastructure",
      stoneId: "reality",
      stoneName: "Reality Stone",
      domainName: "DIGITAL PUBLIC INFRASTRUCTURE",
      tagline: "Digital Platforms • Services • E-Governance",
      description: "Construct unified digital public infrastructure, smart civic grievance platforms, transparent governance dashboards, and verified digital citizen services.",
      accentHex: "#ff2a4b",
      accentRgb: "255, 42, 75"
    },
    power: {
      id: "cleantech",
      stoneId: "power",
      stoneName: "Power Stone",
      domainName: "CLEAN & GREEN TECHNOLOGY",
      tagline: "Environment • Waste • Sustainability",
      description: "Develop sustainable clean technologies, intelligent waste and recycling systems, smart water conservation platforms, and real-time carbon footprint optimization.",
      accentHex: "#b026ff",
      accentRgb: "176, 38, 255"
    },
    time: {
      id: "education",
      stoneId: "time",
      stoneName: "Time Stone",
      domainName: "SMART EDUCATION",
      tagline: "EdTech • Learning • Assessment",
      description: "Architect personalized AI learning platforms, intelligent academic mentors, student performance analytics, and accessible assistive education tools.",
      accentHex: "#00ff88",
      accentRgb: "0, 255, 136"
    },
    soul: {
      id: "healthcare",
      stoneId: "soul",
      stoneName: "Soul Stone",
      domainName: "MEDTECH / BIOTECH / HEALTHCARE",
      tagline: "Healthcare • Medical AI • Assistive Technology",
      description: "Advance transformative medical AI, remote patient diagnostic networks, emergency healthcare coordination, and accessible assistive health technologies.",
      accentHex: "#ff7700",
      accentRgb: "255, 119, 0"
    }
  };

  stoneOrder.forEach((stoneKey, idx) => {
    const canonical = canonicalMap[stoneKey];
    let dom = db.domains.find(d => 
      (d.stoneId && d.stoneId.toLowerCase() === stoneKey) ||
      (d.stoneName && d.stoneName.toLowerCase().includes(stoneKey)) ||
      (STONE_DOMAIN_MAP[d.id] === canonical.id)
    );

    if (!dom && db.domains[idx]) {
      dom = db.domains[idx];
    }

    if (dom) {
      if (
        dom.domainName !== canonical.domainName ||
        dom.tagline !== canonical.tagline ||
        dom.id !== canonical.id ||
        dom.stoneId !== canonical.stoneId
      ) {
        dom.id = canonical.id;
        dom.stoneId = canonical.stoneId;
        dom.stoneName = canonical.stoneName;
        dom.domainName = canonical.domainName;
        dom.tagline = canonical.tagline;
        dom.description = canonical.description;
        dom.accentHex = canonical.accentHex;
        dom.accentRgb = canonical.accentRgb;
        changed = true;
      }
    } else {
      const initial = INITIAL_DOMAINS.find(d => d.id === canonical.id);
      if (initial) {
        db.domains.push(JSON.parse(JSON.stringify(initial)));
        changed = true;
      }
    }
  });

  return changed;
}

const R2_DB_KEY = 'state/database.json';
const R2_DB_BACKUP_KEY = 'state/database.backup.json';

function sanitizeCsvFormula(val) {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^[=\+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return val;
}

// ==========================================
// CORS SECURITY POLICY
// ==========================================
const ALLOWED_ORIGINS = [
  'https://infinity.akao.in',
  'https://infinity-hackathon-2026.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

export function isAllowedOrigin(origin, env = {}) {
  if (!origin) return true; // Direct same-origin or non-browser requests
  const cleanOrigin = origin.toLowerCase().trim();
  const appUrl = (env.APP_URL || '').toLowerCase().replace(/\/$/, '');
  if (appUrl && cleanOrigin === appUrl) {
    return true;
  }
  if (ALLOWED_ORIGINS.some(o => o.toLowerCase() === cleanOrigin)) {
    return true;
  }
  if (/^https:\/\/[a-z0-9-]+\.infinity-hackathon-2026\.pages\.dev$/.test(cleanOrigin)) {
    return true;
  }
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
    return true;
  }
  return false;
}

function getCorsHeaders(request, env = {}) {
  const origin = request ? request.headers.get('Origin') : null;
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (origin && isAllowedOrigin(origin, env)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

// Helper: JSON response with CORS and Rate Limit headers
function makeJsonResponse(data, status = 200, extraHeaders = {}, request = null, env = {}) {
  const corsHeaders = request ? getCorsHeaders(request, env) : {};
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': '600',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

// Helper: CORS preflight
function handleOptions(request, env = {}) {
  const origin = request.headers.get('Origin');
  if (origin && !isAllowedOrigin(origin, env)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Cross-origin request blocked by CORS security policy.'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Vary': 'Origin',
      },
    });
  }

  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(request, env),
    },
  });
}

// Helper: Generate signed HMAC role clearance token (admin, coordinator, judge)
async function generateRoleToken(role, secret) {
  const ts = Date.now().toString();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(`${role}:${ts}`));
  const sigHex = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return btoa(`${role}:${ts}:${sigHex}`);
}

async function generateAdminToken(secret) {
  return generateRoleToken('admin', secret);
}

// Helper: Constant-time string equality comparison
export function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const enc = new TextEncoder();
  const aBuf = enc.encode(a);
  const bBuf = enc.encode(b);
  if (aBuf.byteLength !== bBuf.byteLength) return false;
  let result = 0;
  for (let i = 0; i < aBuf.byteLength; i++) {
    result |= aBuf[i] ^ bBuf[i];
  }
  return result === 0;
}

// Ephemeral single-use export tickets (60s lifetime, bounded cache)
const exportTickets = new Map();

function createExportTicket(role = 'admin') {
  const ticket = crypto.randomUUID();
  exportTickets.set(ticket, { role, expiresAt: Date.now() + 60000 });
  // Evict expired tickets if cache grows
  if (exportTickets.size > 100) {
    const now = Date.now();
    for (const [k, v] of exportTickets.entries()) {
      if (v.expiresAt < now) exportTickets.delete(k);
    }
  }
  return ticket;
}

function redeemExportTicket(ticket, requiredRole = 'admin') {
  if (!ticket || !exportTickets.has(ticket)) return false;
  const entry = exportTickets.get(ticket);
  exportTickets.delete(ticket); // Strict single use!
  return entry.role === requiredRole && entry.expiresAt >= Date.now();
}

// Helper: Verify role authorization token or secret
async function verifyRoleAuth(request, url, role, secret) {
  const authHeader = request.headers.get('Authorization') || '';
  const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  const tokenFromQuery = (url.searchParams.get('token') || '').trim();
  const token = tokenFromHeader || tokenFromQuery;

  if (!token || !secret) return false;
  // Only accept raw secret / passphrase from Authorization header, NEVER from URL query string
  if (tokenFromHeader && timingSafeEqualString(tokenFromHeader, secret)) return true;

  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    let tokRole = '';
    let ts = '';
    let sigHex = '';

    if (parts.length === 3) {
      [tokRole, ts, sigHex] = parts;
      if (tokRole !== role) return false;
    } else if (parts.length === 2 && role === 'admin') {
      [ts, sigHex] = parts;
      tokRole = 'admin';
    } else {
      return false;
    }

    if (!ts || !sigHex || sigHex.length !== 64) return false;

    const age = Date.now() - parseInt(ts, 10);
    if (isNaN(age) || age < 0 || age > 24 * 60 * 60 * 1000) return false; // 24-hour expiration

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(`${role}:${ts}`));
  } catch (e) {
    return false;
  }
}

async function verifyAdminAuth(request, url, secret) {
  // Support ephemeral single-use download tickets for safe file downloads
  const ticket = (url.searchParams.get('ticket') || '').trim();
  if (ticket && redeemExportTicket(ticket, 'admin')) {
    return true;
  }
  return verifyRoleAuth(request, url, 'admin', secret);
}

function stripHtmlTags(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^https?:\/\/[^\s"'<>]+$/i.test(trimmed) || /^\/(?:uploads|receipts|assets|qrs)\/[a-zA-Z0-9_\-\.\/]+$/i.test(trimmed) || trimmed === '/placeholder-receipt.png') {
    return trimmed;
  }
  return '/placeholder-receipt.png';
}

// PBKDF2 Password Hashing (100,000 iterations, 16-byte random salt, SHA-256)
async function hashPassword(password) {
  if (!password || typeof password !== 'string') return '';
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const iterations = 100000;

  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256'
    },
    baseKey,
    256 // 32 bytes
  );

  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${iterations}:${saltHex}:${hashHex}`;
}

async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  if (!storedHash.startsWith('pbkdf2:')) {
    return password === storedHash;
  }
  try {
    const [algo, iterStr, saltHex, expectedHash] = storedHash.split(':');
    const iterations = parseInt(iterStr, 10);
    if (!saltHex || !expectedHash || isNaN(iterations) || saltHex.length !== 32 || expectedHash.length !== 64) {
      return false;
    }

    const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations,
        hash: 'SHA-256'
      },
      baseKey,
      256
    );

    const actualHash = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return actualHash === expectedHash;
  } catch (e) {
    return false;
  }
}

// Cryptographic Team Bearer Token Generator & Verifier
async function generateTeamToken(teamId, secret) {
  const ts = Date.now().toString();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(`team:${teamId}:${ts}`));
  const sigHex = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return btoa(`team:${teamId}:${ts}:${sigHex}`);
}

async function verifyTeamToken(token, expectedTeamId, secret) {
  if (!token) return false;
  try {
    const decoded = atob(token);
    const [role, tId, ts, sigHex] = decoded.split(':');
    if (role !== 'team' || tId !== expectedTeamId || !ts || !sigHex || sigHex.length !== 64) return false;

    const age = Date.now() - parseInt(ts, 10);
    if (isNaN(age) || age < 0 || age > 24 * 60 * 60 * 1000) return false; // 24-hour expiration

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(`team:${tId}:${ts}`));
  } catch (e) {
    return false;
  }
}

async function generatePasswordResetToken(teamId, secret) {
  const safeSecret = (secret && secret.trim()) || 'infinity-hackathon-2026-auth-salt';
  const ts = Date.now().toString();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(safeSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(`reset:${teamId}:${ts}`));
  const sigHex = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return btoa(`reset:${teamId}:${ts}:${sigHex}`);
}

async function verifyPasswordResetToken(token, secret) {
  if (!token) return null;
  try {
    const safeSecret = (secret && secret.trim()) || 'infinity-hackathon-2026-auth-salt';
    const decoded = atob(token);
    const [purpose, teamId, ts, sigHex] = decoded.split(':');
    if (purpose !== 'reset' || !teamId || !ts || !sigHex || sigHex.length !== 64) return null;

    const age = Date.now() - parseInt(ts, 10);
    if (isNaN(age) || age < 0 || age > 10 * 60 * 1000) return null; // 10-minute validity

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(safeSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(`reset:${teamId}:${ts}`));
    return isValid ? teamId : null;
  } catch (e) {
    return null;
  }
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim();
  if (clean.length < 5 || clean.length > 100) return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(clean);
}

function normalizePhone(phone) {
  if (!phone) return '';
  const str = String(phone).trim();
  let digits = str.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

function isValidPhone(phone) {
  const digits = normalizePhone(phone);
  return digits.length >= 10 && digits.length <= 14;
}

function getImageDimensions(data) {
  if (!data) return null;
  try {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.length < 24) return null;

    // PNG: signature 0x89 0x50 0x4E 0x47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      return { width: width >>> 0, height: height >>> 0 };
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
          return { width, height };
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
        return { width, height };
      }
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4c) {
        const b1 = bytes[21], b2 = bytes[22], b3 = bytes[23], b4 = bytes[24];
        const width = 1 + (((b2 & 0x3f) << 8) | b1);
        const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        return { width, height, format: 'webp', mimeType: 'image/webp' };
      }
      // VP8X (extended WebP — common for Android screenshots with alpha / ICC)
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58 && bytes.length >= 30) {
        const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
        const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
        return { width, height, format: 'webp', mimeType: 'image/webp' };
      }
    }
  } catch (_) {}
  return null;
}

function checkParticipantConflicts(existingTeams, participants, currentTeamId = null) {
  const seenEmails = new Map();
  const seenPhones = new Map();

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

// Helper: Load database from R2 with ETag and Version metadata for Concurrency Control
async function loadDbWithMeta(env) {
  if (env && env.BUCKET) {
    try {
      const obj = await env.BUCKET.get(R2_DB_KEY);
      if (obj) {
        const text = await obj.text();
        if (text && text.trim().length > 10) {
          const parsed = JSON.parse(text);
          if (parsed && Array.isArray(parsed.domains) && Array.isArray(parsed.teams)) {
            if (!parsed.settings) parsed.settings = { registrationOpen: true };
            const migrated = syncCanonicalDomains(parsed);
            if (migrated && env && env.BUCKET) {
              env.BUCKET.put(R2_DB_KEY, JSON.stringify(parsed, null, 2)).catch((e) => {
                console.warn('Background sync R2 canonical domains error:', e);
              });
            }
            return {
              db: parsed,
              etag: obj.etag,
              version: parsed._version || 0,
            };
          }
        }
      }
    } catch (err) {
      console.error('Error fetching/parsing primary database from R2:', err);
    }

    // Disaster Recovery: Automatic failover to shadow backup in R2 if primary is corrupted or missing
    try {
      const backupObj = await env.BUCKET.get(R2_DB_BACKUP_KEY);
      if (backupObj) {
        const backupText = await backupObj.text();
        if (backupText && backupText.trim().length > 10) {
          const backupParsed = JSON.parse(backupText);
          if (backupParsed && Array.isArray(backupParsed.domains) && Array.isArray(backupParsed.teams)) {
            console.warn('⚠️ RESTORED DATABASE FROM SHADOW BACKUP R2_DB_BACKUP_KEY!');
            if (!backupParsed.settings) backupParsed.settings = { registrationOpen: true };
            return {
              db: backupParsed,
              etag: backupObj.etag,
              version: backupParsed._version || 0,
            };
          }
        }
      }
    } catch (backupErr) {
      console.error('Error fetching backup database from R2:', backupErr);
    }
  }
  return {
    db: { domains: INITIAL_DOMAINS, teams: [], settings: { registrationOpen: true }, _version: 0 },
    etag: null,
    version: 0,
  };
}

// Helper: Load database from R2 (for read queries)
async function loadDb(env) {
  const { db } = await loadDbWithMeta(env);
  return db;
}

// Helper: Save database to R2 with Conditional ETag Check (Optimistic Concurrency Control)
async function saveDbConditional(env, data, expectedEtag) {
  if (env && env.BUCKET) {
    if (!data || !Array.isArray(data.teams) || !Array.isArray(data.domains)) {
      console.error('FATAL: Attempted to save invalid database schema. Write aborted.');
      return false;
    }
    const payloadStr = JSON.stringify(data, null, 2);
    if (!payloadStr || payloadStr.length < 50) {
      console.error('FATAL: Attempted to save truncated database. Write aborted.');
      return false;
    }

    const putOptions = {
      httpMetadata: {
        contentType: 'application/json',
      },
      customMetadata: {
        version: String(data._version || 0),
        lastModified: data._lastModified || new Date().toISOString(),
      },
    };

    if (expectedEtag) {
      putOptions.onlyIf = { etagMatches: expectedEtag };
    }

    try {
      const putResult = await env.BUCKET.put(R2_DB_KEY, payloadStr, putOptions);
      if (expectedEtag && putResult === null) {
        return false; // Precondition failed: ETag was changed by concurrent writer
      }
      // Asynchronously refresh the shadow backup (non-blocking disaster recovery)
      env.BUCKET.put(R2_DB_BACKUP_KEY, payloadStr).catch(() => {});
      return true;
    } catch (err) {
      if (err.name === 'PreconditionFailed' || err.message?.includes('Precondition') || err.message?.includes('412')) {
        return false;
      }
      console.error('R2 conditional put failed, aborting transaction for retry:', err.message);
      return false;
    }
  }
  return true;
}

// Helper: Save database to R2 (Unconditional Fallback)
async function saveDb(env, data) {
  if (env && env.BUCKET) {
    const payloadStr = JSON.stringify(data, null, 2);
    await env.BUCKET.put(R2_DB_KEY, payloadStr, {
      httpMetadata: {
        contentType: 'application/json',
      },
    });
    env.BUCKET.put(R2_DB_BACKUP_KEY, payloadStr).catch(() => {});
  }
}

/**
 * Execute an atomic read-modify-write transaction with Optimistic Concurrency Control (OCC).
 * If a concurrent write occurs between reading and writing, it catches the conflict,
 * backs off with jitter, re-reads the latest database state, and retries the mutation.
 */
export async function updateDb(env, mutatorFn, maxRetries = 25) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { db, etag, version } = await loadDbWithMeta(env);

    // Execute mutator on fresh snapshot. If mutator throws (e.g. 409 conflict), it aborts cleanly.
    const result = await mutatorFn(db);

    // Bump monotonic version
    db._version = (version || 0) + 1;
    db._lastModified = new Date().toISOString();

    const saved = await saveDbConditional(env, db, etag);
    if (saved) {
      return { result, db };
    }

    // Concurrent race condition detected: another edge worker updated R2!
    // Adaptive exponential backoff with full random jitter to desynchronize retrying workers
    const maxBackoff = Math.min(600, 25 * Math.pow(1.3, attempt));
    const jitter = Math.floor(Math.random() * maxBackoff) + 15;
    await new Promise((resolve) => setTimeout(resolve, jitter));
  }

  const err = new Error('Database is experiencing high concurrent updates. Please try again.');
  err.statusCode = 409;
  throw err;
}


// ==========================================
// RATE LIMITING & BRUTE-FORCE PROTECTION
// ==========================================
class MemoryRateLimiter {
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

function getClientIp(request) {
  return request.headers.get('cf-connecting-ip') ||
         request.headers.get('x-real-ip') ||
         request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         '127.0.0.1';
}

const apiRateLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 600,
  message: 'API rate limit exceeded. Please slow down.'
});

const authRateLimiter = new MemoryRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 30,
  message: 'Too many failed login attempts. Access temporarily locked. Please wait 5 minutes before trying again.'
});

const regRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 50,
  message: 'Registration rate limit reached. Please wait a few minutes before submitting another registration.'
});
export function escapeEmailHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function dispatchEmailTransport({ to, cc = [], subject, html, env = {}, team = {}, debugLabel = 'Email' }) {
  const resendApiKey = (env.RESEND_API_KEY || (typeof process !== 'undefined' ? process.env?.RESEND_API_KEY : '') || '').trim();
  const brevoApiKey = (env.BREVO_API_KEY || (typeof process !== 'undefined' ? process.env?.BREVO_API_KEY : '') || '').trim();
  const emailFrom = (env.EMAIL_FROM || (typeof process !== 'undefined' ? process.env?.EMAIL_FROM : '') || 'Infinity Hackathon 2026 <hackathon@infinity.akao.in>').trim();

  // 1. Resend API (Recommended)
  if (resendApiKey) {
    const payload = {
      from: emailFrom,
      to: [to],
      ...(cc.length > 0 ? { cc } : {}),
      reply_to: 'infinity.hackathon@gvpcdpgc.edu.in',
      subject,
      html,
    };

    let res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let resData = await res.json().catch(() => ({}));

    // If CC failed due to invalid teammate addresses, retry strictly with leaderEmail
    if (!res.ok && payload.cc) {
      const fallbackPayload = {
        from: emailFrom,
        to: [to],
        reply_to: 'infinity.hackathon@gvpcdpgc.edu.in',
        subject,
        html,
      };
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fallbackPayload)
      });
      resData = await res.json().catch(() => ({}));
    }

    if (!res.ok) {
      let errMsg = resData.message || resData.error || `HTTP ${res.status}`;
      if (errMsg.includes('only send testing emails to your own email address')) {
        errMsg = `Resend Free Sandbox restriction: To send emails to all student addresses, please verify your domain at resend.com/domains. (For testing now, you can send to your registered email: white018899@gmail.com).`;
      }
      throw new Error(`Resend email dispatch: ${errMsg}`);
    }
    return { success: true, provider: 'resend', id: resData.id };
  }

  // 2. Brevo API (Fallback)
  if (brevoApiKey) {
    const senderParts = emailFrom.match(/^(.*)<(.*)>$/) || [null, 'Infinity Hackathon 2026', emailFrom];
    const senderName = (senderParts[1] || 'Infinity Hackathon 2026').trim();
    const senderEmail = (senderParts[2] || emailFrom).trim();

    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to, name: team?.leader?.name || 'Captain' }],
      subject,
      htmlContent: html
    };
    if (cc.length > 0) {
      payload.cc = cc.map(email => ({ email }));
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
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

  // 3. Simulated Dev Mode
  console.log(`\n======================================================`);
  console.log(`[EMAIL SIMULATION] ${debugLabel} Dispatched`);
  console.log(`Squad:       ${team?.id} (${team?.teamName})`);
  console.log(`To:          ${to}`);
  console.log(`CC Members:  ${cc.join(', ') || 'None'}`);
  console.log(`Subject:     ${subject}`);
  console.log(`UTR:         ${team?.payment?.utr || 'N/A'}`);
  console.log(`======================================================\n`);

  return {
    success: true,
    simulated: true,
    message: 'Simulated email sent! Configure RESEND_API_KEY in .env.local for live delivery.'
  };
}

export async function sendRegistrationPendingEmail({ team, appUrl = 'https://infinity.akao.in', env = {}, rawPassword = null }) {
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
  const utr = escapeEmailHtml(team.payment?.utr || 'PENDING');
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

  const subject = `Registration Received — Pending Review | Squad ${team.teamName} [${team.id}]`;
  const cleanAppUrl = (appUrl || 'https://infinity.akao.in').replace(/\/$/, '');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#09090b; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5; min-height:100vh; padding:36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:580px; background-color:#ffffff; border:1px solid #e4e4e7; border-radius:10px; overflow:hidden; margin:0 auto; box-shadow:0 4px 16px rgba(0,0,0,0.04);" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Section -->
          <tr>
            <td style="padding:36px 28px 24px 28px; text-align:center; border-bottom:1px solid #f4f4f5;">
              <div style="font-size:10px; font-weight:700; letter-spacing:0.22em; color:#71717a; text-transform:uppercase; margin-bottom:8px;">DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING</div>
              <div style="font-size:18px; font-weight:800; letter-spacing:0.1em; color:#09090b; text-transform:uppercase; margin-bottom:16px;">INFINITY HACKATHON 2026</div>
              
              <!-- Pending Status Badge -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 16px auto;">
                <tr>
                  <td style="padding:6px 14px; border-radius:9999px; background:#fffbeb; border:1px solid #fde68a; color:#b45309; font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase;">
                    ⏳ REGISTRATION RECEIVED &bull; VERIFICATION PENDING
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 8px 0; font-size:24px; font-weight:800; color:#09090b; letter-spacing:-0.02em;">Squad ${teamName}</h1>
              <p style="margin:0 auto; font-size:13px; color:#71717a; line-height:1.6; max-width:460px;">
                Your registration has been successfully received and is currently under administrative review. Once your payment is verified, you will receive an official Confirmed Squad Pass.
              </p>
            </td>
          </tr>

          <!-- Summary Section -->
          <tr>
            <td style="padding:24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border:1px solid #e4e4e7; border-radius:8px; overflow:hidden;">
                <tr>
                  <td style="padding:14px 18px; border-bottom:1px solid #e4e4e7; background:#f4f4f5;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="left">
                          <span style="font-size:10px; font-weight:600; color:#71717a; letter-spacing:0.14em; text-transform:uppercase;">REGISTRATION REFERENCE ID</span>
                          <div style="font-size:19px; font-weight:800; color:#09090b; font-family:monospace; margin-top:2px;">${teamId}</div>
                        </td>
                        <td align="right">
                          <span style="display:inline-block; padding:4px 10px; border-radius:4px; background:#ffffff; border:1px solid #e4e4e7; color:#09090b; font-size:11px; font-weight:700; font-family:monospace;">${size} MEMBERS</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 18px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6" border="0" style="font-size:12px;">
                      <tr>
                        <td style="color:#71717a; font-weight:500; width:34%;">Payment Status</td>
                        <td style="color:#b45309; font-weight:700;">
                          <span style="display:inline-block; padding:3px 8px; border-radius:4px; background:#fffbeb; border:1px solid #fde68a;">⏳ PENDING ADMIN VERIFICATION</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:500;">Institution</td>
                        <td style="color:#09090b; font-weight:600;">${college}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:500;">Track / Domain</td>
                        <td style="color:#09090b; font-weight:700;">${domain}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:500;">Bank UTR / Ref</td>
                        <td style="color:#18181b; font-family:monospace;">${utr}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:500;">Total Fee Submitted</td>
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
                        <td style="color:#71717a; font-weight:500;">Status Check Link</td>
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
                REGISTERED SQUAD ROSTER
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border:1px solid #e4e4e7; border-radius:8px; overflow:hidden;">
                ${rosterRows}
              </table>
            </td>
          </tr>

          <!-- What Happens Next Note -->
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border:1px solid #e4e4e7; border-radius:8px; padding:16px 18px;">
                <tr>
                  <td>
                    <div style="font-size:10px; font-weight:700; color:#71717a; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px;">
                      What Happens Next?
                    </div>
                    <ul style="margin:0; padding-left:16px; color:#52525b; font-size:12px; line-height:1.6;">
                      <li>Our administrative desk is verifying your payment UTR (<strong style="color:#09090b;">${utr}</strong>) against the banking statement.</li>
                      <li>Once verified, you will receive an official <strong style="color:#09090b;">Payment Verified &bull; Official Pass Issued</strong> email.</li>
                      <li>You can log into your Leader Portal anytime to check live verification status and track event announcements.</li>
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
                      ACCESS SQUAD PORTAL &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="margin-top:12px; font-size:11px; color:#71717a;">
                Reference ID: <strong style="color:#09090b; font-family:monospace;">${teamId}</strong> &bull; Log in with your leader email &amp; squad password.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f4f4f5; padding:20px 24px; text-align:center; border-top:1px solid #e4e4e7; font-size:11px; color:#71717a; line-height:1.6;">
              <p style="margin:0 0 4px 0; color:#52525b; font-weight:500;">Infinity Hackathon 2026 &bull; Department of Computer Science &amp; Engineering</p>
              <p style="margin:0;">Need assistance? Contact <a href="mailto:infinity.hackathon@gvpcdpgc.edu.in" style="color:#09090b; text-decoration:underline;">infinity.hackathon@gvpcdpgc.edu.in</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return await dispatchEmailTransport({
    to: leaderEmail,
    cc: memberEmails,
    subject,
    html: htmlContent,
    env,
    team,
    debugLabel: 'Registration Pending Email'
  });
}

export async function sendPaymentVerifiedEmail({ team, appUrl = 'https://infinity.akao.in', env = {}, rawPassword = null, domains = null }) {
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

  // Dynamically load active domains from database if not passed directly to ensure latest admin venue changes
  let activeDomains = domains;
  if (!activeDomains || !Array.isArray(activeDomains)) {
    try {
      const db = await loadDb(env);
      activeDomains = db.domains;
    } catch (e) {
      activeDomains = null;
    }
  }

  // Find live room allocated for this domain from activeDomains (updated by admin)
  const normTeamDomain = normalizeDomainId(team.preferredDomain);
  const matchedDomain = Array.isArray(activeDomains) ? activeDomains.find(d => {
    const dNorm = normalizeDomainId(d.id || d.stoneId);
    return dNorm === normTeamDomain || d.id === team.preferredDomain || d.stoneId === team.preferredDomain;
  }) : null;

  // Domain fallback mappings if database has not set a custom room
  const fallbackRooms = {
    transportation: 'Lab Block 3 (CS-301) — Transportation & Logistics Hub',
    cybersecurity: 'Lab Block 2 (IoT-204) — Cybersecurity & Digital Trust Wing',
    infrastructure: 'Innovation Wing (IW-102) — Digital Public Infrastructure Arena',
    cleantech: 'Hardware & IoT Arena (HA-01) — Clean & Green Tech Lab',
    education: 'CS Block (DataLab-401) — Smart Education Lab',
    healthcare: 'Seminar Hall 2 — MedTech & Healthcare Deck'
  };

  // Live room resolution:
  // 1. If admin updated the domain's room in db.domains, use that live venue!
  // 2. If the squad has a specific desk/table assigned (e.g. Table A-12), incorporate it.
  // 3. Fallback to fallbackRooms[normTeamDomain]
  let room = '';
  if (matchedDomain && matchedDomain.roomAllocated && String(matchedDomain.roomAllocated).trim() && !String(matchedDomain.roomAllocated).trim().startsWith('TBA')) {
    const liveRoom = String(matchedDomain.roomAllocated).trim();
    if (team.roomAllocated && (team.roomAllocated.startsWith('Table') || team.roomAllocated.startsWith('Desk'))) {
      room = `${team.roomAllocated} (${liveRoom})`;
    } else {
      room = liveRoom;
    }
  } else if (team.roomAllocated && !team.roomAllocated.startsWith('TBA')) {
    room = team.roomAllocated.trim();
  } else {
    room = fallbackRooms[normTeamDomain] || 'Main Campus Innovation Arena (Lab Block 3)';
  }

  const roomEscaped = escapeEmailHtml(room);

  const utr = escapeEmailHtml(team.payment?.utr || 'VERIFIED');
  const amount = escapeEmailHtml(team.payment?.amount || (team.teamSize || 4) * 349);
  const size = escapeEmailHtml(team.teamSize || (teamMembers.length + 1));

  let rosterRows = `
    <tr>
      <td style="padding:10px 14px; border-bottom:1px solid #e4e4e7; width:80px;">
        <span style="display:inline-block; padding:3px 8px; border-radius:4px; background:#09090b; color:#ffffff; font-size:9px; font-weight:800; letter-spacing:0.06em; font-family:monospace;">CAPTAIN</span>
      </td>
      <td style="padding:10px 14px; border-bottom:1px solid #e4e4e7; color:#09090b; font-weight:700; font-size:13px;">
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
        <td style="padding:10px 14px; ${borderStyle} color:#18181b; font-weight:600; font-size:13px;">
          ${escapeEmailHtml(m.name || 'Squad Member')}
        </td>
        <td style="padding:10px 14px; ${borderStyle} color:#71717a; font-size:12px; font-family:monospace;">
          ${escapeEmailHtml(m.email || '')} ${m.phone ? `&bull; ${escapeEmailHtml(m.phone)}` : ''}
        </td>
      </tr>
    `;
  });

  const subject = `✓ Confirmed Squad Pass & Venue Allocation — Infinity Hackathon 2026 | Squad ${team.teamName} [${team.id}]`;
  const cleanAppUrl = (appUrl || 'https://infinity.akao.in').replace(/\/$/, '');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#09090b; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5; min-height:100vh; padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:620px; background-color:#ffffff; border:1px solid #e4e4e7; border-radius:12px; overflow:hidden; margin:0 auto; box-shadow:0 8px 30px rgba(0,0,0,0.06);" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding:36px 32px 24px 32px; text-align:center; background:linear-gradient(180deg, #ffffff 0%, #fafafa 100%); border-bottom:1px solid #e4e4e7;">
              <div style="font-size:10px; font-weight:800; letter-spacing:0.22em; color:#71717a; text-transform:uppercase; margin-bottom:8px;">DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING</div>
              <div style="font-size:20px; font-weight:900; letter-spacing:0.08em; color:#09090b; text-transform:uppercase; margin-bottom:16px;">INFINITY HACKATHON 2026</div>
              
              <!-- Verified Status Pill -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 16px auto;">
                <tr>
                  <td style="padding:7px 18px; border-radius:9999px; background:#ecfdf5; border:1px solid #a7f3d0; color:#047857; font-size:11px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase;">
                    ✓ PAYMENT VERIFIED &bull; OFFICIAL SQUAD PASS ISSUED
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 10px 0; font-size:26px; font-weight:900; color:#09090b; letter-spacing:-0.03em;">Squad ${teamName}</h1>
              <p style="margin:0 auto; font-size:14px; color:#52525b; line-height:1.6; max-width:480px;">
                Congratulations! Your payment has been successfully verified. Squad <strong>${teamName}</strong> is officially confirmed for <strong>Infinity Hackathon 2026</strong>. Review your venue allocation, event timings, and mandatory rules below.
              </p>
            </td>
          </tr>

          <!-- Official Pass & Allocation Summary -->
          <tr>
            <td style="padding:24px 28px 16px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border:1px solid #e4e4e7; border-radius:10px; overflow:hidden;">
                
                <!-- Ticket ID Bar -->
                <tr>
                  <td style="padding:14px 20px; border-bottom:1px solid #e4e4e7; background:#f4f4f5;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="left">
                          <span style="font-size:10px; font-weight:700; color:#71717a; letter-spacing:0.14em; text-transform:uppercase;">OFFICIAL SQUAD PASS ID</span>
                          <div style="font-size:22px; font-weight:900; color:#09090b; font-family:monospace; margin-top:2px; letter-spacing:0.04em;">${teamId}</div>
                        </td>
                        <td align="right">
                          <span style="display:inline-block; padding:5px 12px; border-radius:6px; background:#ffffff; border:1px solid #d4d4d8; color:#09090b; font-size:11px; font-weight:800; font-family:monospace;">${size} MEMBERS</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Venue & Domain Callout Highlight -->
                <tr>
                  <td style="padding:16px 20px; background:#f0fdf4; border-bottom:1px solid #bbf7d0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width:28px; vertical-align:top; font-size:20px; line-height:1;">🏛️</td>
                        <td style="padding-left:10px;">
                          <div style="font-size:10px; font-weight:800; color:#15803d; letter-spacing:0.14em; text-transform:uppercase;">ALLOCATED VENUE &amp; LAB ROOM</div>
                          <div style="font-size:16px; font-weight:800; color:#14532d; margin-top:3px;">${roomEscaped}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Key Specs Grid -->
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6" border="0" style="font-size:13px;">
                      <tr>
                        <td style="color:#71717a; font-weight:600; width:36%;">Team Name</td>
                        <td style="color:#09090b; font-weight:800;">${teamName}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:600;">Track / Domain</td>
                        <td style="color:#09090b; font-weight:800;">
                          <span style="display:inline-block; padding:3px 8px; border-radius:4px; background:#f4f4f5; border:1px solid #e4e4e7; font-family:monospace;">${domain}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:600;">Institution / College</td>
                        <td style="color:#09090b; font-weight:600;">${college}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:600;">Payment Status</td>
                        <td style="color:#047857; font-weight:800;">
                          <span style="display:inline-block; padding:3px 8px; border-radius:4px; background:#ecfdf5; border:1px solid #a7f3d0;">✓ VERIFIED &bull; APPROVED</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:600;">Bank UTR / Transaction Ref</td>
                        <td style="color:#18181b; font-family:monospace; font-weight:700;">${utr}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:600;">Registration Fee Paid</td>
                        <td style="color:#09090b; font-weight:800;">₹${amount}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a; font-weight:600;">Leader Email (Login ID)</td>
                        <td style="color:#09090b; font-family:monospace; font-weight:700;">${leaderEmail}</td>
                      </tr>
                      ${rawPassword ? `
                      <tr>
                        <td style="color:#71717a; font-weight:600;">Team Password</td>
                        <td style="color:#09090b; font-family:monospace; font-weight:800;">${escapeEmailHtml(rawPassword)}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="color:#71717a; font-weight:600;">Leader Portal</td>
                        <td style="color:#09090b; font-family:monospace; font-size:12px;">
                          <a href="${cleanAppUrl}/leader?team=${teamId}" target="_blank" style="color:#09090b; font-weight:700; text-decoration:underline;">${cleanAppUrl}/leader?team=${teamId}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Squad Roster Table -->
          <tr>
            <td style="padding:8px 28px 20px 28px;">
              <div style="font-size:11px; font-weight:800; letter-spacing:0.14em; color:#71717a; text-transform:uppercase; margin-bottom:8px;">
                CONFIRMED SQUAD ROSTER (${size} PARTICIPANTS)
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border:1px solid #e4e4e7; border-radius:8px; overflow:hidden;">
                ${rosterRows}
              </table>
            </td>
          </tr>


          <!-- Mandatory Rules & Guidelines Highlighted with Icons -->
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <div style="font-size:11px; font-weight:800; letter-spacing:0.14em; color:#71717a; text-transform:uppercase; margin-bottom:10px;">
                MANDATORY RULES &amp; PARTICIPATION GUIDELINES
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff; border:1px solid #e4e4e7; border-radius:10px; overflow:hidden;">
                
                <!-- Rule 1: Own Laptops & Chargers -->
                <tr>
                  <td style="padding:14px 16px; border-bottom:1px solid #f4f4f5; background:#fafafa;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width:36px; vertical-align:top; font-size:22px; line-height:1;">💻</td>
                        <td style="padding-left:12px;">
                          <div style="font-size:13px; font-weight:800; color:#09090b; margin-bottom:3px;">
                            Bring Your Own Laptops &amp; Original Chargers
                          </div>
                          <div style="font-size:12px; color:#52525b; line-height:1.5;">
                            Every participant must bring their own personal laptop and dedicated power charger. Ensure code editors, compilers, package managers, and runtime SDKs are installed before arriving on campus.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Rule 2: Charging Ports & Electric Spikes / Extension Boards -->
                <tr>
                  <td style="padding:14px 16px; border-bottom:1px solid #f4f4f5; background:#fafafa;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width:36px; vertical-align:top; font-size:22px; line-height:1;">🔌</td>
                        <td style="padding-left:12px;">
                          <div style="font-size:13px; font-weight:800; color:#09090b; margin-bottom:3px;">
                            Charging Ports &amp; Electric Spikes (Multi-Plug Boards)
                          </div>
                          <div style="font-size:12px; color:#52525b; line-height:1.5;">
                            Each squad must carry at least one <strong>3-pin / 4-pin electric spike extension strip (multi-plug board)</strong>. This guarantees that all team members can power their laptops and mobile devices simultaneously at your assigned desk without socket congestion.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Rule 3: Zero Tolerance for Misbehavior -->
                <tr>
                  <td style="padding:14px 16px; border-bottom:1px solid #f4f4f5; background:#fff1f2;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width:36px; vertical-align:top; font-size:22px; line-height:1;">🚫</td>
                        <td style="padding-left:12px;">
                          <div style="font-size:13px; font-weight:800; color:#be123c; margin-bottom:3px;">
                            Strict Zero-Tolerance for Misbehavior &amp; Indiscipline
                          </div>
                          <div style="font-size:12px; color:#9f1239; line-height:1.5;">
                            Any abusive language, indiscipline, damage to lab equipment or college infrastructure, harassment, or unauthorized exit from the campus is strictly forbidden. Any violation results in <strong>IMMEDIATE DISQUALIFICATION of the entire squad</strong> and escalation to campus security.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Rule 4: Anti-Plagiarism & Authentic Code -->
                <tr>
                  <td style="padding:14px 16px; border-bottom:1px solid #f4f4f5; background:#fafafa;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width:36px; vertical-align:top; font-size:22px; line-height:1;">🛡️</td>
                        <td style="padding-left:12px;">
                          <div style="font-size:13px; font-weight:800; color:#09090b; margin-bottom:3px;">
                            Original Code Only &bull; Anti-Plagiarism Policy
                          </div>
                          <div style="font-size:12px; color:#52525b; line-height:1.5;">
                            All source code must be developed strictly during the 24-hour sprint. Pre-built applications, cloned templates, or copy-pasted projects will be caught by automated Git commit inspections and will lead to instant disqualification.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Rule 5: College ID Cards -->
                <tr>
                  <td style="padding:14px 16px; background:#fafafa;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width:36px; vertical-align:top; font-size:22px; line-height:1;">🪪</td>
                        <td style="padding-left:12px;">
                          <div style="font-size:13px; font-weight:800; color:#09090b; margin-bottom:3px;">
                            Mandatory Physical College ID Cards
                          </div>
                          <div style="font-size:12px; color:#52525b; line-height:1.5;">
                            Every participant must carry their original college photo identity card. You must present your College ID and this Official Pass ID (<strong>${teamId}</strong>) at entrance security and coordinator check-in.
                          </div>
                        </td>
                      </tr>
                    </table>
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
                    <a href="${cleanAppUrl}/leader?team=${teamId}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:14px 38px; font-size:13px; font-weight:800; color:#ffffff; text-decoration:none; text-transform:uppercase; letter-spacing:0.08em;">
                      ACCESS SQUAD PORTAL &amp; PASS &rarr;
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
              <p style="margin:0 0 4px 0; color:#52525b; font-weight:600;">Infinity Hackathon 2026 &bull; Department of Computer Science &amp; Engineering</p>
              <p style="margin:0;">Need assistance? Contact <a href="mailto:infinity.hackathon@gvpcdpgc.edu.in" style="color:#09090b; text-decoration:underline;">infinity.hackathon@gvpcdpgc.edu.in</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return await dispatchEmailTransport({
    to: leaderEmail,
    cc: memberEmails,
    subject,
    html: htmlContent,
    env,
    team,
    debugLabel: 'Payment Verified Pass Email'
  });
}

const fgtRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  message: 'Too many password reset attempts. Please wait 15 minutes before trying again.'
});

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();
  const origin = request.headers.get('Origin');

  // Verify origin if present
  if (origin && !isAllowedOrigin(origin, env)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Cross-origin request blocked by CORS security policy.'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Vary': 'Origin',
      },
    });
  }

  // 1. CORS Preflight
  if (method === 'OPTIONS') {
    return handleOptions(request, env);
  }

  // Scoped jsonResponse automatically binding request and env for CORS
  const jsonResponse = (data, status = 200, extraHeaders = {}) =>
    makeJsonResponse(data, status, extraHeaders, request, env);

  const clientIp = getClientIp(request);

  // Global API Rate Limiting (600 req / min)
  const globalCheck = apiRateLimiter.isLimited(`${clientIp}:api`);
  if (globalCheck.limited) {
    return jsonResponse({
      success: false,
      error: globalCheck.message,
      retryAfter: globalCheck.retryAfter
    }, 429, {
      'Retry-After': String(globalCheck.retryAfter),
      'X-RateLimit-Limit': '600',
      'X-RateLimit-Remaining': '0'
    });
  }

  const ADMIN_SECRET = env.ADMIN_SECRET || 'admin123';
  const COORDINATOR_PASS = env.COORDINATOR_PASS || 'coord2026';
  const JUDGES_PASS = env.JUDGES_PASS || 'judge2026';
  const PUBLIC_DOMAIN = env.CLOUDFLARE_R2_PUBLIC_DOMAIN || 'https://pub-aa1b426e7ec64c31a70bdd49676fdec1.r2.dev';

  try {
    // -------------------------------------------------------------
    // Health Check & Stats
    // -------------------------------------------------------------
    if (pathname === '/api/health') {
      return jsonResponse({
        success: true,
        status: 'operational',
        edge: 'cloudflare-pages',
        timestamp: new Date().toISOString(),
      });
    }

    if (pathname === '/api/stats') {
      const db = await loadDb(env);
      const totalTeams = db.teams.length;
      const confirmedTeams = db.teams.filter(t => t.payment?.status === 'confirmed').length;
      const totalRevenue = db.teams.reduce((acc, t) => acc + (t.payment?.amount || 0), 0);
      return jsonResponse({
        success: true,
        totalTeams,
        confirmedTeams,
        totalRevenue,
      });
    }

    // -------------------------------------------------------------
    // Domains & Problem Statements
    // -------------------------------------------------------------
    if (pathname === '/api/domains' && method === 'GET') {
      const db = await loadDb(env);
      const registrationOpen = db.settings ? db.settings.registrationOpen !== false : true;
      return jsonResponse({ success: true, domains: db.domains, registrationOpen });
    }

    // -------------------------------------------------------------
    // Public Registration Status
    // -------------------------------------------------------------
    if (pathname === '/api/registration-status' && method === 'GET') {
      const db = await loadDb(env);
      const registrationOpen = db.settings ? db.settings.registrationOpen !== false : true;
      return jsonResponse({ success: true, registrationOpen });
    }

    // -------------------------------------------------------------
    // Payment QR Codes (Public)
    // -------------------------------------------------------------
    if (pathname === '/api/payment-qrs' && method === 'GET') {
      const db = await loadDb(env);
      const paymentQrs = db.paymentQrs || {
        member3: '/3mem.png',
        member4: '/4mem.png',
      };
      return jsonResponse({ success: true, paymentQrs });
    }

    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // Verify UTR Uniqueness
    // -------------------------------------------------------------
    if (pathname === '/api/verify-utr' && method === 'GET') {
      const utr = (url.searchParams.get('utr') || '').trim();
      if (!utr) return jsonResponse({ exists: false });

      const db = await loadDb(env);
      const existing = db.teams.find(
        (t) => t.payment?.utr && t.payment.utr.trim().toLowerCase() === utr.toLowerCase()
      );
      return jsonResponse({ exists: Boolean(existing), utr });
    }

    // -------------------------------------------------------------
    // Verify Participant (Email & Phone) Real-Time Uniqueness
    // -------------------------------------------------------------
    if (pathname === '/api/verify-participant' && method === 'GET') {
      const email = (url.searchParams.get('email') || '').trim().toLowerCase();
      const phone = normalizePhone(url.searchParams.get('phone') || '');
      const excludeTeamId = (url.searchParams.get('teamId') || '').trim();

      if (!email && !phone) {
        return jsonResponse({ exists: false });
      }

      const db = await loadDb(env);
      for (const team of db.teams || []) {
        if (excludeTeamId && team.id === excludeTeamId) continue;

        if (email) {
          if (team.leader?.email?.trim().toLowerCase() === email) {
            return jsonResponse({ exists: true, field: 'email', value: email, teamName: team.teamName, teamId: team.id, role: 'Team Leader' });
          }
          const m = (team.members || []).find((mem) => mem.email?.trim().toLowerCase() === email);
          if (m) {
            return jsonResponse({ exists: true, field: 'email', value: email, teamName: team.teamName, teamId: team.id, role: 'Team Member' });
          }
        }

        if (phone) {
          if (normalizePhone(team.leader?.phone) === phone) {
            return jsonResponse({ exists: true, field: 'phone', value: phone, teamName: team.teamName, teamId: team.id, role: 'Team Leader' });
          }
          const m = (team.members || []).find((mem) => normalizePhone(mem.phone) === phone);
          if (m) {
            return jsonResponse({ exists: true, field: 'phone', value: phone, teamName: team.teamName, teamId: team.id, role: 'Team Member' });
          }
        }
      }

      return jsonResponse({ exists: false });
    }

    // -------------------------------------------------------------
    // Team Registration
    // -------------------------------------------------------------
    if (pathname === '/api/register' && method === 'POST') {
      const regCheck = regRateLimiter.isLimited(`${clientIp}:register`);
      if (regCheck.limited) {
        return jsonResponse({
          success: false,
          error: regCheck.message,
          retryAfter: regCheck.retryAfter
        }, 429, {
          'Retry-After': String(regCheck.retryAfter)
        });
      }

      const dbCheck = await loadDb(env);
      if (dbCheck.settings && dbCheck.settings.registrationOpen === false) {
        return jsonResponse({
          success: false,
          error: 'Registrations for Infinity Hackathon 2026 are currently closed by the organizers.'
        }, 403);
      }

      let teamName, college, preferredDomain, techStack, teamSize, teamPassword;
      let leaderName, leaderEmail, leaderPhone, paymentUtr, paymentPhone, members;
      let screenshotBuffer = null;
      let screenshotMime = 'image/png';
      let screenshotExt = '.png';

      const contentType = request.headers.get('content-type') || '';

      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        teamName = formData.get('teamName');
        college = formData.get('college');
        preferredDomain = formData.get('preferredDomain');
        techStack = formData.get('techStack');
        teamSize = formData.get('teamSize');
        teamPassword = formData.get('teamPassword');
        leaderName = formData.get('leaderName');
        leaderEmail = formData.get('leaderEmail');
        leaderPhone = formData.get('leaderPhone');
        paymentUtr = formData.get('paymentUtr');
        paymentPhone = formData.get('paymentPhone');
        members = formData.get('members');

        const file = formData.get('paymentScreenshot');
        if (file && typeof file === 'object' && file.size > 0) {
          if (file.size < 15 * 1024) {
            return jsonResponse({
              success: false,
              error: `Uploaded image file size (${(file.size / 1024).toFixed(1)} KB) is too small to be a payment receipt. Logos, icons, and small images are not accepted.`,
            }, 400);
          }
          if (file.size > 20 * 1024 * 1024) {
            return jsonResponse({
              success: false,
              error: `Payment screenshot exceeds the 20MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload an image under 20MB.`,
            }, 400);
          }
          screenshotBuffer = await file.arrayBuffer();
          screenshotMime = file.type || 'image/png';
          if (file.name && file.name.includes('.')) {
            const rawExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            const allowedExts = ['.png', '.jpg', '.jpeg', '.webp'];
            screenshotExt = allowedExts.includes(rawExt) ? rawExt : '.png';
          }
        }
      } else {
        const body = await request.json();
        ({
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
        } = body);
      }

      if (!teamName || !college || !preferredDomain || !teamPassword || !leaderName || !leaderEmail || !leaderPhone || !paymentUtr) {
        return jsonResponse({ success: false, error: 'Missing mandatory registration fields. All leader and squad details are required.' }, 400);
      }

      const cleanUtr = (paymentUtr || '').trim();
      if (cleanUtr.length < 10 || cleanUtr.length > 22 || !/^[A-Za-z0-9]+$/.test(cleanUtr) || isDummyUtr(cleanUtr)) {
        return jsonResponse({
          success: false,
          error: `Invalid or fake Payment UTR: '${paymentUtr}'. Authentic 12-digit UPI reference number required.`,
        }, 400);
      }

      if (!screenshotBuffer) {
        return jsonResponse({
          success: false,
          error: 'Payment confirmation screenshot is required. Please upload your payment receipt (Max 20MB).',
        }, 400);
      }

      const imgDim = getImageDimensions(screenshotBuffer);
      if (!imgDim) {
        return jsonResponse({
          success: false,
          error: 'Invalid receipt file format. Only authentic PNG, JPEG, or WebP screenshot files are accepted.',
        }, 400);
      }
      if ((imgDim.width < 250 && imgDim.height < 300) && (imgDim.height < 250 && imgDim.width < 300)) {
        return jsonResponse({
          success: false,
          error: `Uploaded image dimensions (${imgDim.width}x${imgDim.height}px) are too small for a payment receipt screenshot. Logos, icons, and small images are not accepted.`,
        }, 400);
      }

      const cleanLeaderEmail = (leaderEmail || '').trim().toLowerCase();
      if (!isValidEmail(cleanLeaderEmail)) {
        return jsonResponse({
          success: false,
          error: `Invalid Leader Email format: '${leaderEmail}'. Please enter a valid email address (e.g. name@domain.com).`,
        }, 400);
      }

      const cleanLeaderPhone = normalizePhone(leaderPhone);
      if (!isValidPhone(cleanLeaderPhone)) {
        return jsonResponse({
          success: false,
          error: `Invalid Leader Phone number: '${leaderPhone}'. Please provide a valid 10-digit mobile number.`,
        }, 400);
      }

      // Parse members
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
        return jsonResponse({ success: false, error: 'Team size must be strictly 3 or 4 members.' }, 400);
      }

      const expectedMemberCount = parsedSize - 1; // 2 for size 3, 3 for size 4
      if (parsedMembers.length < expectedMemberCount) {
        return jsonResponse({
          success: false,
          error: `Team size is ${parsedSize} members, but details for only ${parsedMembers.length + 1} were provided. Please fill all member details.`,
        }, 400);
      }

      // Validate each teammate's name, email, and phone
      const validatedMembers = [];
      for (let i = 0; i < expectedMemberCount; i++) {
        const m = parsedMembers[i] || {};
        const mName = (m.name || '').trim();
        const mEmail = (m.email || '').trim().toLowerCase();
        const mPhone = normalizePhone(m.phone);

        if (!mName) {
          return jsonResponse({ success: false, error: `Member 0${i + 2} name is required.` }, 400);
        }
        if (!isValidEmail(mEmail)) {
          return jsonResponse({
            success: false,
            error: `Invalid email format for Member 0${i + 2} (${mName}): '${m.email}'. Please provide a valid email.`,
          }, 400);
        }
        if (!isValidPhone(mPhone)) {
          return jsonResponse({
            success: false,
            error: `Invalid mobile number for Member 0${i + 2} (${mName}): '${m.phone}'. Please provide a valid 10-digit number.`,
          }, 400);
        }

        validatedMembers.push({
          name: mName,
          email: mEmail,
          phone: mPhone,
        });
      }

      // Upload screenshot to R2 if provided
      let screenshotUrl = '/placeholder-receipt.png';
      if (screenshotBuffer && env.BUCKET) {
        const key = `receipts/${Date.now()}-${Math.random().toString(36).substring(2, 8)}${screenshotExt}`;
        await env.BUCKET.put(key, screenshotBuffer, {
          httpMetadata: { contentType: screenshotMime },
        });
        screenshotUrl = `${PUBLIC_DOMAIN.replace(/\/$/, '')}/${key}`;
      }

      const calculatedAmount = 349 * parsedSize; // 3 => ₹1,047; 4 => ₹1,396

      let parsedTechStack = [];
      if (Array.isArray(techStack)) {
        parsedTechStack = techStack;
      } else if (typeof techStack === 'string') {
        parsedTechStack = techStack.split(',').map((s) => s.trim()).filter(Boolean);
      }

      const teamId = `INF-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTeam = {
        id: teamId,
        teamName: stripHtmlTags(teamName),
        college: stripHtmlTags(college),
        preferredDomain: stripHtmlTags(preferredDomain).toLowerCase(),
        techStack: parsedTechStack.map(s => stripHtmlTags(s)),
        teamSize: parsedSize,
        teamPassword: await hashPassword(teamPassword.trim()),
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
        reviews: {
          r1: { attended: false, time: null, notes: '' },
          r2: { attended: false, time: null, notes: '' },
          r3: { attended: false, time: null, notes: '' },
        },
        food: {
          dinner: { collected: false, time: null },
          breakfast: { collected: false, time: null },
          lunch: { collected: false, time: null },
        },
        scores: {
          innovation: 0,
          technical: 0,
          execution: 0,
          presentation: 0,
          total: 0,
          remarks: '',
        },
        createdAt: new Date().toISOString(),
        status: 'confirmed',
      };

      const allParticipants = [
        { role: 'Team Leader', name: (leaderName || '').trim(), email: cleanLeaderEmail, phone: cleanLeaderPhone },
        ...validatedMembers.map((m, i) => ({
          role: `Member 0${i + 2}`,
          name: m.name,
          email: m.email,
          phone: m.phone,
        })),
      ];

      // Atomic Registration Transaction with OCC
      const { result } = await updateDb(env, async (db) => {
        // Check for duplicate participants (Intra-team & Cross-team)
        const conflict = checkParticipantConflicts(db.teams, allParticipants);
        if (conflict.conflict) {
          const err = new Error(conflict.message);
          err.statusCode = 409;
          throw err;
        }

        // Enforce unique UTR
        const duplicateUtr = db.teams.find(
          (t) => t.payment?.utr && t.payment.utr.trim().toLowerCase() === cleanUtr.toLowerCase()
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
        const appUrl = (env.APP_URL || new URL(request.url).origin).replace(/\/$/, '');
        await sendRegistrationPendingEmail({
          team: result.newTeam,
          appUrl,
          env,
          rawPassword: teamPassword ? teamPassword.trim() : null
        });
        mailDispatched = true;
        // Mark registrationMailSent in database (official payment verification mail is NOT sent yet)
        await updateDb(env, async (db) => {
          const t = db.teams.find(x => x.id === result.newTeam.id);
          if (t) {
            t.registrationMailSent = true;
            t.registrationMailSentAt = new Date().toISOString();
            if (t.payment) {
              t.payment.mailSent = false;
            }
          }
        });
      } catch (mErr) {
        console.warn('Auto registration confirmation email warning:', mErr.message);
        mailError = mErr.message;
      }

      const token = await generateTeamToken(result.newTeam.id, ADMIN_SECRET);

      return jsonResponse({
        success: true,
        message: `Registration successful for ${result.newTeam.teamName}! Total registration fee: ₹${result.calculatedAmount}.`,
        mailSent: mailDispatched,
        mailError: mailError,
        token: token,
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
    }

    // -------------------------------------------------------------
    // Team Leader Login
    // -------------------------------------------------------------
    if (pathname === '/api/teams/login' && method === 'POST') {
      const authKey = `${clientIp}:teams-login`;
      const check = authRateLimiter.isLimited(authKey);
      if (check.limited) {
        return jsonResponse({
          success: false,
          error: check.message,
          retryAfter: check.retryAfter
        }, 429, {
          'Retry-After': String(check.retryAfter)
        });
      }

      const { email, password } = await request.json();
      if (!email || !password) {
        return jsonResponse({ success: false, error: 'Leader email and team password are required.' }, 400);
      }

      const db = await loadDb(env);
      const cleanEmail = email.trim().toLowerCase();
      const team = db.teams.find(
        (t) => t.leader?.email && t.leader.email.trim().toLowerCase() === cleanEmail
      );

      const isCorrect = team ? await verifyPassword(password, team.teamPassword) : false;
      if (!team || !isCorrect) {
        return jsonResponse({ success: false, error: 'Invalid leader email or team password.' }, 401);
      }

      // Reset rate limiter on successful authentication
      authRateLimiter.reset(authKey);

      // Auto-upgrade legacy plaintext password if verified
      if (!team.teamPassword.startsWith('pbkdf2:')) {
        await updateDb(env, async (db) => {
          const t = db.teams.find((x) => x.id === team.id);
          if (t && !t.teamPassword.startsWith('pbkdf2:')) {
            t.teamPassword = await hashPassword(password);
          }
        });
      }

      const token = await generateTeamToken(team.id, ADMIN_SECRET);

      const assignedDomain = db.domains.find(
        (d) => d.id === team.preferredDomain || d.stoneId === team.preferredDomain
      ) || db.domains[0];

      // Hide scores and password hash from team response
      const safeTeam = JSON.parse(JSON.stringify(team));
      delete safeTeam.scores;
      delete safeTeam.teamPassword;

      return jsonResponse({ success: true, token, team: safeTeam, domainInfo: assignedDomain });
    }

    // -------------------------------------------------------------
    // Team Leader Session Profile (Session Restore)
    // -------------------------------------------------------------
    if (pathname === '/api/teams/me' && method === 'GET') {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
      if (!token) {
        return jsonResponse({ success: false, error: 'Authorization token required.' }, 401);
      }

      let teamId = null;
      try {
        const decoded = atob(token);
        const [role, tId] = decoded.split(':');
        if (role === 'team' && tId) teamId = tId;
      } catch (e) {}

      if (!teamId) {
        return jsonResponse({ success: false, error: 'Invalid token format.' }, 401);
      }

      const isValid = await verifyTeamToken(token, teamId, ADMIN_SECRET);
      if (!isValid) {
        return jsonResponse({ success: false, error: 'Invalid or expired team token.' }, 401);
      }

      const db = await loadDb(env);
      const team = db.teams.find((t) => t.id === teamId);
      if (!team) {
        return jsonResponse({ success: false, error: 'Team not found.' }, 404);
      }

      const assignedDomain = db.domains.find(
        (d) => d.id === team.preferredDomain || d.stoneId === team.preferredDomain
      ) || db.domains[0];

      const safeTeam = JSON.parse(JSON.stringify(team));
      delete safeTeam.scores;
      delete safeTeam.teamPassword;

      return jsonResponse({ success: true, team: safeTeam, domainInfo: assignedDomain });
    }

    // -------------------------------------------------------------
    // Team Leader Forgot Password - Verify Identity
    // -------------------------------------------------------------
    if (pathname === '/api/teams/forgot-password/verify' && method === 'POST') {
      const authKey = `${clientIp}:teams-forgot-password`;
      const check = fgtRateLimiter.isLimited(authKey);
      if (check.limited) {
        return jsonResponse({
          success: false,
          error: check.message,
          retryAfter: check.retryAfter
        }, 429, {
          'Retry-After': String(check.retryAfter)
        });
      }

      const { email, phone, utr } = await request.json();
      if (!email || (!phone && !utr)) {
        return jsonResponse({
          success: false,
          error: 'Leader email and at least one verification factor (Phone Number or Payment UTR / Team ID) are required.'
        }, 400);
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanPhone = phone ? normalizePhone(phone) : '';
      const cleanUtr = utr ? String(utr).trim().toLowerCase() : '';

      const db = await loadDb(env);
      const team = db.teams.find((t) => {
        if (!t.leader || !t.leader.email) return false;
        const tEmail = t.leader.email.trim().toLowerCase();
        if (tEmail !== cleanEmail) return false;

        const tPhone = normalizePhone(t.leader.phone);
        const tPaymentPhone = t.payment?.phone ? normalizePhone(t.payment.phone) : '';
        const phoneMatch = cleanPhone && (
          (tPhone && (tPhone === cleanPhone || tPhone.endsWith(cleanPhone) || cleanPhone.endsWith(tPhone))) ||
          (tPaymentPhone && (tPaymentPhone === cleanPhone || tPaymentPhone.endsWith(cleanPhone) || cleanPhone.endsWith(tPaymentPhone)))
        );

        const tUtr = String(t.payment?.utr || '').trim().toLowerCase();
        const tId = String(t.id || '').trim().toLowerCase();
        const utrMatch = cleanUtr && (tUtr === cleanUtr || tId === cleanUtr);

        return Boolean(phoneMatch || utrMatch);
      });

      if (!team) {
        return jsonResponse({
          success: false,
          error: 'Verification failed. The provided email, phone number, or payment reference does not match our registration records.'
        }, 401);
      }

      fgtRateLimiter.reset(authKey);

      const resetToken = await generatePasswordResetToken(team.id, ADMIN_SECRET);

      return jsonResponse({
        success: true,
        message: 'Identity verified successfully.',
        resetToken,
        teamId: team.id,
        teamName: team.teamName
      });
    }

    // -------------------------------------------------------------
    // Team Leader Forgot Password - Reset Password
    // -------------------------------------------------------------
    if (pathname === '/api/teams/forgot-password/reset' && method === 'POST') {
      const authKey = `${clientIp}:teams-forgot-password`;
      const check = fgtRateLimiter.isLimited(authKey);
      if (check.limited) {
        return jsonResponse({
          success: false,
          error: check.message,
          retryAfter: check.retryAfter
        }, 429, {
          'Retry-After': String(check.retryAfter)
        });
      }

      const { resetToken, newPassword } = await request.json();
      if (!resetToken || !newPassword) {
        return jsonResponse({
          success: false,
          error: 'Reset token and new password are required.'
        }, 400);
      }

      if (typeof newPassword !== 'string' || newPassword.trim().length < 6) {
        return jsonResponse({
          success: false,
          error: 'New password must be at least 6 characters long.'
        }, 400);
      }

      const teamId = await verifyPasswordResetToken(resetToken, ADMIN_SECRET);
      if (!teamId) {
        return jsonResponse({
          success: false,
          error: 'Invalid or expired password reset pass. Please verify your details again.'
        }, 401);
      }

      fgtRateLimiter.reset(authKey);

      await updateDbWithRetry(env, async (db) => {
        const team = db.teams.find((t) => t.id === teamId);
        if (!team) {
          throw new Error('Team not found.');
        }

        team.teamPassword = await hashPassword(newPassword.trim());
        team.updatedAt = new Date().toISOString();
      });

      return jsonResponse({
        success: true,
        message: 'Password has been successfully updated. You may now log in.'
      });
    }

    // -------------------------------------------------------------
    // Team Leader Update Selection
    // -------------------------------------------------------------
    if (pathname === '/api/teams/update-selection' && method === 'POST') {
      const { email, password, token, newDomainId, problemStatementId } = await request.json();
      const authHeader = request.headers.get('Authorization') || '';
      const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
      const tokenToUse = bearerToken || token;

      if (!email && !tokenToUse) {
        return jsonResponse({ success: false, error: 'Authentication credentials required.' }, 400);
      }

      const db = await loadDb(env);
      let team = null;

      if (email) {
        const cleanEmail = email.trim().toLowerCase();
        team = db.teams.find(
          (t) => t.leader?.email && t.leader.email.trim().toLowerCase() === cleanEmail
        );
      }

      if (!team && tokenToUse) {
        try {
          const decoded = atob(tokenToUse);
          const [role, tId] = decoded.split(':');
          if (role === 'team' && tId) {
            team = db.teams.find((t) => t.id === tId);
          }
        } catch (e) {}
      }

      if (!team) {
        return jsonResponse({ success: false, error: 'Team not found.' }, 404);
      }

      const isTokenValid = tokenToUse ? await verifyTeamToken(tokenToUse, team.id, ADMIN_SECRET) : false;
      const isPassValid = password ? await verifyPassword(password, team.teamPassword) : false;

      if (!isTokenValid && !isPassValid) {
        return jsonResponse({ success: false, error: 'Authentication failed.' }, 401);
      }

      const targetTeamId = team.id;
      const { result } = await updateDb(env, async (db) => {
        const teamInDb = db.teams.find((t) => t.id === targetTeamId);
        if (!teamInDb) {
          const err = new Error('Team not found');
          err.statusCode = 404;
          throw err;
        }

        if (newDomainId && db.domains.some((d) => d.id === newDomainId || d.stoneId === newDomainId)) {
          teamInDb.preferredDomain = newDomainId;
          teamInDb.selectedProblemStatement = null;
        }

        const currentDomain = db.domains.find(
          (d) => d.id === teamInDb.preferredDomain || d.stoneId === teamInDb.preferredDomain
        );

        if (problemStatementId && currentDomain) {
          const ps = currentDomain.problemStatements?.find(
            (p) => p.id === problemStatementId || p.code === problemStatementId
          );
          if (ps) {
            teamInDb.selectedProblemStatement = {
              id: ps.id,
              code: ps.code,
              title: ps.title,
              category: ps.category,
              selectedAt: new Date().toISOString(),
            };
          }
        }

        const safeTeam = JSON.parse(JSON.stringify(teamInDb));
        delete safeTeam.scores;
        delete safeTeam.teamPassword;
        return { team: safeTeam, domainInfo: currentDomain };
      });

      return jsonResponse({ success: true, team: result.team, domainInfo: result.domainInfo });
    }

    // -------------------------------------------------------------
    // Coordinator Login
    // -------------------------------------------------------------
    if (pathname === '/api/coordinator/login' && method === 'POST') {
      const authKey = `${clientIp}:coordinator-login`;
      const check = authRateLimiter.isLimited(authKey);
      if (check.limited) {
        return jsonResponse({
          success: false,
          error: check.message,
          retryAfter: check.retryAfter
        }, 429, {
          'Retry-After': String(check.retryAfter)
        });
      }

      const { password } = (await request.json().catch(() => ({}))) || {};
      if (!COORDINATOR_PASS) {
        return jsonResponse({ success: false, error: 'Coordinator authentication is not configured.' }, 500);
      }
      if (!password) {
        return jsonResponse({ success: false, error: 'Passcode is required.' }, 400);
      }
      if (timingSafeEqualString(password, COORDINATOR_PASS)) {
        authRateLimiter.reset(authKey);
        const token = await generateRoleToken('coordinator', COORDINATOR_PASS);
        return jsonResponse({ success: true, token, message: 'Coordinator clearance granted.' });
      }
      return jsonResponse({ success: false, error: 'Invalid coordinator password.' }, 401);
    }

    // -------------------------------------------------------------
    // Coordinator Authorization Barrier: Guard coordinator actions
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/coordinator/') && pathname !== '/api/coordinator/login') {
      const isAuthorized = await verifyRoleAuth(request, url, 'coordinator', COORDINATOR_PASS);
      if (!isAuthorized) {
        return jsonResponse({ success: false, error: 'Unauthorized: Valid Coordinator clearance required.' }, 401);
      }
    }

    // -------------------------------------------------------------
    // Coordinator Get Teams
    // -------------------------------------------------------------
    if (pathname === '/api/coordinator/teams' && method === 'GET') {
      const db = await loadDb(env);
      const teams = db.teams.map((t) => {
        const copy = { ...t };
        delete copy.scores;
        delete copy.teamPassword;
        return copy;
      });
      return jsonResponse({ success: true, teams });
    }

    // -------------------------------------------------------------
    // Coordinator Mark Food or Review
    // -------------------------------------------------------------
    if (pathname === '/api/coordinator/mark' && method === 'POST') {
      const { teamId, type, key, value, memberIndex, notes } = await request.json();
      if (!teamId || !type || !key) {
        return jsonResponse({ success: false, error: 'Missing teamId, type, or key.' }, 400);
      }

      const { result } = await updateDb(env, async (db) => {
        const team = db.teams.find((t) => t.id === teamId);
        if (!team) {
          const err = new Error('Team not found.');
          err.statusCode = 404;
          throw err;
        }

        if (type === 'meal' || type === 'food') {
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

        // Partitioned attendance snapshot in R2 (Zero-lock isolated write)
        if (env && env.BUCKET) {
          env.BUCKET.put(`attendance/${teamId}.json`, JSON.stringify({ food: team.food, reviews: team.reviews, updatedAt: new Date().toISOString() }, null, 2), {
            httpMetadata: { contentType: 'application/json' }
          }).catch(() => {});
        }

        return { team };
      });

      return jsonResponse({ success: true, team: result.team });
    }

    // -------------------------------------------------------------
    // Judges Login
    // -------------------------------------------------------------
    if (pathname === '/api/judges/login' && method === 'POST') {
      const authKey = `${clientIp}:judges-login`;
      const check = authRateLimiter.isLimited(authKey);
      if (check.limited) {
        return jsonResponse({
          success: false,
          error: check.message,
          retryAfter: check.retryAfter
        }, 429, {
          'Retry-After': String(check.retryAfter)
        });
      }

      const { password } = (await request.json().catch(() => ({}))) || {};
      if (!JUDGES_PASS) {
        return jsonResponse({ success: false, error: 'Judge authentication is not configured.' }, 500);
      }
      if (!password) {
        return jsonResponse({ success: false, error: 'Passcode is required.' }, 400);
      }
      if (timingSafeEqualString(password, JUDGES_PASS)) {
        authRateLimiter.reset(authKey);
        const token = await generateRoleToken('judge', JUDGES_PASS);
        return jsonResponse({ success: true, token, message: 'Judge clearance granted.' });
      }
      return jsonResponse({ success: false, error: 'Invalid judges password.' }, 401);
    }

    // -------------------------------------------------------------
    // Judges Authorization Barrier: Guard judges actions
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/judges/') && pathname !== '/api/judges/login') {
      const isAuthorized = await verifyRoleAuth(request, url, 'judge', JUDGES_PASS);
      if (!isAuthorized) {
        return jsonResponse({ success: false, error: 'Unauthorized: Valid Judge clearance required.' }, 401);
      }
    }

    // -------------------------------------------------------------
    // Judges Get Teams
    // -------------------------------------------------------------
    if (pathname === '/api/judges/teams' && method === 'GET') {
      const db = await loadDb(env);
      const teams = db.teams.map((t) => ({
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
        scores: t.scores || { innovation: 0, technical: 0, execution: 0, presentation: 0, total: 0, remarks: '' },
      }));
      return jsonResponse({ success: true, teams, domains: db.domains });
    }

    // -------------------------------------------------------------
    // Judges Submit Score
    // -------------------------------------------------------------
    if (pathname === '/api/judges/score' && method === 'POST') {
      const { teamId, innovation, technical, execution, presentation, remarks } = await request.json();
      if (!teamId) return jsonResponse({ success: false, error: 'teamId is required.' }, 400);

      const db = await loadDb(env);
      const team = db.teams.find((t) => t.id === teamId);
      if (!team) return jsonResponse({ success: false, error: 'Team not found.' }, 404);

      const numInno = Math.min(25, Math.max(0, parseFloat(innovation) || 0));
      const numTech = Math.min(25, Math.max(0, parseFloat(technical) || 0));
      const numExec = Math.min(25, Math.max(0, parseFloat(execution) || 0));
      const numPres = Math.min(25, Math.max(0, parseFloat(presentation) || 0));
      const total = numInno + numTech + numExec + numPres;

      const { result } = await updateDb(env, async (db) => {
        const team = db.teams.find((t) => t.id === teamId);
        if (!team) {
          const err = new Error('Team not found');
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
          updatedAt: new Date().toISOString(),
        };

        // High-velocity partitioned score snapshot in R2 (Zero-lock isolated write)
        if (env && env.BUCKET) {
          env.BUCKET.put(`scores/${teamId}.json`, JSON.stringify(team.scores, null, 2), {
            httpMetadata: { contentType: 'application/json' }
          }).catch(() => {});
        }

        return { teamId, scores: team.scores };
      });

      return jsonResponse({ success: true, teamId: result.teamId, scores: result.scores });
    }

    // -------------------------------------------------------------
    // Admin Login
    // -------------------------------------------------------------
    if (pathname === '/api/admin/login' && method === 'POST') {
      const authKey = `${clientIp}:admin-login`;
      const check = authRateLimiter.isLimited(authKey);
      if (check.limited) {
        return jsonResponse({
          success: false,
          error: check.message,
          retryAfter: check.retryAfter
        }, 429, {
          'Retry-After': String(check.retryAfter)
        });
      }

      const { password } = (await request.json().catch(() => ({}))) || {};
      if (!ADMIN_SECRET) {
        return jsonResponse({ success: false, error: 'Admin authentication is not configured.' }, 500);
      }
      if (!password) return jsonResponse({ success: false, error: 'Passphrase is required.' }, 400);
      if (timingSafeEqualString(password, ADMIN_SECRET)) {
        authRateLimiter.reset(authKey);
        const token = await generateAdminToken(ADMIN_SECRET);
        return jsonResponse({ success: true, token, message: 'Organizer clearance granted.' });
      }
      return jsonResponse({ success: false, error: 'Invalid admin passphrase.' }, 401);
    }

    // -------------------------------------------------------------
    // Admin Authorization Barrier: Guard all administrative actions
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/admin/')) {
      const isAuthorized = await verifyAdminAuth(request, url, ADMIN_SECRET);
      if (!isAuthorized) {
        return jsonResponse({ success: false, error: 'Unauthorized: Valid Admin Authorization required.' }, 401);
      }
    }

    // -------------------------------------------------------------
    // Admin Get Teams
    // -------------------------------------------------------------
    if (pathname === '/api/admin/teams' && method === 'GET') {
      const db = await loadDb(env);
      const safeTeams = db.teams.map((t) => {
        const copy = { ...t };
        delete copy.teamPassword; // NEVER leak password or hash to admin browser
        copy.hasPassword = Boolean(t.teamPassword);
        return copy;
      });
      return jsonResponse({
        success: true,
        teams: safeTeams,
        settings: db.settings || { registrationOpen: true }
      });
    }

    // -------------------------------------------------------------
    // Admin Settings Get & Toggle Registration
    // -------------------------------------------------------------
    if (pathname === '/api/admin/settings' && method === 'GET') {
      const db = await loadDb(env);
      return jsonResponse({
        success: true,
        settings: db.settings || { registrationOpen: true }
      });
    }

    if (pathname === '/api/admin/toggle-registration' && method === 'POST') {
      const body = (await request.json().catch(() => ({}))) || {};
      const { registrationOpen } = body;
      const { result } = await updateDb(env, async (db) => {
        db.settings = db.settings || { registrationOpen: true };
        if (typeof registrationOpen === 'boolean') {
          db.settings.registrationOpen = registrationOpen;
        } else {
          db.settings.registrationOpen = !db.settings.registrationOpen;
        }
        return { registrationOpen: db.settings.registrationOpen };
      });

      return jsonResponse({
        success: true,
        registrationOpen: result.registrationOpen,
        message: result.registrationOpen ? 'Public registrations are now OPEN.' : 'Public registrations are now CLOSED.'
      });
    }

    // -------------------------------------------------------------
    // Admin Purge All Teams / User Data (Dangerous - strictly requires confirm: "ERASE")
    // -------------------------------------------------------------
    if (pathname === '/api/admin/purge-data' && method === 'POST') {
      const body = (await request.json().catch(() => ({}))) || {};
      const { confirm } = body;
      if (!confirm || (confirm !== 'ERASE' && confirm !== 'DELETE')) {
        return jsonResponse({
          success: false,
          error: 'Confirmation failed. You must provide confirm: "ERASE" to purge all user data.'
        }, 400);
      }

      const { result } = await updateDb(env, async (db) => {
        const count = Array.isArray(db.teams) ? db.teams.length : 0;
        db.teams = [];
        return { purgedCount: count };
      });

      return jsonResponse({
        success: true,
        purgedCount: result.purgedCount,
        message: `All ${result.purgedCount} squad(s) and user data have been permanently erased.`
      });
    }

    // -------------------------------------------------------------
    // Admin Edit Team
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/admin/teams/') && method === 'PUT') {
      const id = pathname.replace('/api/admin/teams/', '').trim();
      const updates = await request.json();

      let finalScreenshotUrl = updates.payment?.screenshotUrl;
      if (finalScreenshotUrl && typeof finalScreenshotUrl === 'string' && finalScreenshotUrl.startsWith('data:image/')) {
        if (env && env.BUCKET) {
          try {
            const match = finalScreenshotUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
            if (match) {
              const mime = match[1];
              const base64Data = match[2];
              const binaryStr = atob(base64Data);
              const bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              const ext = mime.includes('jpeg') || mime.includes('jpg') ? '.jpg' : mime.includes('webp') ? '.webp' : '.png';
              const key = `receipts/admin-${id}-${Date.now()}${ext}`;
              await env.BUCKET.put(key, bytes, {
                httpMetadata: { contentType: mime }
              });
              finalScreenshotUrl = `${PUBLIC_DOMAIN.replace(/\/$/, '')}/${key}`;
            }
          } catch (err) {
            console.warn('Failed to upload admin receipt to R2:', err);
          }
        }
      }

      let updatedTeamPassword = null;
      if (updates.teamPassword && typeof updates.teamPassword === 'string' && updates.teamPassword.trim()) {
        updatedTeamPassword = await hashPassword(updates.teamPassword.trim());
      }

      const { result } = await updateDb(env, async (db) => {
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
          },
        };

        const returnTeam = { ...db.teams[idx] };
        delete returnTeam.teamPassword;
        returnTeam.hasPassword = Boolean(db.teams[idx].teamPassword);
        return { team: returnTeam };
      });

      return jsonResponse({ success: true, team: result.team });
    }

    // -------------------------------------------------------------
    // Admin Delete Team
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/admin/teams/') && method === 'DELETE') {
      const id = pathname.replace('/api/admin/teams/', '').trim();
      const { result } = await updateDb(env, async (db) => {
        const prevLen = db.teams.length;
        db.teams = db.teams.filter((t) => t.id !== id);

        if (db.teams.length === prevLen) {
          const err = new Error('Team not found');
          err.statusCode = 404;
          throw err;
        }
        return { message: `Team ${id} removed.` };
      });

      return jsonResponse({ success: true, message: result.message });
    }

    // -------------------------------------------------------------
    // Admin Update Domains & Problem Statements
    // -------------------------------------------------------------
    if (pathname === '/api/admin/domains' && method === 'PUT') {
      const updatedDomain = await request.json();
      const { result } = await updateDb(env, async (db) => {
        const targetId = normalizeDomainId(updatedDomain.id || updatedDomain.stoneId);
        const idx = db.domains.findIndex((d) => d.id === updatedDomain.id || d.stoneId === updatedDomain.id || d.id === targetId);
        let updatedTeamsCount = 0;

        if (idx >= 0) {
          db.domains[idx] = { ...db.domains[idx], ...updatedDomain };

          // If roomAllocated was updated, optionally sync with teams
          if (updatedDomain.roomAllocated !== undefined && updatedDomain.syncExistingTeams !== false) {
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

        db.domains.push(updatedDomain);
        return { domain: updatedDomain, updatedTeamsCount };
      });

      return jsonResponse({ success: true, domain: result.domain, updatedTeamsCount: result.updatedTeamsCount });
    }

    // -------------------------------------------------------------
    // Admin Bulk Update Stone Areas / Rooms (Protected)
    // -------------------------------------------------------------
    if (pathname === '/api/admin/stone-areas' && method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      const { stoneAreas, syncExistingTeams = true } = body;
      if (!stoneAreas || typeof stoneAreas !== 'object') {
        return jsonResponse({ success: false, error: 'stoneAreas object is required.' }, 400);
      }

      const { result } = await updateDb(env, async (db) => {
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

      return jsonResponse({ success: true, domains: result.domains, updatedTeamsCount: result.updatedTeamsCount });
    }

    // -------------------------------------------------------------
    // Admin Payment QR Codes Management (Protected)
    // -------------------------------------------------------------
    if (pathname === '/api/admin/payment-qrs' && method === 'GET') {
      const db = await loadDb(env);
      const paymentQrs = db.paymentQrs || {
        member3: '/3mem.png',
        member4: '/4mem.png',
      };
      return jsonResponse({ success: true, paymentQrs });
    }

    if (pathname === '/api/admin/payment-qrs' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { member3, member4 } = body;

      const processQrValue = async (val, prefix) => {
        if (!val || typeof val !== 'string') return null;
        const clean = val.trim();
        if (clean.startsWith('data:image/')) {
          if (env && env.BUCKET) {
            try {
              const match = clean.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
              if (match) {
                const mime = match[1];
                const base64Data = match[2];
                const binaryStr = atob(base64Data);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                  bytes[i] = binaryStr.charCodeAt(i);
                }
                const ext = mime.includes('jpeg') || mime.includes('jpg') ? '.jpg' : mime.includes('webp') ? '.webp' : '.png';
                const key = `qrs/${prefix}-${Date.now()}${ext}`;
                await env.BUCKET.put(key, bytes, {
                  httpMetadata: { contentType: mime }
                });
                return `${PUBLIC_DOMAIN.replace(/\/$/, '')}/${key}`;
              }
            } catch (err) {
              console.warn('Failed to upload QR to R2, falling back to data URL:', err);
            }
          }
        }
        return clean;
      };

      const newQr3 = member3 ? await processQrValue(member3, 'qr-3mem') : null;
      const newQr4 = member4 ? await processQrValue(member4, 'qr-4mem') : null;

      const { result } = await updateDb(env, async (db) => {
        if (!db.paymentQrs) {
          db.paymentQrs = {
            member3: '/3mem.png',
            member4: '/4mem.png',
          };
        }
        if (newQr3) db.paymentQrs.member3 = newQr3;
        if (newQr4) db.paymentQrs.member4 = newQr4;
        db.paymentQrs.updatedAt = new Date().toISOString();
        return { paymentQrs: db.paymentQrs };
      });

      return jsonResponse({
        success: true,
        message: 'Payment QR codes updated successfully.',
        paymentQrs: result.paymentQrs,
      });
    }

    if (pathname === '/api/admin/payment-qrs/reset' && method === 'POST') {
      const { result } = await updateDb(env, async (db) => {
        db.paymentQrs = {
          member3: '/3mem.png',
          member4: '/4mem.png',
          updatedAt: new Date().toISOString(),
        };
        return { paymentQrs: db.paymentQrs };
      });

      return jsonResponse({
        success: true,
        message: 'Payment QR codes restored to default.',
        paymentQrs: result.paymentQrs,
      });
    }

    // -------------------------------------------------------------
    // Admin Send Payment Verification Email to Single Squad
    // -------------------------------------------------------------
    if (pathname === '/api/admin/send-verification-mail' && method === 'POST') {
      const { teamId } = await request.json().catch(() => ({}));
      if (!teamId) {
        return jsonResponse({ success: false, error: 'teamId is required' }, 400);
      }

      let mailResult = null;
      const { result } = await updateDb(env, async (db) => {
        const idx = db.teams.findIndex((t) => t.id === teamId);
        if (idx === -1) {
          const err = new Error(`Squad ${teamId} not found.`);
          err.statusCode = 404;
          throw err;
        }

        const team = db.teams[idx];
        const appUrl = env.APP_URL || new URL(request.url).origin;

        mailResult = await sendPaymentVerifiedEmail({ team, appUrl, env, domains: db.domains });

        const now = new Date().toISOString();
        db.teams[idx] = {
          ...team,
          payment: {
            ...team.payment,
            status: 'verified',
            verifiedAt: team.payment?.verifiedAt || now,
            mailSent: true,
            mailSentAt: now,
          },
        };

        const copy = { ...db.teams[idx] };
        delete copy.teamPassword;
        copy.hasPassword = Boolean(db.teams[idx].teamPassword);
        return { team: copy };
      });

      return jsonResponse({
        success: true,
        message: mailResult?.simulated
          ? 'Verification email simulated (configure RESEND_API_KEY for live delivery).'
          : 'Payment verified email sent successfully!',
        simulated: Boolean(mailResult?.simulated),
        mailSentAt: result.team.payment?.mailSentAt,
        team: result.team,
      });
    }

    // -------------------------------------------------------------
    // Admin Send Payment Verification Emails to All Verified Squads
    // -------------------------------------------------------------
    if (pathname === '/api/admin/send-all-verification-mails' && method === 'POST') {
      const { force } = await request.json().catch(() => ({}));
      let sentCount = 0;
      let failCount = 0;
      let isSimulated = false;

      await updateDb(env, async (db) => {
        const appUrl = env.APP_URL || new URL(request.url).origin;
        const verifiedTeams = db.teams.filter((t) => {
          if (t.payment?.status !== 'verified') return false;
          if (!force && t.payment?.mailSent) return false;
          return true;
        });

        for (const t of verifiedTeams) {
          try {
            const mRes = await sendPaymentVerifiedEmail({ team: t, appUrl, env, domains: db.domains });
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

      return jsonResponse({
        success: true,
        message: `Processed ${sentCount} squad emails (${failCount} failed).`,
        sentCount,
        failCount,
        simulated: isSimulated,
      });
    }

    // -------------------------------------------------------------
    // Admin Ephemeral Export Ticket Generator (Single-use, 60s ttl)
    // -------------------------------------------------------------
    if (pathname === '/api/admin/export-ticket' && method === 'POST') {
      const ticket = createExportTicket('admin');
      return jsonResponse({
        success: true,
        ticket,
        expiresInSeconds: 60,
        message: 'Single-use export ticket created. Valid for 60 seconds.'
      });
    }

    // -------------------------------------------------------------
    // Admin Excel Export (.xlsx)
    // -------------------------------------------------------------
    if (pathname === '/api/admin/export' && method === 'GET') {
      const db = await loadDb(env);
      const teams = db.teams;

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

      const excelArray = XLSX.write(workbook, { type: 'array', bookType: 'xlsx', compression: true });
      return new Response(excelArray, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="infinity_hackathon_export_${Date.now()}.xlsx"`,
          ...getCorsHeaders(request, env),
        },
      });
    }

    // Unmatched API endpoint
    return jsonResponse({ success: false, error: 'Endpoint not found' }, 404);
  } catch (err) {
    console.error('Pages function error:', err);
    return jsonResponse({ success: false, error: err.message }, err.statusCode || 500);
  }
}
