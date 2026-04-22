// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import Map, { Layer, Marker, Source } from 'react-map-gl';
import type { LineLayer } from 'react-map-gl';
import type { RoutePoint } from '../data/mockRoute';

type RouteMode = 'loop' | 'one-way';

interface MapViewProps {
  activePointIndex: number | null;
  routeMode: RouteMode;
  startPoint: [number, number];
  onStartPointChange: (coords: [number, number]) => void;
  routePoints: RoutePoint[];
}

// A valid Mapbox token is required to render maps.
// You can grab an access token from https://account.mapbox.com/
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export const MapView: React.FC<MapViewProps> = ({
  activePointIndex,
  routeMode,
  startPoint,
  onStartPointChange,
  routePoints,
}) => {
  const [viewState, setViewState] = useState({
    longitude: startPoint[0],
    latitude: startPoint[1],
    zoom: 13,
    pitch: 40,
  });

  const [routeLine, setRouteLine] = useState<any>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  const routeCoordinates = useMemo(() => {
    const shifted = routePoints.map((point) => point.coordinates);

    if (shifted.length === 0) {
      return [];
    }

    if (routeMode === 'loop') {
      return [...shifted, shifted[0]];
    }

    return shifted;
  }, [routePoints, routeMode]);

  useEffect(() => {
    setViewState((prev) => ({
      ...prev,
      longitude: startPoint[0],
      latitude: startPoint[1],
    }));
  }, [startPoint]);

  useEffect(() => {
    let animationFrameId: number;
    let timeoutId: number;
    const minimumPoints = Math.min(2, routeCoordinates.length);
    let currentPoints = minimumPoints;

    const animateRoute = () => {
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates.slice(0, currentPoints),
        },
      };

      setRouteLine(geojson);
      setAnimationProgress(currentPoints);

      if (currentPoints < routeCoordinates.length) {
        currentPoints += 1;
        timeoutId = window.setTimeout(() => {
          animationFrameId = requestAnimationFrame(animateRoute);
        }, 80);
      }
    };

    animateRoute();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [routeCoordinates]);

  const routeStyle: LineLayer = {
    id: 'route-line',
    type: 'line',
    paint: {
      'line-color': '#2563eb',
      'line-width': 6,
      'line-opacity': 0.8,
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
  };

  const hasToken = MAPBOX_TOKEN.length > 5;
  const hoverPoint =
    activePointIndex !== null && activePointIndex >= 0 && activePointIndex < routeCoordinates.length
      ? routeCoordinates[activePointIndex]
      : null;

  return (
    <div className="w-full h-full relative bg-slate-100 flex items-center justify-center">
      {!hasToken && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-200/80 backdrop-blur-sm p-4 text-center">
          <p className="font-semibold text-lg">Mapbox Token Missing</p>
          <p className="text-slate-600 text-sm mt-2 max-w-md">
            Add VITE_MAPBOX_TOKEN in frontend/.env, then restart the dev server.
          </p>
        </div>
      )}

      {hasToken && (
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          attributionControl={false}
          scrollZoom={true}
          dragPan={true}
        >
          {routeLine && (
            <Source type="geojson" data={routeLine}>
              <Layer {...routeStyle} />
            </Source>
          )}

          {hoverPoint && (
            <Marker longitude={hoverPoint[0]} latitude={hoverPoint[1]}>
              <div className="w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md" />
            </Marker>
          )}

          <Marker
            longitude={startPoint[0]}
            latitude={startPoint[1]}
            draggable={true}
            onDragEnd={(evt) => onStartPointChange([evt.lngLat.lng, evt.lngLat.lat])}
          >
            <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-[10px] font-semibold text-white">S</span>
            </div>
          </Marker>

          {routeMode === 'one-way' &&
            routeCoordinates.length > 0 &&
            animationProgress >= routeCoordinates.length && (
              <Marker
                longitude={routeCoordinates[routeCoordinates.length - 1][0]}
                latitude={routeCoordinates[routeCoordinates.length - 1][1]}
              >
                <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                  <span className="text-[10px] font-semibold text-white">E</span>
                </div>
              </Marker>
            )}

          {routeMode === 'loop' && (
            <div className="absolute top-3 left-3 rounded-lg bg-white/90 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 shadow-sm">
              Start and end are the same point (Loop mode)
            </div>
          )}
        </Map>
      )}
    </div>
  );
};
