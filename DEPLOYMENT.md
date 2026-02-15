# JobAI Deployment Guide

## 1. Backend Deployment (Render)

### Prerequisites
- A [Render](https://render.com) account.
- A [Railway](https://railway.app) account (for PostgreSQL).

### Backend Configuration (`render.yaml` or Manual Setup)

**Build Command:**
```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
```

**Start Command:**
```bash
gunicorn career_copilot.wsgi:application
```

**Environment Variables (Set these in Render):**
| Variable | Value / Description |
| :--- | :--- |
| `PYTHON_VERSION` | `3.11.0` (or match your local version) |
| `DJANGO_SECRET_KEY` | Generate a random 50-char string |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `.onrender.com` (or your custom domain) |
| `DATABASE_URL` | Connect string from Railway (e.g. `postgresql://user:pass@host:port/dbname`) |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend-vercel-app.vercel.app` (comma separated if multiple) |
| `CSRF_TRUSTED_ORIGINS` | `https://your-frontend-vercel-app.vercel.app` |
| `OPENAI_API_KEY` | Your OpenAI API Key |
| `OPENAI_MODEL` | `gpt-4o-mini` |

### Database Setup (Railway)
1. Create a new PostgreSQL project in Railway.
2. Go to "Connect" tab.
3. Copy the "Postgres Connection URL".
4. Paste this into Render's `DATABASE_URL` environment variable.

---

## 2. Frontend Deployment (Vercel)

### Setup
1. Import your GitHub repository to Vercel.
2. Vercel automatically detects Next.js.

**Environment Variables (Set these in Vercel):**
| Variable | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-backend-app.onrender.com/api` (Backend URL + `/api`) |

**Build Settings:**
- Framework Preset: Next.js
- Build Command: `next build` (default)
- Install Command: `npm install` (default)

---

## 3. Post-Deployment Checklist

- [ ] **Database Migration**: Ensure the build command `python manage.py migrate` ran successfully on Render.
- [ ] **Static Files**: Verify CSS/JS loads correctly on the backend admin panel (WhiteNoise handles this).
- [ ] **CORS**: Try logging in from the Frontend. If you get a CORS error, check `CORS_ALLOWED_ORIGINS` in Render.
- [ ] **HTTPS**: Ensure both Frontend and Backend are accessed via HTTPS.
- [ ] **Environment**: Verify `DEBUG=False` in Render logs.

## 4. Troubleshooting

**Issue: CORS Error (Access-Control-Allow-Origin)**
- Fix: Add your Vercel domain (no trailing slash) to `CORS_ALLOWED_ORIGINS` in Render.
- Example: `https://jobai-frontend.vercel.app`

**Issue: 500 Server Error**
- Fix: Check Render logs. likely a missing environment variable (e.g. `OPENAI_API_KEY`) or database connection failure.

**Issue: Static files 404**
- Fix: Ensure `whitenoise` is installed and `python manage.py collectstatic` ran during build.
