// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl';
import type { LineLayer } from 'react-map-gl';
import { MOCK_ROUTE } from '../data/mockRoute';

// A valid Mapbox token is required to render maps. 
// You can grab an access token from https://account.mapbox.com/
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

export const MapView: React.FC<{ activePointIndex: number | null }> = ({ activePointIndex }) => {
  const [viewState, setViewState] = useState({
    longitude: 174.82,
    latitude: -36.85,
    zoom: 13,
    pitch: 45
  });

  const [routeLine, setRouteLine] = useState<any>(null);

  useEffect(() => {
    // Generate Snake Animation by showing points up to a certain distance over time
    let animationFrameId: number;
    let currentPoints = 2; // start from the 2nd point to have a line segment
    const animateRoute = () => {
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: MOCK_ROUTE.slice(0, currentPoints).map(p => p.coordinates)
        }
      };
      setRouteLine(geojson);

      if (currentPoints < MOCK_ROUTE.length) {
        currentPoints++;
        setTimeout(() => {
          animationFrameId = requestAnimationFrame(animateRoute);
        }, 100);
      }
    };
    
    animateRoute();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const routeStyle: LineLayer = {
    id: 'route-line',
    type: 'line',
    paint: {
      'line-color': '#2563eb', // text-blue-600
      'line-width': 6,
      'line-opacity': 0.8
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    }
  };

  const hasToken = MAPBOX_TOKEN && MAPBOX_TOKEN.length > 5;

  return (
    <div className="w-full h-full relative bg-slate-100 flex items-center justify-center">
      {!hasToken && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-200/80 backdrop-blur-sm p-4 text-center">
          <p className="font-semibold text-lg">Mapbox Token Missing</p>
          <p className="text-slate-600 text-sm mt-2 max-w-md">
            Please add your Mapbox Access Token to `MapView.tsx` to render the interactive map.
            This area will display an animated high-quality 2D map.
          </p>
        </div>
      )}
      
      {hasToken && (
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          attributionControl={false}
        >
          {/* Animated Route */}
          {routeLine && (
            <Source type="geojson" data={routeLine}>
              <Layer {...routeStyle} />
            </Source>
          )}

          {/* Active Runner Marker (Elevation interaction) */}
          {activePointIndex !== null && MOCK_ROUTE[activePointIndex] && (
             <Marker 
               longitude={MOCK_ROUTE[activePointIndex].coordinates[0]} 
               latitude={MOCK_ROUTE[activePointIndex].coordinates[1]}
             >
               <div className="w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md" />
             </Marker>
          )}

          {/* Start/End Markers */}
          {routeLine && MOCK_ROUTE.length > 0 && (
            <Marker longitude={MOCK_ROUTE[0].coordinates[0]} latitude={MOCK_ROUTE[0].coordinates[1]}>
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-[10px] text-white">S</span>
              </div>
            </Marker>
          )}
          {routeLine && currentPoints >= MOCK_ROUTE.length && (
            <Marker longitude={MOCK_ROUTE[MOCK_ROUTE.length-1].coordinates[0]} latitude={MOCK_ROUTE[MOCK_ROUTE.length-1].coordinates[1]}>
              <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-[10px] text-white">E</span>
              </div>
            </Marker>
          )}
        </Map>
      )}
    </div>
  );
};
