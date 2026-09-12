# Portfolio API

Express and MongoDB API for the React portfolio. The Vite proxy forwards `/api` requests to this service during local development.

## Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` to either local MongoDB or a MongoDB Atlas connection string.
2. Run `npm.cmd install`.
3. Run `npm.cmd run seed` to populate projects and blog posts.
4. Run `npm.cmd run dev`.

## Endpoints

- `GET /api/health`
- `POST /api/admin/forgot-password` with `email` — sends a 15-minute, one-time password reset link
- `POST /api/admin/reset-password` with `token` and `password` — consumes a reset link and changes the admin password
- `GET /api/projects?category=all|web-apps|full-stack|frontend|backend`
- `GET /api/projects/:id`
- `GET /api/blog`
- `GET /api/blog/:id`
- `POST /api/contact` with `name`, `email`, optional `subject`, and `message`
- `GET /api/resume` — public current resume metadata and URL (404 until one is uploaded)
- `GET /api/resume/admin/current`, `POST /api/resume`, and `DELETE /api/resume` — admin-only resume management; upload field name: `resume`

## Cloudinary setup and deployment

All new project images, certificate files, and resumes are stored permanently in Cloudinary. Create a Cloudinary account, copy its Cloud Name, API Key, and API Secret into the backend environment, and add the same three values to Render's Environment Variables:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

MongoDB stores the resulting secure Cloudinary URL and a private Cloudinary public ID for safe replacement/deletion. The existing `/uploads` static route remains available only for legacy MongoDB records that still point to local files; it is not used for new uploads.

Use these environment variables for production:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=a-long-random-secret
FRONTEND_URL=https://www.example.com
# For more than one allowed frontend origin, separate values with commas.
# FRONTEND_URL=https://www.example.com,https://example.com
# For local testing against a deployed API, include http://localhost:5173 as well.
```

For a same-origin deployment, leave the frontend API base unset and proxy `/api` and `/uploads` to this service. For a separately hosted frontend, build it with `VITE_API_BASE_URL=https://api.example.com/api`, add the frontend origin to `FRONTEND_URL`, and configure `COOKIE_SAME_SITE=none` over HTTPS. The server then enables secure cross-origin admin cookies and the resume links resolve to the API host.
