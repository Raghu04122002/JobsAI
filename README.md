# JobAI — AI-Powered Career Assistant

> Upload your resume, paste job descriptions, and let AI analyze matches, tailor resume bullets, and generate cover letters — all in one place.

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![Django](https://img.shields.io/badge/Django-5.x-green?logo=django)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Dashboard** | Upload & manage resumes, view application stats, quick overview of saved jobs |
| **Analyzer** | Add job descriptions, select a resume + job, and run AI-powered match scoring with keyword analysis & improvement suggestions |
| **Tailor** | Select a job and auto-generate tailored resume bullets + a cover letter using AI |
| **Applications** | Full CRUD tracker — add, edit, and delete job applications with status tracking (Applied, Interview, Rejected, Offer) |
| **Auth** | Email-based signup/login with JWT (access + refresh tokens), auto-refresh on 401 |

---

## 🏗️ Tech Stack

### Backend
- **Django 5 + DRF** — REST API with token authentication
- **PostgreSQL 16** — Relational database
- **ChromaDB** — Vector store for resume/job embeddings
- **OpenAI GPT-4o-mini** — LLM for analysis, tailoring, and matching
- **Gunicorn** — Production WSGI server

### Frontend
- **Next.js 14** (App Router) — React framework with SSR
- **TypeScript** — Type-safe frontend code
- **Tailwind CSS** — Utility-first styling

### Infrastructure
- **Docker Compose** — Full-stack orchestration (4 services)
- **Nginx** — Reverse proxy, static/media serving

---

## 📁 Project Structure

```
jobai/
├── backend/
│   ├── accounts/          # Custom user model, signup endpoint
│   ├── resumes/           # Upload, text extraction, vector indexing
│   ├── jobs/              # Job descriptions, vector indexing
│   ├── applications/      # Application tracker CRUD
│   ├── ai_engine/         # CRAG service, prompts, AI views
│   │   └── services/      # crag.py, vector_store.py, openai_client.py

│   ├── core/              # Permissions, exception handling
│   ├── career_copilot/    # Django settings, URLs, Gunicorn config
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js pages (login, signup, dashboard, etc.)
│   │   ├── components/    # Shared components (NavBar)
│   │   └── lib/           # API client, auth helpers, config
│   ├── middleware.ts       # Route protection
│   └── Dockerfile
├── deploy/nginx/           # Nginx reverse proxy config
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- An [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/jobai.git
cd jobai
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
# Required — set your OpenAI key
OPENAI_API_KEY=sk-your-key-here

# Required — change for production
DJANGO_SECRET_KEY=your-secure-random-key

# Optional — defaults work for local development
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=

# Production only — Supabase session pooler (port 5432); leave unset locally
# DATABASE_URL=postgresql://postgres.<project-ref>:<YOUR-PASSWORD>@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

> **Production database:** the deployed backend uses Supabase Postgres via `DATABASE_URL`
> (session pooler, port 5432, `?sslmode=require`). See [DEPLOYMENT.md](DEPLOYMENT.md).

### 3. Build and run

```bash
docker compose up --build -d
```

### 4. Open the app

Open `http://localhost` in your browser and sign up at `/signup` to get started.

---

### 5. Create an account

Sign up at `http://localhost/signup`.

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup/` | Create a new account |
| `POST` | `/api/token/` | Get JWT token pair |
| `POST` | `/api/token/refresh/` | Refresh access token |

### Resumes
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/resumes/` | List user's resumes |
| `POST` | `/api/resumes/` | Upload a resume (multipart) |
| `PATCH` | `/api/resumes/{id}/` | Update resume title |
| `DELETE` | `/api/resumes/{id}/` | Delete a resume |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs/` | List user's saved jobs |
| `POST` | `/api/jobs/` | Save a job description |
| `PATCH` | `/api/jobs/{id}/` | Update a job |
| `DELETE` | `/api/jobs/{id}/` | Delete a job |

### Applications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/applications/` | List applications |
| `POST` | `/api/applications/` | Add an application |
| `PUT` | `/api/applications/{id}/` | Update an application |
| `DELETE` | `/api/applications/{id}/` | Delete an application |

### AI (Tailor & Analyzer)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/copilot/tailor/` | Generate tailored resume bullets + cover letter |
| `POST` | `/api/copilot/match/` | Match a resume against a job with scoring |

---

## 🤖 AI Architecture (CRAG)

The AI engine uses **Corrective Retrieval-Augmented Generation** (CRAG):

```
User Query → Retrieve Context (ChromaDB) → Score Relevance (LLM)
                                                    │
                                     ┌──────────────┴──────────────┐
                                     │ Score ≥ threshold?          │
                                     │   Yes → Generate Answer     │
                                     │   No  → Retry (wider k)     │
                                     │         → up to 2 retries   │
                                     └─────────────────────────────┘
```

- **Retrieval** — ChromaDB vectors scoped per user
- **Scoring** — LLM rates context relevance (1–10)
- **Retry** — Up to 2 retries with larger retrieval window
- **Fallback** — Uses best available context; returns guidance if none exists

---

## 🗄️ Database Indexes

| Table | Index Fields |
|---|---|
| `resumes` | `(user, created_at)` |
| `jobs` | `(user, created_at)`, `(company)` |
| `applications` | `(user, status)`, `(user, applied_date)`, `(company)` |


All querysets are filtered by `request.user` with object-level ownership permissions.

---

## 📈 Scaling Considerations

- **Horizontal scale** — Multiple Gunicorn workers + container replicas
- **Static/Media** — Move to S3 + CDN for high traffic
- **Caching** — Add Redis for sessions, rate limiting, token throttling
- **Async** — Celery + message queue for extraction/embedding pipelines
- **Vector DB** — Migrate to managed/HA vector store as usage grows
- **Observability** — Structured logging, tracing, error rates, token/cost metrics


## 🛠️ Development

### Run migrations manually

```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

### View logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Rebuild after code changes

```bash
docker compose up --build -d
```
🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

📄 License
MIT License - feel free to use this project for your own purposes.



Made by Raghu

