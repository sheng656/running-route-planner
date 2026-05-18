# 🏃‍♂️ Running Route Planner

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Azure](https://img.shields.io/badge/Azure-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![Mapbox](https://img.shields.io/badge/Mapbox-000000?style=for-the-badge&logo=mapbox&logoColor=white)](https://www.mapbox.com/)

An intelligent, interactive running route planning application designed for runners who want seamless route discovery and Garmin-ready exports. Built with a focus on modern UX, serverless architecture, and real-world utility.

---

## ✨ Key Features

### 🛠️ Intelligent Route Configuration
- **Distance-Based Generation**: Choose your target distance (from 1km to a full marathon) and let the engine find the best loop or one-way path.
- **Scenery & Terrain Preferences**: 
  - 🌿 **Parks & Greenery**: Prioritize scenic, nature-filled paths.
  - 🤫 **Quiet Streets**: Avoid heavy traffic and noise.
  - 🚫 **No Stairs**: Ensure a smooth, step-free run.
- **Difficulty Awareness**: Select between Easy (Flat), Moderate (Rolling Hills), or Hard (Steep Climbs) to influence the elevation profile.

### 🎨 Interactive Route Drawing
- **Free-hand Drawing**: Don't want an AI-generated route? Draw your own path directly on the map.
- **Intelligent Snapping**: Your hand-drawn lines automatically snap to the nearest walkable roads and trails using OpenRouteService.
- **Perimeter Detection**: The app intelligently detects if your drawing is a loop or a one-way trip.

### 📊 Performance Insights
- **Live Elevation Profile**: Visualize the climbs and descents of your route with an interactive chart.
- **Map-Sync Hover**: Hover over the elevation chart to see the exact location on the map.
- **Scenic Badges**: Get a quick summary of your route's characteristics and estimated duration.

### 📲 Garmin-Ready Export
- **GPX 1.1 Support**: Export your routes with high-precision trackpoints and elevation data.
- **Seamless Import**: Optimized for Garmin Connect and other major fitness platforms.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (with Glassmorphism & Dark Mode)
- **Maps**: Mapbox GL JS via `react-map-gl` & `@mapbox/mapbox-gl-draw`
- **Charts**: Recharts for elevation visualization
- **Icons**: Lucide React

### Backend (Multi-Backend / Serverless)
- **AWS Serverless Path**:
  - **Infrastructure**: AWS SAM (Serverless Application Model)
  - **Runtime**: Node.js 22.x (Lambda)
  - **API Gateway**: Amazon API Gateway
  - **Secrets**: AWS Systems Manager Parameter Store
- **Azure Serverless Path**:
  - **Runtime**: C# .NET 8 (Isolated Worker)
  - **Infrastructure**: Azure Functions v4
  - **Secrets**: Application Settings
- **Core Routing Engine**: OpenRouteService API

---

## 📂 Repository Structure

```text
.
├── frontend/               # React + Vite application
│   ├── src/components/     # UI components (Map, Configurator, Charts)
│   ├── src/services/       # API integration logic
│   └── src/utils/          # Route calculation & formatting helpers
├── backend/                # AWS SAM Backend (Node.js Lambda)
│   ├── src/generate-route/ # Route generation Lambda (ORS integration)
│   ├── src/export-gpx/     # GPX transformation & export Lambda
│   └── template.yaml       # AWS CloudFormation/SAM infrastructure
├── backend-dotnet/         # Azure Functions Backend (C# .NET 8)
│   ├── src/RunningRoutePlanner.Core/       # Business logic, ORS client & models
│   ├── src/RunningRoutePlanner.Functions/  # Azure Functions endpoints (CORS, GPX, Route)
│   └── tests/                              # Unit & integration test suite
└── README.md               # You are here
```

---

## 🛠️ Local Development

### 1. Prerequisites
- Node.js (v20+)
- AWS CLI & SAM CLI (for backend)
- Mapbox Public Token

### 2. Frontend Setup
```bash
cd frontend
npm install

# Create .env file
echo "VITE_MAPBOX_TOKEN=your_token_here" > .env

npm run dev
```

### 3. AWS Backend Setup (Node.js)
```bash
cd backend
npm install

# Build the SAM application
sam build

# Local invocation (optional)
sam local invoke GenerateRouteFunction --event events/generate-route.json
```

### 4. Azure Backend Setup (C# .NET)
```bash
cd backend-dotnet/src/RunningRoutePlanner.Functions

# Start Azurite local storage emulator (required for local execution)
npx azurite --silent

# Start Azure Functions local runtime
func start
```

---
## ✅ Testing

The project includes comprehensive unit test coverage across both frontend and backend using **Vitest**:

### Frontend Tests
```bash
cd frontend
npm test
```
- ✓ **Route utilities** (`routeUtils.test.ts`): Distance calculation, route mode detection
- ✓ **Route API** integration tests

### AWS Backend Tests (Node.js)
```bash
cd backend
npm test
```
- ✓ **GPX Export** (`export-gpx/app.test.ts`): XML escaping, filename sanitization
- ✓ **Route Generation** (`generate-route/app.test.ts`): Coordinate validation, boundary checks

### Azure Backend Tests (C# .NET)
```bash
cd backend-dotnet
dotnet test
```
- ✓ **Core Services Tests** (`RunningRoutePlanner.Core.Tests`): ORS API client, GPX transformation logic, coordinate validations

---

## 🔒 Security & Quality Improvements

### Phase 1: Core Security & Bug Fixes
- **CORS Protection**: Backend API now accepts configurable `AllowedOrigin` parameter instead of wildcard `*`
- **Error Sanitization**: API errors are generalized before returning to clients to prevent exposing internal implementation details
- **Input Validation**: Strict coordinate boundary validation (longitude: -180 to 180, latitude: -90 to 90)

### Phase 2: Code Quality & UI Stability
- **Radix UI Integration**: Replaced custom UI components with production-grade [`@radix-ui`](https://www.radix-ui.com/) primitives for accessibility and robustness
- **Type Safety**: Centralized type definitions in `frontend/src/types/route.ts`
- **Race Condition Prevention**: Implemented `AbortController` for HTTP requests to handle rapid consecutive "Generate Route" clicks gracefully
- **Frontend Unit Tests**: Complete test coverage for route calculations, elevation formatting, and UI logic

### Phase 3: Memory & Performance Optimizations
- **Memory Leak Fixes**: 
  - Stabilized `MapView.tsx` callbacks with `useRef` to prevent repeated Mapbox Draw instance unmounting
  - Proper cleanup of `requestAnimationFrame` IDs in effect hooks
- **Backend Validation**: Boundary checks on all incoming coordinates before passing to OpenRouteService
- **Backend Unit Tests**: Test coverage for GPX sanitization and coordinate validation logic

---
## 🌐 Deployment

- **Frontend**: Deployed to [running.sheng.nz](https://running.sheng.nz) via **Vercel** for optimal performance and global edge delivery.
- **Backend (AWS)**: Deployed to **AWS** (Lambda + API Gateway), operating within the AWS Free Tier.
- **Backend (Azure)**: Deployed to **Microsoft Azure** (Azure Functions v4 isolated worker plan + Storage Account).

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).
