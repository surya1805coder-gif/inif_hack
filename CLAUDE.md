# CLAUDE.md

> This project follows the universal agent specification documented in [**AGENTS.md**](./AGENTS.md).
> All AI coding assistants (Claude Code, OpenCode, Hermes, Antigravity, Cursor) should read and adhere to `AGENTS.md`.

---

## ⚡ Quick Reference

### Commands
- **Dev Server**: `npm run dev` (Vite, http://localhost:5173)
- **API Server**: `node server.js` (Express 5, http://localhost:3000)
- **Production Build**: `npm run build`
- **Deploy**: `npm run deploy` (Cloudflare Pages)
- **Automated Tests**: `node scratch/run_live_tests.js`

### Default Credentials (Local / Testing)
- **Admin**: `admin123` (`admin.html`)
- **Coordinator**: `coord2026` (`coordinator.html`)
- **Judge**: `judge2026` (`judges.html`)

### Core Architecture
- **Frontend**: Vite + Vanilla JS (ES Modules) + Three.js + GSAP + Web Audio API.
- **Backend**: Dual runtime — local Express 5 (`server.js`) & Cloudflare Pages Functions (`functions/api/[[route]].js`).
- **Data Persistence**: Atomic JSON storage in `data/*.json` with `.tmp` staging + rename locks.
- **Intro Preloader**: Synchronized video & audio in `public/loading.mp4` managed by `src/cinematicPreloader.js`.

For complete architectural details, API routes, security guidelines, and directory maps, see [**AGENTS.md**](./AGENTS.md).
