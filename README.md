# SIH Portal — Backend API

A small Express API that replaces the frontend's `localStorage` data
layer, so the portal's data (teams, submissions, results) lives on a
server and is the same for every visitor, on every device, instead of
being trapped in one browser.

Storage is a single JSON file (`data/db.json`) — no database server
to install. Good enough for a hackathon portal's traffic; swap
`db.js` for a real database later if you need to.

## 1. Run it locally

```bash
cd sih-backend
npm install
cp .env.example .env    # then edit .env — set a real JWT_SECRET
npm start
```

The API starts on `http://localhost:4000` (or whatever `PORT` you set).
On first run it seeds one admin account (`ADMIN_EMAIL` / `ADMIN_PASSWORD`
from `.env`, defaults to `admin@sih.gov.in` / `admin123`) and the same
8 sample problem statements the frontend used to seed itself.

Check it's alive:
```bash
curl http://localhost:4000/api/health
```

## 2. Make it reachable from anywhere

Running it on your laptop only serves your own machine. To make it
reachable from anywhere, deploy it to a host that keeps it running
24/7 and gives it a public URL. Any of these work well for a small
Node app like this one, all with free tiers:

- **Render** — render.com → New → Web Service → point at your repo →
  build command `npm install`, start command `npm start` → add the
  `.env` values under Environment.
- **Railway** — railway.app → New Project → Deploy from repo → add
  the same environment variables.
- **Fly.io** — `fly launch` in this folder, then `fly secrets set
  JWT_SECRET=... CORS_ORIGIN=...`.

Whichever you pick, set these environment variables on the host
(don't commit `.env` — it's git-ignored):

| Variable | Value |
|---|---|
| `JWT_SECRET` | a long random string (see `.env.example` for how to generate one) |
| `CORS_ORIGIN` | the URL your frontend is hosted at, e.g. `https://your-portal.vercel.app` (comma-separate more than one; `*` is fine while testing) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | only used the very first time the server starts, to create the admin account |

⚠️ **One caveat with the free tiers of Render/Railway/Fly**: their
filesystems are usually *ephemeral* — `data/db.json` can be wiped on
redeploy or restart. For a short hackathon event this is often fine.
For anything longer-lived, either pay for a persistent volume/disk
(all three offer this cheaply) or migrate `db.js` to a hosted
database (Render/Railway both offer a free Postgres instance you
could switch to).

## 3. Point the frontend at it

The existing `sih-portal.html` currently talks to `localStorage`
directly. To use this API instead, its `SIH` object's functions need
to become `fetch()` calls to the endpoints below, with the JWT
returned by login/signup stored (e.g. in `localStorage` as just a
token, not the whole dataset) and sent back as
`Authorization: Bearer <token>` on every request. Happy to do that
rewiring next if you want a working end-to-end version.

## API reference

All request/response bodies are JSON. Protected routes need an
`Authorization: Bearer <token>` header — you get the token back from
`/api/auth/login` or `/api/auth/signup`.

### Auth
| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/auth/signup` | — | `{name, email, password, college}` | Always creates a **student** account |
| POST | `/api/auth/login` | — | `{email, password, role?}` | `role` optional; if set, must match the account |
| GET | `/api/auth/me` | any logged-in user | — | Returns the current user |

### Problem statements
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/api/problems` | public | — |
| POST | `/api/problems` | admin | `{title, domain, difficulty, description}` |
| DELETE | `/api/problems/:id` | admin | — |

### Teams
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/api/teams` | admin | — (all teams, with problem + submission attached) |
| GET | `/api/teams/mine` | student | — (the caller's own team, or `null`) |
| POST | `/api/teams` | student | `{name, problemId, members: [{name, email}]}` |

### Submissions
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/api/submissions` | admin | — (all submissions, with team info) |
| GET | `/api/submissions/mine` | student | — |
| POST | `/api/submissions` | student | `{title, repoLink, description, videoLink?, liveLink?}` — creates or overwrites the caller's team's submission |
| PATCH | `/api/submissions/:id/rank` | admin | `{rank}` — one of `null`, `"shortlisted"`, `"runner-up"`, `"winner"` |

### Results
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/api/results` | public | Returns `{published: false}` until an admin publishes; then `{published: true, winner, runnerUp, shortlisted}` |
| GET | `/api/results/state` | admin | `{published}` |
| POST | `/api/results/publish` | admin | — |
| POST | `/api/results/unpublish` | admin | — |
