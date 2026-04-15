# running-route-planner
A lightweight, high-performance web application for runners to instantly plan routes and export them to Garmin devices. Built with React and AWS Lambda, the project focuses on a "zero-friction" experience—no login, no ads, just data-driven route generation with real-time elevation insights and seamless GPX file creation.
# 🏃‍♂️ RunRoute Minimalist | Instant Running Path Planner

[![Public Repository](https://img.shields.io/badge/Repo-Public-green)](https://github.com/sheng656/running-route-planner)
[![Framework](https://img.shields.io/badge/Frontend-React-blue?logo=react)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/Backend-AWS_Lambda-orange?logo=amazon-aws)](https://aws.amazon.com/lambda/)

A streamlined tool for runners to generate optimized routes based on distance, terrain, and scenic preferences. Designed for athletes who need a quick `.gpx` file for their Garmin watches without the hassle of creating an account.

---

## ✨ Key Features

- **Instant Route Generation**: Input your target distance (3k/5k/10k……), preferred terrain (Flat/Hilly), and surroundings (Coastal/Park/Quiet).
- **Interactive 2D Mapping**: Responsive route visualization using Mapbox GL JS with smooth path animations.
- **Synchronized Elevation Profile**: A dynamic chart that syncs with the map to show exactly where the climbs are.
- **Direct Garmin Export**: Generates and downloads standard `.gpx` files locally in the browser for maximum privacy and speed.
- **Zero-Friction UX**: No sign-up or login required—fully functional from the first click.

---

## 🏗️ Technical Architecture

Focused on high availability and staying within the **AWS Free Tier**:

- **Frontend**: React (TypeScript) + Tailwind CSS + Vite (Deployed on Vercel).
- **Map Engine**: Mapbox GL JS (2D Vector Maps).
- **Serverless Backend**: AWS Lambda + Amazon API Gateway (Handling geospatial logic).
- **Routing Engine**: OpenRouteService API (fetching real-world path data).
- **State Management**: React Hooks for real-time UI updates.

---

## 🚀 Engineering Highlights 

- **Performance-First**: Optimized for fast TTI (Time to Interactive) by minimizing client-side bundles and utilizing serverless execution.
- **Privacy by Design**: No user data is stored. GPX files are generated using client-side Blobs, ensuring zero server-side storage costs and total user privacy.
- **Geospatial Integration**: Implemented logic to filter OpenStreetMap (OSM) nodes based on "Scenic" tags (e.g., coastal, forest) to provide higher-quality route suggestions.

---

## 📍 Example Output

| Input | Generated Route | Elevation |
| :--- | :--- | :--- |
| **5km / Hilly / Coastal** | Mission Bay Loop (Auckland) | +65m Ascent, 1 major climb |

**Scenic Review**: *"Enjoy panoramic ocean views along Tamaki Drive. Includes a challenging uphill section at the 2km mark for interval training."*

---

## 🛠️ Local Development

1. **Clone & Install**
   ```bash
   git clone [https://github.com/sheng656/running-route-planner.git](https://github.com/sheng656/running-route-planner.git)
   cd running-route-planner/frontend
   npm install
