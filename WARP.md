# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo with three apps:
  - backend: NestJS API with Auth (JWT), Users, Tasks. Uses Prisma (PostgreSQL), Redis cache, and MQTT for task-created events. Swagger at /api.
  - frontend: React + Vite SPA. Talks to the API via axios and listens to MQTT over WebSocket to prepend created tasks in real time.
  - mobile: Expo skeleton (basic scaffolding; no custom scripts beyond Expo defaults).

Key architecture
- Backend (NestJS)
  - AppModule wires AuthModule, UsersModule, TasksModule.
  - Persistence via PrismaService (PostgreSQL). Schema defines User and Task with TaskStatus enum.
  - Caching via CacheService (Redis). TasksService caches list queries with TTL and invalidates on mutations; UsersService caches user profile.
  - Messaging via MqttService (MQTT). On task creation, publishes to topic users/{userId}/tasks/created with a small JSON payload.
  - Auth via JwtStrategy (Bearer token). AuthService registers/logs in users and issues JWTs (sub=user.id).
  - API docs via SwaggerModule at /api; CORS enabled; PORT defaults to 3000.
- Frontend (React + Vite)
  - API client in src/lib/api.ts sets Authorization: Bearer <token> from localStorage.
  - MQTT client in src/lib/mqttClient.ts connects to WebSocket URL and optionally sends token (username "bearer", password=<token>).
  - App routes: / (welcome), /login, /register, /tasks. Tasks page creates/filters tasks and listens to MQTT topic users/{id}/tasks/created to prepend new ones.
  - Env resolution: index.html populates window.ENV for Play-with-Docker; Vite env vars VITE_API_URL and VITE_MQTT_WS_URL are also supported.
- Mobile (Expo)
  - Basic Expo app configuration via expo-router entry; no custom build/lint/test scripts defined here.

Prerequisites and environment
- Services expected locally unless overridden by env vars:
  - PostgreSQL: set DATABASE_URL (required by backend/Prisma), e.g. postgres://user:{{POSTGRES_PASSWORD}}@localhost:5432/dbname
  - Redis: REDIS_URL (default redis://localhost:6379)
  - MQTT broker: MQTT_URL (default mqtt://localhost:1883); Frontend WS default ws://localhost:9001
  - JWT: JWT_SECRET (backend signs/verifies tokens; defaults to "secret" if unset)
- Swagger UI: http://localhost:3000/api once backend is running.

Common commands
- Root
  - This is not a workspace; run commands from each package directory.

- Backend (NestJS) — run from backend/
  - Install deps: npm install
  - Generate Prisma client: npm run prisma:generate
  - Run migrations (dev): npm run prisma:migrate
  - Start (dev watch): npm run start:dev
  - Start (prod build): npm run build && node dist/main.js
  - Lint: npm run lint
  - Tests (all): npm test
  - Tests (watch): npm run test:watch
  - Single test:
    - By name: npm test -- -t "pattern"
    - By file: npm test -- path/to/file.spec.ts
  - Env needed at runtime: DATABASE_URL, (optional) JWT_SECRET, REDIS_URL, MQTT_URL, PORT

- Frontend (Vite + React) — run from frontend/
  - Install deps: npm install
  - Dev server: npm run dev (defaults to port 5173; hosts externally for Docker)
  - Build: npm run build
  - Preview build: npm run preview
  - Lint: npm run lint
  - Tests (jsdom): npm test
  - Single test:
    - By name: npm test -- -t "renderiza"
    - By file: npm test -- src/ui/App.test.tsx
  - Env options: VITE_API_URL (default http://localhost:3000), VITE_MQTT_WS_URL (default ws://localhost:9001). index.html can auto-derive both when running in Play-with-Docker.

- Mobile (Expo) — run from mobile/
  - Install deps: npm install
  - Start Metro: npm run start
  - Platform runs: npm run ios / npm run android / npm run web

Development tips specific to this repo
- Data flow: Auth issues JWT; frontend stores token in localStorage and attaches it to API requests. TasksService publishes MQTT messages; frontend subscribes to users/{userId}/tasks/created after fetching profile to get userId.
- Caching: If API responses appear stale after mutations, TasksService invalidates several cache keys; ensure Redis is reachable or disable cache by not running Redis (calls will just miss and proceed to DB).
- Testing: Frontend tests are configured with @testing-library and a jest.setup.ts; backend uses ts-jest on Node environment and looks for *.spec.ts under src/.

Conventions and project rules
- No CLAUDE.md, .cursor rules, or Copilot instruction files were found in this repo at the time of writing.
- No root README.md was found; refer to this WARP.md for setup and structure.
