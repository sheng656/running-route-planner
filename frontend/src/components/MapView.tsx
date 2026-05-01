// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Map, { Layer, Marker, Source } from 'react-map-gl';
import type { LineLayer } from 'react-map-gl';
import type { RoutePoint } from '../data/mockRoute';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

type RouteMode = 'loop' | 'one-way';

export interface DrawnFeature {
  type: 'LineString' | 'Polygon';
  coordinates: [number, number][];
}

export interface MapViewHandle {
  getDrawnFeatures: () => DrawnFeature | null;
  clearDrawing: () => void;
  enableDrawMode: () => void;
  disableDrawMode: () => void;
}

interface MapViewProps {
  activePointIndex: number | null;
  routeMode: RouteMode;
  startPoint: [number, number];
  onStartPointChange: (coords: [number, number]) => void;
  routePoints: RoutePoint[];
  drawMode?: boolean;
  onDrawingComplete?: (feature: DrawnFeature) => void;
}

// A valid Mapbox token is required to render maps.
// You can grab an access token from https://account.mapbox.com/
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export const MapView = forwardRef<MapViewHandle, MapViewProps>(({
  activePointIndex,
  routeMode,
  startPoint,
  onStartPointChange,
  routePoints,
  drawMode = false,
  onDrawingComplete,
}, ref) => {
  const mapRef = useRef(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const mapboxMapRef = useRef<any>(null);
  const [viewState, setViewState] = useState({
    longitude: startPoint[0],
    latitude: startPoint[1],
    zoom: 13,
    pitch: 40,
  });

  const [routeLine, setRouteLine] = useState<any>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getDrawnFeatures: () => {
      if (!drawRef.current) return null;
      const features = drawRef.current.getAll();
      if (features.features.length === 0) return null;

      const feature = features.features[0];

      // Only LineString is supported; Polygon has nested coords and would crash routeUtils
      if (feature.geometry.type !== 'LineString') return null;

      return {
        type: 'LineString' as const,
        coordinates: feature.geometry.coordinates as [number, number][],
      };
    },
    clearDrawing: () => {
      if (drawRef.current) {
        drawRef.current.deleteAll();
      }
    },
    enableDrawMode: () => {
      if (mapboxMapRef.current && drawRef.current) {
        // Enable all draw tools
        drawRef.current.changeMode('draw_line_string');
      }
    },
    disableDrawMode: () => {
      if (drawRef.current) {
        drawRef.current.changeMode('simple_select');
      }
    },
  }), []);

  // Initialize Draw control
  useEffect(() => {
    if (!mapboxMapRef.current) return;

    // Add Draw control
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        line_string: true,
        trash: true,
      },
    });

    mapboxMapRef.current.addControl(draw, 'top-right');
    drawRef.current = draw;

    // Listen to draw events
    const handleDrawCreate = () => {
      const features = draw.getAll();
      if (features.features.length > 0) {
        const feature = features.features[features.features.length - 1];
        const drawnFeature: DrawnFeature = {
          type: feature.geometry.type as 'LineString' | 'Polygon',
          coordinates: feature.geometry.coordinates,
        };
        if (onDrawingComplete) {
          onDrawingComplete(drawnFeature);
        }
      }
    };

    const handleDrawUpdate = () => {
      const features = draw.getAll();
      if (features.features.length > 0) {
        const feature = features.features[features.features.length - 1];
        const drawnFeature: DrawnFeature = {
          type: feature.geometry.type as 'LineString' | 'Polygon',
          coordinates: feature.geometry.coordinates,
        };
        if (onDrawingComplete) {
          onDrawingComplete(drawnFeature);
        }
      }
    };

    mapboxMapRef.current.on('draw.create', handleDrawCreate);
    mapboxMapRef.current.on('draw.update', handleDrawUpdate);

    return () => {
      if (mapboxMapRef.current) {
        mapboxMapRef.current.off('draw.create', handleDrawCreate);
        mapboxMapRef.current.off('draw.update', handleDrawUpdate);
        mapboxMapRef.current.removeControl(draw);
        drawRef.current = null;
      }
    };
  }, [onDrawingComplete]);

  useEffect(() => {
    if (!drawRef.current) {
      return;
    }

    if (drawMode) {
      drawRef.current.changeMode('draw_line_string');
    } else {
      drawRef.current.changeMode('simple_select');
    }
  }, [drawMode]);

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

    if (routeCoordinates.length === 0) {
      setRouteLine(null);
      setAnimationProgress(0);
      return;
    }

    const totalPoints = routeCoordinates.length;
    const durationMs = Math.min(900, Math.max(250, totalPoints * 6));
    const startTs = performance.now();

    const updateRouteLine = (visiblePoints: number) => {
      setRouteLine({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates.slice(0, visiblePoints),
        },
      });
      setAnimationProgress(visiblePoints);
    };

    const animateRoute = (nowTs: number) => {
      const elapsed = nowTs - startTs;
      const progress = Math.min(1, elapsed / durationMs);
      const visiblePoints = Math.max(2, Math.min(totalPoints, Math.round(progress * totalPoints)));

      updateRouteLine(visiblePoints);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateRoute);
      }
    };

    updateRouteLine(Math.min(2, totalPoints));
    animationFrameId = requestAnimationFrame(animateRoute);

    return () => {
      cancelAnimationFrame(animationFrameId);
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
          ref={mapRef}
          {...viewState}
          onMove={(evt) => {
            setViewState(evt.viewState);
            mapboxMapRef.current = evt.target;
          }}
          onLoad={(evt) => {
            mapboxMapRef.current = evt.target;
          }}
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
});

MapView.displayName = 'MapView';
