# Running Route Planner

An interactive running route planning project designed for portfolio demonstration.

The app focuses on:
- route configuration UX
- map-first visualization
- Garmin-friendly export workflow (planned)
- low-cost deployment using Vercel + AWS free tier

## Current Status

Frontend MVP is implemented in `frontend/` with React + Vite + Tailwind + Mapbox + Recharts.

Backend initial implementation is now available in `backend/` via AWS SAM.

## Tech Stack

### Frontend (Implemented)
- React + TypeScript + Vite
- Tailwind CSS
- Mapbox GL via `react-map-gl`
- Recharts for elevation profile

### Backend (Planned)
- AWS Lambda
- API Gateway
- Route data integrations (OpenRouteService / Overpass)
- GPX/FIT export generation API

### Backend (Current - AWS SAM MVP)
- AWS SAM template with API Gateway + 2 Lambda functions
- Secrets Manager-backed OpenRouteService key loading
- `POST /routes/generate` for route generation (OpenRouteService)
- `POST /routes/export/gpx` for GPX file export
- `GET /health` for health checks

## Repository Structure

```
.
├── frontend/               # Frontend app (React/Vite)
├── backend/                # AWS SAM backend (Lambda + API Gateway)
├── README.md               # Project documentation
└── LICENSE
```

## Implemented Features

### Route Configuration Panel
- Distance slider with quick presets: `3k`, `5k`, `10k`, `Half`, `Full`
- Difficulty selector: easy / moderate / hard
- Scenery preference toggles: coastal, park, flat, trails
- Route type selector:
  - `Loop / Return` (default, start=end)
  - `One-way`

### Location Behavior
- On load, app requests browser location permission
- If permission is granted:
  - default start location = current user location
- If permission is denied/unavailable:
  - default start location = Mission Bay, Auckland
- Start pin can be dragged directly on the map to choose a custom start location

### Map Experience
- Real Mapbox 2D map rendering
- Zoom and pan interactions
- Animated route drawing
- Start marker (`S`) and conditional end marker (`E`) for one-way mode
- Elevation-hover marker sync between chart and map

### Elevation + Insights UI
- Elevation profile chart
- Route summary panel (distance, time range, ascent, scenic badge)
- Scenic text commentary block

### Environment Variable Support
- Mapbox token is loaded from environment variable:
  - `VITE_MAPBOX_TOKEN`
- Files:
  - `frontend/.env`
  - `frontend/.env.example`

## Planned Features

### Routing Intelligence
- Generate real routes from user preferences and distance constraints
- Prefer coastline/park segments using OSM metadata
- Slope-aware route scoring

### Export & Device Workflow
- GPX export for Garmin import
- Optional FIT export support
- In-app Garmin import guide UX

### AWS Backend
- Serverless route generation endpoints (Lambda)
- API Gateway routing and throttling
- Caching strategy for free-tier optimization
- Basic observability/logging setup

### Portfolio Enhancements
- Better empty/loading/error states
- More polished mobile interactions
- Route save/share links

## Local Development

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure Mapbox token

Create `frontend/.env`:

```bash
VITE_MAPBOX_TOKEN=your_mapbox_public_token
```

Recommended token restriction setup in Mapbox:
- `http://localhost:*`
- `http://127.0.0.1:*`
- `https://*.vercel.app`

### 3. Run dev server

```bash
cd frontend
npm run dev
```

### 4. Production build

```bash
cd frontend
npm run build
```

### 5. Backend local build

```bash
cd backend
npm install
sam build --template-file template.yaml
```

## Deployment Plan

- Frontend: Vercel
- Backend: AWS (Lambda + API Gateway)
- Goal: keep usage inside free-tier limits

