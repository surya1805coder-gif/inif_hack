# 🌌 INFINITY HACKATHON 2026 — AGENTS & AI OPERATING MANUAL

> **Target Audience**: AI Agents (Hermes, OpenCode, Claude Code, Antigravity, Cursor, Codex) & Human Developers.  
> **Purpose**: Single source of truth for repository architecture, data contracts, security guidelines, entry points, and operational workflows.

---

## 🧭 System Overview

**Infinity Hackathon 2026** (`infinity-stones-3d-showcase`) is an enterprise-grade hackathon management and exhibition platform combining:
1. **Interactive 3D Public Showcase**:
   - Marvel Infinity Stones-themed 3D cosmic exhibition built with Three.js (`MeshPhysicalMaterial`, bloom post-processing, procedural Web Audio synthesizer).
   - Cinematic intro preloader with synchronized video/audio (`loading.mp4`), fallback unmute listeners, and seamless transition to the 3D singularity convergence ("The Snap").
   - Public Hackathon Hub: Tracks/Domains, Rules, Interactive Schedule, Real-time FAQs, Multi-step Team Registration with file/receipt uploads, and QR Ticket generation.
2. **Four Dedicated Internal Operating Portals**:
   - **Admin Portal** (`admin.html` / `src/adminPortal.js`): Registration approvals, team-judge assignments, real-time analytics, Excel export (`.xlsx`), and credential resets.
   - **Coordinator Portal** (`coordinator.html` / `src/coordinatorPortal.js`): On-site team check-ins, table/desk allocation, live alerts, and status monitors.
   - **Judge Portal** (`judges.html` / `src/judgePortal.js`): Multi-criteria rubric scoring (Innovation, Technical Execution, Feasibility, Presentation), feedback notes, and automated live leaderboard calculation.
   - **QR Ticket Verifier** (`verify.html` / `src/ticketVerifier.js`): Instant pass scanning and verification for security/entrance desks.
3. **Dual Runtime Backend**:
   - **Node.js Express Server** (`server.js`): Port `3000`. Production/local API with rate limiting, input sanitization, file uploads, Excel generation, and atomic persistence.
   - **Cloudflare Pages Serverless** (`functions/api/[[route]].js`): Edge deployment on Cloudflare Pages Functions / D1 / KV.

---

## 🧱 Repository Architecture & Directory Map

```
frontend_ui/
├── AGENTS.md                  # <-- THIS FILE: Universal AI operating manual
├── CLAUDE.md                  # Mirror/Reference for Claude Code
├── README.md                  # Public repository presentation
├── HOW_IT_WORKS.md            # Deep dive into Three.js 3D physics & sound engine
├── index.html                 # Public Landing Page & 3D Showcase
├── admin.html                 # Administrator Management Portal
├── coordinator.html           # Event Coordinator Check-in Portal
├── judges.html                # Judging & Rubric Evaluation Portal
├── verify.html                # QR Code Ticket Verification Terminal
├── server.js                  # Express 5 backend server (Port 3000)
├── package.json               # Dependencies, scripts, and build configuration
├── vite.config.js             # Vite bundler configuration
│
├── src/                       # Frontend source code (ES Modules)
│   ├── main.js                # App bootstrap, navigation, modal orchestration
│   ├── cinematicPreloader.js  # Intro video/audio preloader & autoplay handling
│   ├── threeScene.js          # Three.js scene setup, camera orbits, post-processing
│   ├── stoneGeometry.js       # Procedural crystal geometries & PBR shaders
│   ├── audioEngine.js         # Web Audio API procedural synthesis & soundscapes
│   ├── registration.js        # Registration form validation & API submission
│   ├── adminPortal.js         # Admin dashboard logic, CRUD, approvals, export
│   ├── coordinatorPortal.js   # Coordinator desk allocation & check-in logic
│   ├── judgePortal.js         # Rubric evaluation matrix & scoring API calls
│   ├── ticketVerifier.js      # Barcode/QR ticket scanner & cryptographic verification
│   ├── schedule.js            # Dynamic hackathon schedule component
│   └── faqs.js                # Interactive expandable FAQ accordion
│
├── functions/api/             # Cloudflare Pages Serverless functions
│   └── [[route]].js           # Universal Edge API router matching server.js
│
├── public/                    # Static assets served at root
│   ├── loading.mp4            # Cinematic intro video with synchronized fanfare
│   ├── favicon.svg            # Infinity icon favicon
│   └── assets/                # Logos, badges, and static graphics
│
├── data/                      # Persistent database storage (Server runtime)
│   ├── teams.json             # Team registrations & check-in state
│   ├── evaluations.json       # Judge scores and rubrics
│   ├── audit.json             # Audit trail of administrative actions
│   └── data_store.json        # Unified atomic fallback store
│
├── uploads/                   # User-uploaded payment proofs and team assets
└── scratch/                   # Test scripts, diagnostics, and build utilities
    ├── run_live_tests.js      # Full E2E automated test suite
    └── generate_catalog.js    # Data indexing & catalog generation tool
```

