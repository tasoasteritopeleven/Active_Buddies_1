# Active Buddies — Backend API

Enterprise-grade NestJS backend for the Active Buddies fitness social platform.

## Stack

| Layer              | Technology                                  |
| ------------------ | ------------------------------------------- |
| Framework          | NestJS 10 (TypeScript strict)               |
| Database           | PostgreSQL 16 + Prisma 5                    |
| Cache / Pub-Sub    | Redis 7 (ioredis)                           |
| Auth               | JWT (access + refresh rotation) + Argon2id  |
| Real-time          | Socket.IO gateway (JWT-authenticated)       |
| Validation         | class-validator + class-transformer         |
| Docs               | Swagger / OpenAPI (`/api/docs`)             |
| Security           | Helmet, CORS allow-list, Throttler, Argon2  |
| Observability      | Nest Logger, health & readiness probes      |

## Module map

```
src/
├── auth/            # register, login, refresh rotation, logout(-all), JWT strategy, guards
├── users/           # me, update, search, discover, getById
├── matching/        # suggestions (scoring algorithm), requests (send/accept/decline), connections
├── chat/            # conversations, messages, WebSocket gateway (/ws/chat)
├── notifications/   # list, mark-read, mark-all-read
├── challenges/      # CRUD, join/leave, progress, leaderboard (cached)
├── communities/     # CRUD, join/leave, members
├── health/          # /api/health (liveness), /api/health/ready (DB + Redis)
├── common/          # global exception filter, interceptors, decorators (CurrentUser, Roles, Public)
├── prisma/          # PrismaService (global)
├── cache/           # CacheService — Redis wrapper, getOrSet helper (global)
└── config/          # env validation (class-validator) at boot time
```

## Prerequisites

- Node.js 20.x or newer
- Docker (for the bundled PostgreSQL + Redis), **or** an existing Postgres 14+ and Redis 6+
- `npm` (or `pnpm`)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL + Redis
docker compose up -d

# 3. Copy env template
cp .env.example .env
# The default DATABASE_URL and REDIS_* match docker-compose

# 4. Generate Prisma client + run migrations
npm run prisma:generate
npm run prisma:migrate -- --name init

# 5. Seed demo data (optional)
npm run prisma:seed

# 6. Run in dev mode (watch + HMR)
npm run start:dev
```

API will be on `http://localhost:4000/api`, Swagger docs on `http://localhost:4000/api/docs`.

## Environment variables

All env vars are validated at boot (`src/config/env.validation.ts`). If any required variable is missing or malformed, the process exits immediately with a readable error. See [`.env.example`](./.env.example) for the full list.

Critical ones:

| Variable                   | Purpose                                   |
| -------------------------- | ----------------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection string              |
| `REDIS_HOST` / `REDIS_PORT`| Redis connection                          |
| `JWT_ACCESS_SECRET`        | Signs access tokens (≥ 16 chars)          |
| `JWT_REFRESH_SECRET`       | Signs refresh tokens (≥ 16 chars, distinct)|
| `JWT_ACCESS_EXPIRES_IN`    | e.g. `15m`                                |
| `JWT_REFRESH_EXPIRES_IN`   | e.g. `7d`                                 |
| `CORS_ORIGIN`              | Comma-separated list of allowed origins   |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | Global rate-limit window (seconds) and max req |

## NPM scripts

| Script                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run start:dev`    | Dev server with watch mode               |
| `npm run start:prod`   | Run compiled server                      |
| `npm run build`        | Build to `dist/`                         |
| `npm run typecheck`    | `tsc --noEmit` — strict type check       |
| `npm run lint`         | ESLint auto-fix                          |
| `npm run test`         | Unit tests (Jest)                        |
| `npm run test:e2e`     | End-to-end tests                         |
| `npm run prisma:migrate` | Dev migration + regenerate client      |
| `npm run prisma:migrate:prod` | Apply migrations in production     |
| `npm run prisma:seed`  | Seed demo data                           |
| `npm run prisma:studio`| Prisma Studio UI                         |

## API conventions

All REST responses are wrapped by `TransformInterceptor`:

```json
{ "success": true, "data": { ... }, "timestamp": "2026-04-19T..." }
```

All errors follow a consistent shape:

```json
{ "statusCode": 409, "message": "...", "error": "ConflictError", "path": "/api/...", "timestamp": "..." }
```

Authentication: `Authorization: Bearer <accessToken>`.

Public routes are opt-in with `@Public()` — every other route is protected by the globally-registered `JwtAuthGuard`.

## WebSocket (`/ws/chat`)

Client connection must provide a valid JWT:

```ts
io('/ws/chat', { auth: { token: '<accessToken>' } })
```

Events:

| Direction | Event                  | Payload                                                  |
| --------- | ---------------------- | -------------------------------------------------------- |
| C→S       | `conversation:join`    | `{ conversationId }`                                     |
| C→S       | `conversation:leave`   | `{ conversationId }`                                     |
| C→S       | `conversation:typing`  | `{ conversationId, isTyping }`                           |
| S→C       | `message:new`          | Full message payload (sent when someone posts a message) |
| S→C       | `conversation:typing`  | `{ conversationId, userId, isTyping }`                   |

## Security checklist

- ✅ Passwords hashed with **argon2id** (19 MB, t=2) — OWASP 2023 recommendation
- ✅ Refresh tokens stored as **sha-256 hash**, rotated on each refresh
- ✅ Access tokens short-lived (15m default)
- ✅ Request validation with `class-validator` (whitelist + forbid non-whitelisted)
- ✅ Global rate limiting via `ThrottlerGuard`, tight limits on `/auth/*`
- ✅ Helmet security headers
- ✅ CORS allow-list from env
- ✅ SQL injection-safe (Prisma parameterises everything)
- ✅ Prisma error codes mapped to HTTP status (unique-violation → 409, etc.)

## Scaling notes

- **Stateless**: No in-memory session; horizontally scalable. Sticky sessions only for WebSocket — use the Socket.IO Redis adapter (`@socket.io/redis-adapter` is already a dependency) when running more than one instance.
- **Cache**: `CacheService` gracefully degrades if Redis is down (returns `null` / skips write). Attach the Redis adapter for multi-instance pub/sub.
- **DB**: Connection pooling handled by Prisma. For higher concurrency, put PgBouncer in front and set `?pgbouncer=true` in `DATABASE_URL`.
- **Queue**: `bullmq` + `ioredis` are installed; plug in a `QueueModule` whenever background jobs become necessary (welcome emails, digest notifications, etc.).

## Testing

Unit tests live next to the source (`*.spec.ts`), E2E in `test/`. Tests use a separate database — point `DATABASE_URL` at a throw-away instance before running `npm run test:e2e`.

## Deployment

Production checklist:

1. Generate strong secrets: `openssl rand -hex 48` for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
2. `NODE_ENV=production`, `ENABLE_SWAGGER=false`.
3. Run `npm ci && npm run build && npm run prisma:migrate:prod`.
4. Start with `node dist/main.js` behind a reverse proxy (Nginx / Caddy) with TLS.
5. Scale horizontally; ensure Redis is reachable and the Socket.IO Redis adapter is wired up.
