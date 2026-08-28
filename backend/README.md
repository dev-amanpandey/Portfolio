# Portfolio API

Express and MongoDB API for the React portfolio. The Vite proxy forwards `/api` requests to this service during local development.

## Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` to either local MongoDB or a MongoDB Atlas connection string.
2. Run `npm.cmd install`.
3. Run `npm.cmd run seed` to populate projects and blog posts.
4. Run `npm.cmd run dev`.

## Endpoints

- `GET /api/health`
- `GET /api/projects?category=all|web-apps|full-stack|frontend|backend`
- `GET /api/projects/:id`
- `GET /api/blog`
- `GET /api/blog/:id`
- `POST /api/contact` with `name`, `email`, optional `subject`, and `message`
- `GET /api/resume` — public current resume metadata and URL (404 until one is uploaded)
- `GET /api/resume/admin/current`, `POST /api/resume`, and `DELETE /api/resume` — admin-only resume management; upload field name: `resume`

## Resume uploads and deployment

Resume files use the existing local upload storage at `uploads/resume`, and MongoDB stores the one active resume record. Mount `backend/uploads` on persistent storage in production; otherwise files will be lost whenever an ephemeral server/container is rebuilt.

Use these environment variables for production:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=a-long-random-secret
FRONTEND_URL=https://www.example.com
# For more than one allowed frontend origin, separate values with commas.
# FRONTEND_URL=https://www.example.com,https://example.com
```

For a same-origin deployment, leave the frontend API base unset and proxy `/api` and `/uploads` to this service. For a separately hosted frontend, build it with `VITE_API_BASE_URL=https://api.example.com/api`, add the frontend origin to `FRONTEND_URL`, and configure `COOKIE_SAME_SITE=none` over HTTPS. The server then enables secure cross-origin admin cookies and the resume links resolve to the API host.