---

## ⚡ Development & Execution Quickstart

### 1. Environment Setup
```bash
# Install dependencies
npm install

# Configure environment variables (optional; safe defaults exist for local dev)
cp .env.example .env
```

### 2. Running Locally
Run the backend and frontend simultaneously:
```bash
# Terminal 1: Start Express API backend (Port 3000)
node server.js

# Terminal 2: Start Vite Dev Server (Port 5173)
npm run dev
```
- **Public Showcase**: `http://localhost:5173`
- **Admin Portal**: `http://localhost:5173/admin.html`
- **Coordinator Portal**: `http://localhost:5173/coordinator.html`
- **Judge Portal**: `http://localhost:5173/judges.html`
- **Verifier Portal**: `http://localhost:5173/verify.html`
- **API Health Check**: `http://localhost:3000/api/health`

### 3. Production Build
```bash
# Compile client bundle into ./dist
npm run build

# Preview production build
npm run preview
```

---

## 🔐 Credentials & Authentication

For testing, evaluation, and local development, default role passwords are:

| Role | Portal File | Default Password | Environment Variable | Role Scope |
|---|---|---|---|---|
| **Admin** | `admin.html` | `admin123` | `ADMIN_PASSWORD_HASH` | Full control, approvals, team deletion, exports |
| **Coordinator** | `coordinator.html` | `coord2026` | `COORDINATOR_PASSWORD_HASH` | Desk assignment, team check-in, announcements |
| **Judge** | `judges.html` | `judge2026` | `JUDGE_PASSWORD_HASH` | Rubric scoring, criteria evaluation, notes |

### Auth Mechanics
- Passwords are verified using **`crypto.scryptSync`** with per-install cryptographic salts (or constant fallback salt).
- Sessions are maintained via cryptographically random Bearer tokens stored in `localStorage` and sent via `Authorization: Bearer <token>`.
- Token signatures are verified on every protected API call.

---

## 📡 API Contract Reference

The Express backend (`server.js`) and Cloudflare function (`functions/api/[[route]].js`) share identical API contracts:

### Public Endpoints
- `GET /api/health` — System status, uptime, and database integrity.
- `POST /api/register` — Multipart form submission (Team Name, Leader, Contact, Members, Track, Payment Proof file).
- `GET /api/verify-ticket?code=<code>` — Validate a team's registration QR code / Ticket ID.

### Authentication Endpoints
- `POST /api/auth/login`
  - Body: `{ role: 'admin' | 'coordinator' | 'judge', password: '...' }`
  - Returns: `{ success: true, token: '...', user: { role } }`
- `POST /api/auth/logout`

### Protected Admin Endpoints (`Authorization: Bearer <admin_token>`)
- `GET /api/admin/teams` — List all registered teams with payment status, track, and members.
- `PUT /api/admin/teams/:id/status` — Approve (`confirmed`) or Reject (`rejected`) registration.
- `POST /api/admin/export` — Generate and stream `.xlsx` spreadsheet of all teams and judging scores.
- `GET /api/admin/audit-logs` — Administrative security trail.

### Protected Coordinator Endpoints (`Authorization: Bearer <coord_token>`)
- `GET /api/coordinator/teams` — Check-in roster and desk status.
- `POST /api/coordinator/checkin` — Check in team at entrance.
- `PUT /api/coordinator/assign-desk` — Allocate physical table (`e.g. Table A-12`).

