# SeatPlan

[![Build Docker Images & Create Release](https://github.com/moghaf/seatplan/actions/workflows/docker-release.yml/badge.svg)](https://github.com/moghaf/seatplan/actions/workflows/docker-release.yml)

A seat/desk planning web application for managing team seating arrangements with a visual seat map editor.

## Key Features

- **Visual Seat Map Editor** — Drag-and-drop seat layout editor
- **Team & Member Management** — Organize team members and work functions
- **Seat Assignments** — Assign seats by week with unavailability tracking
- **Holiday Management** — Handle holiday exclusions in scheduling
- **Role-Based Access** — Admin and viewer roles with JWT authentication
- **Bilingual UI** — English and Persian/Farsi (i18next)
- **Dark/Light Theme** — Toggle between themes

## Tech Stack

- **Backend:** .NET 10 / ASP.NET Core / EF Core / SQLite
- **Frontend:** React 19 / TypeScript / Vite / Tailwind CSS
- **Auth:** JWT Bearer + BCrypt

## Build & Run

### Docker (recommended)

```sh
docker compose up --build
```

Backend at `http://localhost:5000`, frontend at `http://localhost:8080`.

### Without Docker

**Backend:**
```sh
cd backend
dotnet run
```

**Frontend:**
```sh
cd frontend
npm ci
npm run dev
```

The frontend dev server proxies API requests to `localhost:5000`.
