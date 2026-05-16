# CaneTrack — Deployment Guide

## Architecture

```
[ Browser ] ──► [ Netlify: React (static) ] ──► [ Render: Node.js/Express/Prisma ] ──► [ Supabase: PostgreSQL ]
```

| Layer     | Technology              | Hosting  |
|-----------|-------------------------|----------|
| Frontend  | React 19 + Vite + Tailwind | Netlify  |
| Backend   | Node.js + Express + Prisma | Render   |
| Database  | PostgreSQL              | Supabase |

---

## Required Accounts

- [Node.js](https://nodejs.org) (v18+)
- [Git](https://git-scm.com)
- [GitHub](https://github.com)
- [Supabase](https://supabase.com)
- [Netlify](https://netlify.com) (sign in with GitHub)
- [Render](https://render.com) (sign in with GitHub)

Verify locally:
```bash
node --version
npm --version
```

---

## STEP 1 — Supabase (Database)

1. Go to **https://supabase.com** → Sign in → **New project**
2. Fill in:
   - **Name:** `canetrack`
   - **Database Password:** Type & **save it**
   - **Region:** Singapore (or nearest to you)
   - **Pricing Plan:** Free
3. Click **Create new project** (wait 1–2 min)
4. Go to **Project Settings** → **Database** → scroll to **Connection string**
5. Under **Session pooler**, copy the URI:
   ```
   postgresql://postgres:YOUR_PASSWORD@db.xxxxx.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   ⚠️ Use the **Session pooler** (port **6543**), NOT the direct connection (port 5432). Render's network cannot reach Supabase's direct port.

---

## STEP 2 — GitHub (Push Code)

1. Go to **https://github.com** → **+** icon → **New repository**
2. **Name:** `canetrack`, **Visibility:** Public → **Create repository**
3. In your terminal:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/canetrack.git
git branch -M main
git push -u origin main
```

---

## STEP 3 — Render (Backend API)

1. Go to **https://dashboard.render.com** → Sign in with GitHub
2. **New +** → **Web Service** → **Connect** your `canetrack` repo

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Name           | `canetrack-api`                                        |
| Region         | Singapore                                              |
| Branch         | `main`                                                 |
| Runtime        | `Node`                                                 |
| Build Command  | `npm install && npx prisma generate && npx prisma db push && npx prisma db seed` |
| Start Command  | `npm start`                                            |
| Plan           | Free                                                   |

3. Click **Advanced** → **Add Environment Variable**:

| Key                    | Value                                                      |
|------------------------|------------------------------------------------------------|
| `DATABASE_URL`         | Supabase URI from STEP 1                                   |
| `JWT_SECRET`           | Random string ≥32 chars (use: `openssl rand -hex 32`)      |
| `FRONTEND_URL`         | `http://localhost:5173` *(update after Netlify deploys)*   |
| `PORT`                 | `5000`                                                     |
| `DISCREPANCY_THRESHOLD`| `50`                                                       |

4. Click **Create Web Service** (wait 3–5 min for build)
5. You'll get a URL like: `https://canetrack-api.onrender.com`
6. **Test:** Open `https://canetrack-api.onrender.com/api/health`
   - Expected: `{"status":"ok","timestamp":"..."}`

---

## STEP 4 — Netlify (Frontend)

1. Go to **https://app.netlify.com** → Sign in with GitHub
2. **Add new site** → **Import an existing project** → **Deploy with GitHub**
3. Select your `canetrack` repo

| Field           | Value                   |
|-----------------|-------------------------|
| Branch          | `main`                  |
| Build command   | `npm run build:frontend`|
| Publish directory| `dist`                 |

4. Click **Show advanced** → **New variable**:

| Key            | Value                                               |
|----------------|-----------------------------------------------------|
| `VITE_API_URL` | `https://canetrack-api.onrender.com` (from STEP 3)  |
| `GEMINI_API_KEY`| *(optional)* Your Gemini API key                   |

5. Click **Deploy site** (wait 1–2 min)
6. You'll get a URL like: `https://canetrack.netlify.app`

---

## STEP 5 — Update Render CORS

1. Go back to **Render Dashboard** → `canetrack-api` → **Environment**
2. Update `FRONTEND_URL` to your actual Netlify URL:
   ```
   https://canetrack.netlify.app
   ```
3. **Save Changes** → **Manual Deploy** → **Deploy latest commit**

---

## STEP 6 — Verify

1. Open `https://canetrack.netlify.app`
2. Click **Get Started** → go to `/login`
3. Register a new account (creates as Farmer role)
4. Login and confirm dashboard loads

---

## Troubleshooting

| Symptom              | Check                                     |
|----------------------|-------------------------------------------|
| CORS error (console) | `FRONTEND_URL` in Render env vars         |
| API 404              | `VITE_API_URL` in Netlify env vars        |
| Database error       | `DATABASE_URL` in Render env vars         |
| `P1001: Can't reach database server` | Use **Session pooler** URI (port 6543) instead of direct (port 5432) |
| Login fails          | Check Render logs for JWT_SECRET issues   |

- Open **Browser DevTools (F12)** → Console tab for CORS errors
- **Render Dashboard** → service → **Logs** tab for server errors

---

## Local Development

Run in **two separate terminals**:

```bash
# Terminal 1 — Backend (port 5000)
npm run dev

# Terminal 2 — Frontend (port 5173, proxies /api to 5000)
npm run dev:frontend
```

Open **http://localhost:5173**

---

## Database Commands

```bash
npm run db:generate    # Regenerate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Create a migration
npm run db:studio      # Open Prisma Studio GUI
```

---

## Updating After Deployment

```bash
git add .
git commit -m "Description of changes"
git push
```

Render and Netlify auto-deploy on every push to `main`.

---

## Environment Variables

### Backend (Render)

| Variable              | Description                          |
|-----------------------|--------------------------------------|
| `DATABASE_URL`        | Supabase PostgreSQL connection string|
| `PORT`                | Server port (Render sets automatically)|
| `JWT_SECRET`          | Secret key for JWT signing           |
| `FRONTEND_URL`        | Netlify URL for CORS                 |
| `DISCREPANCY_THRESHOLD`| Variance threshold in kg            |
| `GEMINI_API_KEY`      | *(Optional)* For Gemini AI features  |

### Frontend (Netlify)

| Variable       | Description                                   |
|----------------|-----------------------------------------------|
| `VITE_API_URL` | Render backend URL (e.g., `https://canetrack-api.onrender.com`) |
| `GEMINI_API_KEY`| *(Optional)* For Gemini AI features          |
