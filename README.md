<div align="center">

# 🧠 BrainBolt

### Adaptive Infinite Quiz Platform

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

An intelligent quiz platform that adapts to your skill level in real-time, featuring momentum-based difficulty adjustment, streak multipliers, and live competitive leaderboards.

[Features](#-features) • [Quick Start](#-quick-start) • [Demo](#-demo) • [Architecture](#-architecture) • [API](#-api-reference) • [Documentation](#-documentation)

</div>

---

## 📹 Demo

[![Watch Demo](https://img.shields.io/badge/▶_Watch_Demo-Video-red?style=for-the-badge&logo=youtube)](https://github.com/VipinYadav16/BrainBolt/raw/main/demo.mp4)

The demo showcases:

- Adaptive difficulty adjustment in action
- Streak system with score multipliers
- Real-time leaderboard updates
- Dark/Light mode toggle
- Metrics dashboard walkthrough
- Code architecture overview

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Adaptive Difficulty

- Questions scale from difficulty 1-10
- **Momentum-based hysteresis** prevents ping-pong oscillation
- Smooth difficulty transitions based on performance patterns

### 🔥 Streak System

- Consecutive correct answers build streaks
- Score multiplier up to **5x** at max streak
- **Streak decay** after 30 minutes of inactivity

### 📊 Real-Time Leaderboards

- Live rankings for total score and max streak
- Instant updates via Supabase Realtime
- See your rank update immediately after each answer

</td>
<td width="50%">

### 🛡️ Robust Edge Case Handling

- Idempotent answer submissions (no duplicate scoring)
- Rate limiting to prevent abuse
- Boundary conditions handled gracefully

### 🎨 Modern UI/UX

- **Dark/Light mode** with system preference detection
- Responsive design for all screen sizes
- Accessible shadcn/ui components
- Design system tokens (no hardcoded CSS)

### 📈 Performance Metrics

- Difficulty histogram visualization
- Recent performance tracking
- Accuracy statistics
- Personal best tracking

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Single Command Deployment (Docker)

```bash
# Clone the repository
git clone https://github.com/VipinYadav16/BrainBolt.git
cd BrainBolt

# Start everything with one command
docker-compose up --build
```

**That's it!** Open http://localhost:8080

> ✅ **No configuration needed!** The `.env` file with Supabase credentials is included in the repository for easy evaluation.

---

### Development Setup

#### Prerequisites

- Node.js 20+ or Bun

#### 1. Install Dependencies

```bash
# Frontend
bun install   # or npm install

# Backend (optional)
cd server && npm install && cd ..
```

#### 2. Run Development Servers

```bash
# Frontend (port 8080)
npm run dev

# Backend API (port 3001) - optional, frontend works directly with Supabase
cd server && npm run dev
```

> ✅ **Environment is pre-configured!** The `.env` file is included with working Supabase credentials.

<details>
<summary><b>🔐 Using your own Supabase project (optional)</b></summary>

If you want to use your own Supabase instance:

1. Create a project at https://supabase.com
2. Update `.env` with your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```
3. Run migrations in Supabase SQL Editor (files in `supabase/migrations/`)

</details>

---

## 🏗️ Architecture

### Tech Stack

| Layer         | Technology                 | Purpose                              |
| ------------- | -------------------------- | ------------------------------------ |
| **Frontend**  | React 18, TypeScript, Vite | Modern SPA with HMR                  |
| **Styling**   | Tailwind CSS, shadcn/ui    | Design tokens, accessible components |
| **State**     | React Query, Zustand       | Server & client state management     |
| **Backend**   | Express.js, Zod            | REST API with validation             |
| **Database**  | Supabase (PostgreSQL)      | With Row Level Security              |
| **Realtime**  | Supabase Realtime          | Live subscriptions                   |
| **Caching**   | Redis                      | Optional performance layer           |
| **Container** | Docker, Nginx              | Production deployment                |

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React SPA)                       │
├─────────────┬─────────────┬─────────────┬───────────────────────┤
│  QuizCard   │  StatsBar   │ Leaderboard │    MetricsPage        │
│  Component  │  Component  │  Component  │    Component          │
└──────┬──────┴──────┬──────┴──────┬──────┴───────────┬───────────┘
       │             │             │                   │
       └─────────────┴──────┬──────┴───────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │    Custom React Hooks     │
              │  useQuiz | useLeaderboard │
              │  useAuth | useMetrics     │
              └─────────────┬─────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐    ┌─────────────────┐    ┌───────────┐
│   Express   │    │    Supabase     │    │   Redis   │
│   Backend   │◄───│   (PostgreSQL)  │───►│   Cache   │
│   (REST)    │    │   + Realtime    │    │ (Optional)│
└─────────────┘    └─────────────────┘    └───────────┘
```

---

## 📡 API Reference

### Endpoints

| Method | Endpoint                 | Description                  |
| ------ | ------------------------ | ---------------------------- |
| `GET`  | `/v1/quiz/next`          | Fetch next adaptive question |
| `POST` | `/v1/quiz/answer`        | Submit answer (idempotent)   |
| `GET`  | `/v1/quiz/metrics`       | User performance metrics     |
| `GET`  | `/v1/leaderboard/score`  | Top N users by score         |
| `GET`  | `/v1/leaderboard/streak` | Top N users by streak        |

### Example: Submit Answer

```bash
POST /v1/quiz/answer
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": "uuid",
  "sessionId": "uuid",
  "questionId": "uuid",
  "answer": 2,
  "stateVersion": 5,
  "answerIdempotencyKey": "unique-key-123"
}
```

**Response:**

```json
{
  "correct": true,
  "newDifficulty": 6,
  "newStreak": 4,
  "scoreDelta": 150,
  "totalScore": 1250,
  "leaderboardRankScore": 3,
  "leaderboardRankStreak": 7
}
```

> 📖 Full API documentation: [docs/LLD.md](docs/LLD.md#api-design)

---

## 🧮 Adaptive Algorithm

### Momentum-Based Hysteresis

The algorithm prevents "ping-pong" instability (rapid difficulty oscillation) using momentum:

```
┌─────────────────────────────────────────────────────────────┐
│                    MOMENTUM SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│  Correct Answer  →  momentum += 0.6                         │
│  Wrong Answer    →  momentum -= 0.8                         │
│  After Each      →  momentum *= 0.7 (decay)                 │
├─────────────────────────────────────────────────────────────┤
│  momentum ≥ +1.5  →  Difficulty increases                   │
│  momentum ≤ -1.5  →  Difficulty decreases                   │
│  -1.5 < momentum < +1.5  →  Difficulty stays same           │
└─────────────────────────────────────────────────────────────┘
```

**Why this works:** A single correct/wrong answer won't trigger a difficulty change. You need sustained performance in one direction to shift difficulty.

### Pseudocode

```javascript
function updateDifficulty(correct, currentDifficulty, momentum) {
  // Apply momentum change
  momentum += correct ? 0.6 : -0.8;

  // Decay momentum
  momentum *= 0.7;

  // Check thresholds
  if (momentum >= 1.5 && currentDifficulty < 10) {
    currentDifficulty++;
    momentum = 0; // Reset after change
  } else if (momentum <= -1.5 && currentDifficulty > 1) {
    currentDifficulty--;
    momentum = 0;
  }

  return { currentDifficulty, momentum };
}
```

---

## 💯 Scoring System

### Formula

```
Score = (Difficulty × 10) × Streak Multiplier

Streak Multiplier = min(1 + streak × 0.5, 5.0)
```

### Multiplier Table

| Streak | Multiplier | Points at Diff 5 | Points at Diff 10 |
| :----: | :--------: | :--------------: | :---------------: |
|   0    |    1.0×    |        50        |        100        |
|   2    |    2.0×    |       100        |        200        |
|   4    |    3.0×    |       150        |        300        |
|   6    |    4.0×    |       200        |        400        |
|   8+   | 5.0× (max) |       250        |        500        |

### Streak Decay

After **30 minutes** of inactivity, streaks decay:

```
decayedStreak = floor(streak × 0.5^(inactivePeriods))
```

Example: Streak of 10 after 1 hour inactive → `10 × 0.5² = 2`

---

## 📁 Project Structure

```
brainbolt/
├── 📂 src/                          # Frontend source code
│   ├── 📂 components/               # React components
│   │   ├── 📂 ui/                   # shadcn/ui primitives (40+ components)
│   │   ├── 📄 QuizCard.tsx          # Main quiz interface
│   │   ├── 📄 StatsBar.tsx          # Score, streak, rank display
│   │   ├── 📄 Leaderboard.tsx       # Live rankings component
│   │   ├── 📄 ThemeProvider.tsx     # Dark/light mode context
│   │   └── 📄 ThemeToggle.tsx       # Theme switch button
│   ├── 📂 hooks/                    # Custom React hooks
│   │   ├── 📄 useQuiz.ts            # Quiz state & adaptive logic
│   │   ├── 📄 useAuth.ts            # Authentication
│   │   ├── 📄 useLeaderboard.ts     # Real-time rankings
│   │   └── 📄 useMetrics.ts         # Performance analytics
│   ├── 📂 lib/                      # Utilities
│   │   ├── 📄 adaptive.ts           # Difficulty algorithm
│   │   ├── 📄 types.ts              # TypeScript interfaces
│   │   └── 📄 utils.ts              # Helper functions
│   └── 📂 pages/                    # Route pages
│       ├── 📄 Index.tsx             # Main quiz page
│       ├── 📄 MetricsPage.tsx       # Analytics dashboard
│       └── 📄 LeaderboardPage.tsx   # Full leaderboard view
├── 📂 server/                       # Backend API
│   └── 📂 src/
│       ├── 📄 index.ts              # Express entry point
│       ├── 📂 routes/               # API route handlers
│       ├── 📂 services/             # Business logic
│       └── 📂 lib/                  # Supabase & Redis clients
├── 📂 supabase/                     # Database layer
│   ├── 📄 config.toml               # Supabase configuration
│   └── 📂 migrations/               # SQL schema migrations
├── 📂 docs/                         # Documentation
│   ├── 📄 LLD.md                    # Low-Level Design document
│   └── 📄 EDGE_CASES.md             # Edge case documentation
├── 📄 docker-compose.yml            # Container orchestration
├── 📄 Dockerfile                    # Frontend container
├── 📄 nginx.conf                    # Production web server config
└── 📄 demo.mp4                      # Demo video (required)
```

---

## 📚 Documentation

| Document                            | Description                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| [LLD.md](docs/LLD.md)               | Complete Low-Level Design: architecture, API schemas, DB schema, caching strategy, pseudocode |
| [EDGE_CASES.md](docs/EDGE_CASES.md) | All edge cases with handling strategies                                                       |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test -- --coverage
```

---

## ⚡ Scripts Reference

| Command                     | Description                       |
| --------------------------- | --------------------------------- |
| `npm run dev`               | Start Vite dev server (port 8080) |
| `npm run build`             | Production build                  |
| `npm run preview`           | Preview production build          |
| `npm run lint`              | ESLint check                      |
| `npm test`                  | Run Vitest tests                  |
| `docker-compose up --build` | **Single command deployment**     |

---

## 🔧 Environment Variables

> ✅ **Pre-configured!** The `.env` file is included in this repository with working Supabase credentials for easy evaluation. No setup required.

<details>
<summary><b>Frontend (.env) - Already configured</b></summary>

| Variable                        | Required | Description              | Status |
| ------------------------------- | :------: | ------------------------ | :----: |
| `VITE_SUPABASE_URL`             |    ✅    | Supabase project URL     | ✅ Set |
| `VITE_SUPABASE_PUBLISHABLE_KEY` |    ✅    | Supabase anon/public key | ✅ Set |

</details>

<details>
<summary><b>Backend (server/.env) - Already configured</b></summary>

| Variable               | Required | Description                                  |   Status    |
| ---------------------- | :------: | -------------------------------------------- | :---------: |
| `SUPABASE_URL`         |    ✅    | Supabase project URL                         |   ✅ Set    |
| `SUPABASE_SERVICE_KEY` |    ✅    | Supabase service role key                    |   ✅ Set    |
| `PORT`                 |    ❌    | Server port (default: 3001)                  |   ✅ Set    |
| `FRONTEND_URL`         |    ❌    | CORS origin (default: http://localhost:8080) |   ✅ Set    |
| `REDIS_URL`            |    ❌    | Redis connection URL                         | ❌ Optional |

</details>

---

## ✅ Requirements Checklist

### Core Features

| Requirement                | Status | Implementation                  |
| -------------------------- | :----: | ------------------------------- |
| Adaptive difficulty (1-10) |   ✅   | Momentum-based algorithm        |
| Ping-pong prevention       |   ✅   | Hysteresis thresholds (±1.5)    |
| Streak system              |   ✅   | Increment/reset + decay         |
| Score multiplier (capped)  |   ✅   | Up to 5× multiplier             |
| Live leaderboards          |   ✅   | Supabase Realtime subscriptions |
| Real-time updates          |   ✅   | Instant rank/score refresh      |

### Technical Requirements

| Requirement          | Status | Implementation                     |
| -------------------- | :----: | ---------------------------------- |
| Modern SPA framework |   ✅   | React 18 + Vite                    |
| Reusable components  |   ✅   | shadcn/ui library (40+ components) |
| Design tokens        |   ✅   | Tailwind CSS variables             |
| Dark/Light mode      |   ✅   | ThemeProvider context              |
| TypeScript           |   ✅   | Strict mode enabled                |
| ESLint/Prettier      |   ✅   | Configured                         |
| Responsive design    |   ✅   | Mobile-first Tailwind              |

### Operational Requirements

| Requirement            | Status | Implementation                           |
| ---------------------- | :----: | ---------------------------------------- |
| Idempotent submissions |   ✅   | answerIdempotencyKey                     |
| Rate limiting          |   ✅   | express-rate-limit                       |
| Streak decay           |   ✅   | 30-min inactivity threshold              |
| Docker deployment      |   ✅   | docker-compose.yml                       |
| Single command run     |   ✅   | `docker-compose up --build`              |
| LLD documentation      |   ✅   | [docs/LLD.md](docs/LLD.md)               |
| Edge cases documented  |   ✅   | [docs/EDGE_CASES.md](docs/EDGE_CASES.md) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

</div>
