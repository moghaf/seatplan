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

### Development (from source)

```sh
docker compose up --build
```

Default admin credentials: `admin` / `admin`.

Override via `.env` file in the project root:

```sh
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=your-password
SEED_ADMIN_DISPLAY_NAME=Admin
```

Backend at `http://localhost:5000`, frontend at `http://localhost:8080`.

### Production (from pre-built images)

```sh
# Set required secrets in a .env file or export them
export JWT_KEY=your-secret-key-change-in-production
export SEED_ADMIN_PASSWORD=your-admin-password

docker compose -f docker-compose.prod.yml up -d
```

**Required environment variables:**

| Variable | Description |
|---|---|
| `JWT_KEY` | Secret key for signing JWT tokens (min 16 chars) |
| `SEED_ADMIN_PASSWORD` | Password for the seeded admin account |

**Optional environment variables:**

| Variable | Default | Description |
|---|---|---|
| `SEED_ADMIN_USERNAME` | `admin` | Admin login username |
| `SEED_ADMIN_DISPLAY_NAME` | `Admin` | Admin display name |

Or write them to a `.env` file:

```sh
JWT_KEY=your-secret-key-change-in-production
SEED_ADMIN_PASSWORD=your-admin-password
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_DISPLAY_NAME=Admin
```

Then run:

```sh
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

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
