# Wolkite University Events

A React/Vite campus-events frontend with an Express and MongoDB API.

## Run locally

Requirements: Node.js 20.19 or newer, npm, and a MongoDB instance (local or
MongoDB Atlas).

1. Copy `.env.example` to `.env` and set `MONGO_URI`, `JWT_ACCESS_SECRET`, and
   `JWT_REFRESH_SECRET` to values for your environment.
2. Install dependencies with `npm ci`.
3. Start the API with `npm run dev:api`.
4. In another terminal, start the frontend with `npm run dev`.
5. Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

Vite proxies `/api` requests to the local API on port 5000. To create the
initial campus and administrator records in a new database, set
`ALLOW_DESTRUCTIVE_SEED=true` and a strong `SEED_SUPERADMIN_PASSWORD` in `.env`,
then run `npm run seed`. **Seeding deletes existing campus, college,
department, and user records**, so do not run it against a database containing
data you need to keep. Clear the opt-in variable after seeding.

## Deploy to Render

The root `render.yaml` defines two services: a Render static site for the
frontend and a Node web service for the API. Both use the same repository.

1. Create a MongoDB Atlas cluster and database user. Allow network access from
   Render in Atlas, then copy the connection string.
2. In Render, create a **Blueprint** from this GitHub repository and select
   `render.yaml`.
3. When prompted, enter the Atlas connection string for `MONGO_URI`. Render
   generates the JWT secrets and connects the frontend/API URLs using the
   service hostnames.
4. Wait for both services to deploy. Check the API health endpoint at
   `https://<api-host>/api/health`.
5. For a new database, seed the campus records and initial administrator using
   a trusted machine with the production `MONGO_URI`, `ALLOW_DESTRUCTIVE_SEED=true`,
   and a strong `SEED_SUPERADMIN_PASSWORD`. Run `npm ci` and `npm run seed`
   locally; unset the opt-in variable afterward. This operation is destructive
   if the database already contains organization or user records.

The frontend expects the API hostname in `VITE_API_BASE_URL`; the Render
Blueprint supplies it. `CLIENT_URL` is supplied to the API for credentialed
CORS requests. If you rename either Render service, re-sync the Blueprint so
these references update.

Free Render web services can sleep when idle and may take a little time to
wake up. Use a paid plan if the API needs to be continuously available.
