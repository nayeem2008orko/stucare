# StuCare — Smart Study Planner

> An AI-powered web application that helps students plan, optimize, and stay motivated in their studies.

---

## Overview

StuCare is a full-stack study planning application that combines adaptive scheduling algorithms, AI-powered assistance, and progress analytics to help students study smarter. It features a dual-mode AI chatbot — one for academic help and one for emotional support and motivation.

---

## Features

- **Adaptive Study Scheduling** — Automatically generates daily study plans based on deadlines and difficulty
- **Topic Prioritization** — Python algorithm scores tasks by urgency and difficulty
- **Rescheduling Logic** — Missed tasks are redistributed across remaining days
- **AI Chatbot — Study Mode** — Explains concepts, guides problem solving, answers academic questions
- **AI Chatbot — Motivation Mode** — Encourages students, provides support, detects and safely handles distress
- **Progress Tracking** — Completion rates, hours studied, task status
- **Study Streak** — Tracks consecutive days of study activity
- **Onboarding Flow** — New users add subjects and get an instant personalized plan

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind CSS 3 |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Algorithm Service | Python 3 + Flask |
| AI | OpenRouter API  |
| Auth | JWT (access + refresh tokens) + bcrypt |

---

## Project Structure

```
stucare/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/               # Axios API clients
│   │   │   ├── client.js      # Base axios instance with interceptors
│   │   │   ├── auth.js
│   │   │   ├── planner.js
│   │   │   ├── chatbot.js
│   │   │   └── analytics.js
│   │   ├── components/
│   │   │   └── Layout.jsx     # Sidebar + nav shell
│   │   └── pages/
│   │       ├── auth/          # Login, Register
│   │       ├── onboarding/    # First-time subject setup
│   │       ├── dashboard/     # Daily plan + stats
│   │       ├── planner/       # Task management
│   │       ├── chatbot/       # AI chat interface
│   │       └── analytics/     # Progress & streaks
│
├── backend/                   # Node.js + Express API
│   ├── src/
│   │   ├── config/            # DB connection, env validation
│   │   ├── database/
│   │   │   └── migrations/    # 6 SQL migration files
│   │   ├── middleware/        # Auth, rate limit, validation, error
│   │   ├── routes/            # API route definitions
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic + AI integration
│   │   ├── models/            # PostgreSQL query functions
│   │   └── utils/             # Logger, sanitizer
│   ├── app.js
│   └── server.js
│
└── algorithm/                 # Python Flask microservice
    ├── src/
    │   ├── prioritizer.py     # Deadline + difficulty scoring
    │   ├── scheduler.py       # Daily time slot allocation
    │   └── rescheduler.py     # Missed task redistribution
    ├── tests/                 # 22 unit tests (all passing)
    └── app.py                 # Flask entry point
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python 3.10+
- PostgreSQL (local or hosted)
- An OpenRouter API key

---

### 1. Clone the Repository

```bash
git clone https://github.com/nayeem2008orko/stucare.git
cd stucare
```

---

### 2. Database Setup

Create a PostgreSQL database named `stucare`, then run migrations:

```bash
cd backend
npm install
# Create your .env file (see Environment Variables section)
node src/database/migrate.js
```

---

### 3. Backend Setup

```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

---

### 4. Algorithm Service Setup

```bash
cd algorithm
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
# Runs on http://localhost:8000
```

---

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Environment Variables

### `backend/.env`

```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/stucare
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_MODEL=your_model_identifier_here
ALGORITHM_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

### `algorithm/.env`

```
PORT=8000
```

> **Never commit `.env` files.** Use `.env.example` as a template.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Planner
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/planner/daily` | Get today's generated plan |
| GET | `/api/planner/tasks` | Get all tasks |
| POST | `/api/planner/tasks` | Create a task |
| PUT | `/api/planner/tasks/:id` | Update a task |
| DELETE | `/api/planner/tasks/:id` | Delete a task |
| POST | `/api/planner/reschedule` | Trigger rescheduling |

### Chatbot
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chatbot/message` | Send message, get AI reply |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/progress` | Completion stats |
| GET | `/api/analytics/streak` | Study streak data |

---

## Algorithm Service Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/prioritize` | Score and sort tasks |
| POST | `/schedule` | Generate time-slotted plan |
| POST | `/reschedule` | Process missed tasks |

---

## Security

- Passwords hashed with **bcrypt** (cost factor 12)
- **JWT** authentication with short-lived access tokens (15min) and refresh tokens (7 days)
- **Helmet.js** for secure HTTP headers
- **CORS** restricted to frontend origin
- **Rate limiting** on all API and chatbot endpoints
- **Input validation** and sanitization on all routes
- **Parameterized SQL queries** — no raw string interpolation
- **AI prompt injection protection** — user input sanitized before reaching the AI
- **Chatbot system prompts** injected server-side only, never exposed to client
- **Crisis detection** in motivation mode — safely redirects to professional help

---

## Running Tests

### Algorithm (Python)

```bash
cd algorithm
venv\Scripts\activate   # or source venv/bin/activate
python -m pytest tests/ -v
# 22 tests, all passing
```

---

## Database Schema

Six PostgreSQL tables:

| Table | Description |
|---|---|
| `users` | Student accounts |
| `tasks` | Study topics with deadline and difficulty |
| `task_sessions` | Actual study session records |
| `daily_plans` | AI-generated plans per user per day |
| `daily_plan_items` | Individual time slots within a plan |
| `chat_messages` | Chatbot conversation history |

---

## Deployment (Planned)

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon / Railway |
| Algorithm | Render (separate service) |

---

## License

MIT

---

## Author

**Nayeem** — [@nayeem2008orko](https://github.com/nayeem2008orko)
