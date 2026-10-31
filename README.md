# EduTrack

A full-stack class-management app. Teachers manage classes, timings, tests, results, attendance and announcements. Students see their own schedule, results, stats, attendance and notifications.

## Features

**Teacher**
- Create classes and add students
- Add class timings and schedule tests
- Enter test results (marks are validated against the test's maximum)
- Mark attendance by date
- Broadcast messages to a whole class

**Student**
- See own classes, timings and upcoming tests
- See own results and a performance chart
- See attendance percentage per class
- Read teacher announcements (read-only, students cannot message teachers)
- See only the weekly top 5 and overall top 5 among classmates (no full leaderboard, by design)

## Tech stack

- **Front-end:** React, Vite, Tailwind CSS, React Router, Recharts
- **Back-end:** Node.js, Express
- **Database:** SQLite (built-in `node:sqlite`)
- **Auth:** bcrypt password hashing and JWT tokens, with role checks on the server

## How it works

- Passwords are stored as bcrypt hashes, never as plain text.
- The server checks the token and the user's role on every protected route.
- Teachers can only change classes they own. Students can only read their own data.
- Rankings use the average percentage of test marks. Weekly top 5 counts tests dated in the current week (Monday to Sunday).

## Run it locally

You need Node.js 24 or newer.

```bash
# 1. Server
cd server
npm install
# create server/.env with one line:
# JWT_SECRET=any-long-random-text
npm run dev        # http://localhost:4000

# 2. Client (new terminal)
cd client
npm install
npm run dev        # http://localhost:5173
```

The SQLite database file is created automatically on the first server run. Register a teacher and a student from the login page to try the app.

## API overview

| Area | Routes |
|------|--------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Teacher | `/api/teacher/classes`, `.../students`, `.../schedule`, `.../tests`, `.../announcements`, `.../attendance`, `/tests/:id/results` |
| Student | `/api/student/classes`, `schedule`, `tests`, `results`, `stats`, `announcements`, `attendance`, `top5` |

## Planned improvements

- CSV upload for test results
- Deployment (front-end and back-end)
- Automated tests