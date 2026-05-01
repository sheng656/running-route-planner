# 🏃‍♂️ Running Route Planner

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
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

### Backend (Serverless)
- **Infrastructure**: AWS SAM (Serverless Application Model)
- **Runtime**: Node.js 22.x (Lambda)
- **API**: Amazon API Gateway
- **Routing Engine**: OpenRouteService API
- **Secrets**: AWS Secrets Manager for secure API key handling

---

## 📂 Repository Structure

```text
.
├── frontend/               # React + Vite application
│   ├── src/components/     # UI components (Map, Configurator, Charts)
│   ├── src/services/       # API integration logic
│   └── src/utils/          # Route calculation & formatting helpers
├── backend/                # AWS SAM Backend
│   ├── src/generate-route/ # Route generation Lambda (ORS integration)
│   ├── src/export-gpx/     # GPX transformation & export Lambda
│   └── template.yaml       # AWS CloudFormation/SAM infrastructure
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

### 3. Backend Setup
```bash
cd backend
npm install

# Build the SAM application
sam build

# Local invocation (optional)
sam local invoke GenerateRouteFunction --event events/generate-route.json
```

---

## 🌐 Deployment

- **Frontend**: Deployed to **Vercel** for optimal performance and global edge delivery.
- **Backend**: Deployed to **AWS** (Lambda + API Gateway), operating within the AWS Free Tier.

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).
