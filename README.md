# Vitask — Minimal, Fast, Offline-First Task Manager

**Website:** [vitask.app](https://vitask.app)

Vitask is a **fast, distraction-free task manager** built with a modern offline-first architecture.
It’s designed to sync instantly and work reliably on unstable connections.

Vitask focuses on **speed, simplicity, and reliability**, with a backend engineered for low-latency updates and a frontend with optimistic UI and local queues.

---

## Highlights

- **Instant, responsive UI** via optimistic updates
- **Offline-first queue**
  - Tasks can be added/edited/removed while offline or not logged in
  - Synced automatically when connection restores or you log in
- **Authentication**
- **Deployed** via Docker Compose and Caddy on Hetzner

---

## Tech Stack

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| Frontend   | React, Zustand, Tailwind, Vite |
| Backend    | FastAPI, SQLAlchemy, Pydantic  |
| Database   | PostgreSQL                     |
| Auth       | JWT (access + refresh tokens)  |
| Deployment | Docker, Docker Compose, Caddy  |
| Hosting    | Hetzner Cloud                  |

---

## Future Roadmap

- **Keyboard driven, Vim-like interactions**
- **Tags** to group tasks
- **Date and time** to start/finish the task
- **Task priority**
- **Mobile/desktop** apps
- **Voice assistant** to add tasks