### Protected Judge Endpoints (`Authorization: Bearer <judge_token>`)
- `GET /api/judge/teams` — Assigned teams pending evaluation.
- `POST /api/judge/score` — Submit rubric evaluation:
  - Body: `{ teamId, criteria: { innovation: 1-10, technical: 1-10, feasibility: 1-10, presentation: 1-10 }, feedback: '...' }`
- `GET /api/judge/leaderboard` — Aggregate ranking and normalized score distribution.

### Team Leader Portal Endpoints (`leader.html`)
- `POST /api/teams/login` — Authenticate team leader with email and password.
- `GET /api/teams/me` — Restore leader session profile (`Authorization: Bearer <team_token>`).
- `POST /api/teams/update-selection` — Lock in problem statement or preferred domain.
- `POST /api/teams/forgot-password/verify` — Dual-factor self-service verification (Email + Phone + Payment UTR); returns 10-minute HMAC `resetToken`.
- `POST /api/teams/forgot-password/reset` — Reset team password using signed `resetToken` and PBKDF2 hash.

---

## 🛡️ Security & Defensive Coding Rules

When modifying or generating code in this repository, **all agents must observe**:

1. **Atomic File Persistence**:
   - Never write directly to `data/*.json` with `fs.writeFileSync`.
   - Always write to a `.tmp` file first and perform an atomic `fs.renameSync` to prevent data corruption during server crashes or concurrent writes.
2. **CORS Whitelist Protection**:
   - Allowed origins are defined in `ALLOWED_ORIGINS` (`https://infinity.akao.in`, `localhost:5173`, `localhost:3000`, etc.).
   - Never use `cors({ origin: '*' })` on routes handling file uploads or credentials.
3. **Strict Rate Limiting**:
   - Auth endpoints (`/api/auth/login`) are protected by `authRateLimiter` (brute force mitigation).
   - Registration submissions are throttled per IP to prevent spam.
4. **Input Sanitization**:
   - All string inputs (team names, member emails, phone numbers) must pass through regex validation and HTML entity escaping before being stored or reflected in portal dashboards.
5. **Autoplay Compliance**:
   - Modern browsers block unmuted autoplay without prior user interaction.
   - `src/cinematicPreloader.js` plays unmuted by default; if rejected by browser policy, it gracefully falls back to muted playback and attaches one-time listeners (`click`, `touchstart`, `keydown`) to unmute as soon as the user touches the page.

---

## 🎬 Cinematic Preloader & 3D Synchronization

The preloader workflow is critical to the site's first impression:
1. `public/loading.mp4` contains the intro visual and synchronized audio fanfare (~15.8 seconds).
2. The preloader element `#cinematic-preloader` renders full-screen over the 3D canvas.
3. Upon video completion (`ended` event), `cinematicPreloader.js` dismisses the overlay with a smooth opacity fade (`GSAP` or CSS transition).
4. As the overlay clears, `main.js` automatically triggers the **Hexagonal Convergence** ("The Snap") in `threeScene.js`, drawing all 6 Infinity Stones into the center before settling into the interactive exhibition orbit.
5. A safety watchdog timeout ensures that if the video cannot load or is blocked, the site gracefully unlocks and transitions to the 3D scene without trapping the user.

---

## 🧪 Testing & Verification Protocol

Before declaring any change complete, agents should run the following checks:

```bash
# 1. Run live automated backend test suite
node scratch/run_live_tests.js

# 2. Verify Vite production build executes without syntax/bundling errors
npm run build

# 3. Check for any missing imports or unresolved assets
node -e "console.log('Build syntax valid')"
```

---

## 💡 Quick Tips for LLM Agents

- **Modifying Portals**: Each portal (`admin`, `coordinator`, `judges`, `verify`) is a standalone HTML page paired with its own JS controller in `src/`. Modifying one does not break the others.
- **Styling Architecture**: Modern dark-mode glassmorphic CSS with CSS variables (`--color-space`, `--color-mind`, `--bg-obsidian`, etc.). Avoid external UI frameworks unless explicitly requested.
- **Three.js Context**: The 3D scene in `src/threeScene.js` uses standard WebGL. Geometry buffers are custom-instanced in `src/stoneGeometry.js`. Keep frame rates at 60 FPS by reusing geometries and materials.
- **Dual Backend Awareness**: If you add or modify an API endpoint in `server.js`, always mirror the route logic in `functions/api/[[route]].js` so Cloudflare Pages deployment remains in sync.
