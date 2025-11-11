# Consistency Heatmap

A full-stack template for building GitHub-style streak calendars that track any habit or task. Users authenticate with Google, define their own tasks and intensity thresholds, and log daily activity that renders as a LeetCode-inspired heatmap.

## Stack

- **Frontend**: React + Vite (TypeScript). Custom heatmap component with GitHub-style palette.
- **Backend**: Node.js, Express, Passport Google OAuth.
- **Auth**: Google OAuth 2.0 using server-side sessions (cookies with `credentials: include`).
- **Database**: MongoDB (Atlas or self-hosted). Repository layer uses the official Node driver.

## Getting Started

1. Install dependencies for both workspaces:

   ```bash
   cd /Users/ramuk/Desktop/calendar
   npm install
   ```

2. Copy the example env files and populate secrets:

   ```bash
   cp server/env.example server/.env
   cp client/env.example client/.env
   ```

   Required variables:

   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: credentials from Google Cloud console.
   - `SESSION_SECRET`: strong random string.
   - `CLIENT_URL`: typically `http://localhost:5173`.
   - `MONGODB_URI`: your MongoDB connection string.
   - `MONGODB_DB_NAME`: database to use (defaults to `consistency_heatmap` if omitted).
   - `VITE_API_URL` (client): leave at `http://localhost:4000` for local dev; set to your production domain when deploying (e.g. `https://your-app.vercel.app`).

3. Launch both dev servers in parallel:

   ```bash
   npm run dev
   ```

   The API serves on `http://localhost:4000`, the UI on `http://localhost:5173`. Vite 5 works with Node 18+, but upgrading to Node 20 is recommended long-term.

## API Overview

`/auth/google`  
Initiates the Google OAuth handshake. Redirects back to `CLIENT_URL` on success.

`GET /api/user/me`  
Returns the current session user (requires `credentials: include`).

`GET /api/tasks?includeHeatmap=true`  
Lists tasks for the user. When `includeHeatmap=true`, each task includes 365 days of aggregated counts and resolved intensity levels.

`POST /api/tasks`  
```json
{
  "name": "Watch Udemy lessons",
  "description": "Finish AI track",
  "intensityLevels": [
    { "label": "Light", "minCount": 1, "color": "#9be9a8" },
    { "label": "Medium", "minCount": 3, "color": "#40c463" },
    { "label": "Heavy", "minCount": 5, "color": "#216e39" }
  ]
}
```

`POST /api/activity`  
```json
{
  "taskId": "uuid",
  "date": "2025-11-10",
  "count": 2
}
```
Counts merge per day; posting twice increments the same cell.

`GET /api/activity/task/:taskId`  
Pulls a single task + heatmap.

`GET /api/activity/overview`  
Returns all tasks with heatmaps—used by the dashboard grid.

`GET /api/activity/streaks`  
Computes best/current streak per task.

## Realtime Placeholder

The service exposes clear seams for live updates:

- `activityRouter.post("/")` centralizes mutations—wrap this with a websocket or push notification later.
- Frontend copies a simple `onActivityLogged` callback; replace with subscription updates in the future.

## Development Notes

- **Data**: Mongo collections `users`, `tasks`, and `activity`. Update indexes or schemas in `server/src/storage/repository.ts`.
- **Sessions**: Express session store defaults to in-memory. Swap with Redis or PostgreSQL before production.
- **Styling**: Dark theme mimics GitHub/LeetCode. Adjust palettes in `App.css` and `Heatmap.css`.
- **Builds**: `npm run build` compiles the server (`server/dist/**`) and bundles the Vite client (`client/dist`).

## Deploying to Vercel

The repo ships with `vercel.json` so you can deploy the SPA and API together:

1. Push the repo to GitHub and create a Vercel project.
2. Configure these environment variables in **Project Settings → Environment Variables** (set for Production and Preview):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SESSION_SECRET`
   - `CLIENT_URL` (e.g., `https://your-vercel-app.vercel.app`)
   - `GOOGLE_CALLBACK_URL` (e.g., `https://your-vercel-app.vercel.app/auth/google/callback`)
   - `MONGODB_URI`
   - `MONGODB_DB_NAME`
   - `VITE_API_URL` (e.g., `https://your-vercel-app.vercel.app`)
3. Build command: `npm run build` (already set in `vercel.json`).
4. Output directory: `client/dist` (handled by `vercel.json`).

`api/index.js` wraps the Express application as a Vercel serverless function and includes the compiled `server/dist/**` files. Client requests are rewritten to `index.html` so the Vite SPA handles routing.

## Next Steps

- Promote the websocket placeholder to live presence and streak nudges.
- Add per-task filters, tooltips with metadata, and weekly summaries.
- Add background jobs (cron or serverless queue) for streak reminders.


