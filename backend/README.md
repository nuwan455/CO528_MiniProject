# Department Engagement & Career Platform Backend

NestJS + TypeScript backend for the DECP university platform. The API is structured as a modular monolith with service-style boundaries so the same `/api/v1/*` contract can be consumed by both a Next.js web app and a React Native mobile app.

## Architecture

- `auth`: JWT access/refresh auth, current-user context, logout, refresh-token rotation
- `users`: profile management, user listing, search, admin role updates
- `posts`: social feed, likes, comments, shares, visibility filtering
- `jobs`: jobs/internships, applications, applicant listing, self-service application history
- `events`: event management and RSVP tracking
- `research`: research project publishing and collaborator management
- `messaging`: direct/group conversations and message history
- `notifications`: in-app notification inbox and read state
- `analytics`: aggregated dashboard metrics
- `admin`: moderation and reporting endpoints

Cross-cutting concerns:

- Prisma ORM with PostgreSQL
- Swagger at `/docs`
- Global validation, error formatting, and response contract
- RBAC with `STUDENT | ALUMNI | ADMIN`
- Local upload abstraction with a swappable service
- Docker Compose for local development

## Folder Structure

```text
.
├── prisma
│   ├── schema.prisma
│   └── seed.ts
├── src
│   ├── config
│   ├── modules
│   │   ├── admin
│   │   ├── analytics
│   │   ├── auth
│   │   ├── events
│   │   ├── jobs
│   │   ├── messaging
│   │   ├── notifications
│   │   ├── posts
│   │   ├── prisma
│   │   ├── research
│   │   ├── uploads
│   │   └── users
│   ├── shared
│   ├── app.module.ts
│   └── main.ts
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## API Contract

Success:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## Key Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/users`
- `GET /api/v1/users/search?q=`
- `PATCH /api/v1/users/:id/role`
- `POST /api/v1/posts`
- `GET /api/v1/posts`
- `POST /api/v1/posts/:id/comments`
- `POST /api/v1/jobs/:id/apply`
- `POST /api/v1/events/:id/rsvp`
- `POST /api/v1/research/projects/:id/collaborators`
- `POST /api/v1/messages/conversations`
- `GET /api/v1/notifications`
- `GET /api/v1/analytics/overview`
- `GET /api/v1/admin/reports`

## Local Setup

### Option 1: Docker

1. Copy `.env.example` to `.env`.
2. Run `docker compose up --build`.
3. Open Swagger at `http://localhost:4000/docs`.

### Option 2: Local Node

Node `20.x` is the intended runtime.

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Run `npx prisma generate`.
4. Run `npx prisma migrate dev --name init`.
5. Run `npm run prisma:seed`.
6. Run `npm run start:dev`.

## Deployment Notes

- Render/Railway: set `DATABASE_URL`, JWT secrets, client origins, and persistent file storage or replace the upload service with S3/Cloudinary.
- AWS/GCP: containerize with the included `Dockerfile`, back PostgreSQL with RDS/Cloud SQL, and move uploads to object storage.
- Redis is included in compose for future cache/pub-sub usage and can be activated without changing the API surface.

## Seed Accounts

- `admin@decp.edu` / `Password123!`
- `student@decp.edu` / `Password123!`
- `alumni@decp.edu` / `Password123!`

## Sample Requests

Register:

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nimal Jayasuriya",
    "email": "nimal@decp.edu",
    "password": "Password123!",
    "role": "STUDENT",
    "department": "Computer Science",
    "batchYear": 2027,
    "skills": ["nestjs", "postgres"],
    "headline": "CS undergraduate"
  }'
```

Create a post:

```bash
curl -X POST http://localhost:4000/api/v1/posts \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Looking for internship opportunities in backend engineering.",
    "visibility": "PUBLIC"
  }'
```

Apply for a job:

```bash
curl -X POST http://localhost:4000/api/v1/jobs/<job_id>/apply \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeUrl": "/uploads/resume.pdf",
    "coverLetter": "Interested in distributed backend systems."
  }'
```

Send a direct message:

```bash
curl -X POST http://localhost:4000/api/v1/messages/conversations/<conversation_id>/messages \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Can we schedule a discussion tomorrow?",
    "messageType": "TEXT"
  }'
```

## Verification Notes

- The project was generated to run on Node `20.x` locally and in Docker.
- In this workspace, dependency install succeeded, but `nest build` under the host `Node v24.14.0` failed inside the Nest CLI dependency chain before reaching project code.
- A direct TypeScript check was also blocked by a corrupted/incompatible host dependency file under the installed `@types/node` package state.
- The recommended verification path is `docker compose up --build` or local Node `20.x`.
