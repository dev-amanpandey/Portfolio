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
