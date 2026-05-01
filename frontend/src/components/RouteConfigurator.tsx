import React, { useEffect, useState } from 'react';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, Navigation, Activity, Edit3 } from 'lucide-react';
import type { DrawnFeature, MapViewHandle } from './MapView';
import { 
  detectRouteMode, 
  calculateRouteLength, 
  extractWaypoints,
} from '../utils/routeUtils';

type RouteMode = 'loop' | 'one-way';
type LocationSource = 'user' | 'mission-bay';
type ConfigMode = 'default' | 'draw-mode';

export interface ConfirmDrawingPayload {
  feature: DrawnFeature;
  detectedMode: RouteMode;
  estimatedDistance: number;
  waypoints: [number, number][];
}

interface RouteConfiguratorProps {
  routeMode: RouteMode;
  onRouteModeChange: (mode: RouteMode) => void;
  drawMode: boolean;
  onDrawModeChange: (enabled: boolean) => void;
  pendingDrawnFeature: DrawnFeature | null;
  onClearPendingDrawnFeature: () => void;
  onRequestConfirm: (payload: ConfirmDrawingPayload) => void;
  locationSource: LocationSource;
  startPoint: [number, number];
  canExportGpx: boolean;
  onGenerateRoute: (payload: {
    distanceKm?: number;
    difficulty: 'easy' | 'moderate' | 'hard';
    preferences: string[];
    guidingWaypoints?: [number, number][];
    drawMode?: boolean;
  }) => void;
  onExportGpx: () => void;
  isGenerating: boolean;
  mapViewRef: React.RefObject<MapViewHandle | null>;
}

export const RouteConfigurator: React.FC<RouteConfiguratorProps> = ({
  routeMode,
  onRouteModeChange,
  locationSource,
  startPoint,
  canExportGpx,
  onGenerateRoute,
  onExportGpx,
  isGenerating,
  mapViewRef,
  drawMode,
  onDrawModeChange,
  pendingDrawnFeature,
  onRequestConfirm,
}) => {
  const [distance, setDistance] = useState<number[]>([5]);
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard'>('moderate');
  const [preferences, setPreferences] = useState<string[]>(["green"]);
  
  const [configMode, setConfigMode] = useState<ConfigMode>('default');

  useEffect(() => {
    if (!pendingDrawnFeature) {
      return;
    }

    const detectedMode = detectRouteMode(pendingDrawnFeature.coordinates);
    const estimatedDistance = calculateRouteLength(pendingDrawnFeature.coordinates);
    const waypoints = extractWaypoints(pendingDrawnFeature.coordinates, 50);

    if (detectedMode !== routeMode) {
      onRouteModeChange(detectedMode);
    }

    onRequestConfirm({
      feature: pendingDrawnFeature,
      detectedMode,
      estimatedDistance,
      waypoints,
    });
  }, [pendingDrawnFeature, onRouteModeChange, routeMode, onRequestConfirm]);

  const togglePreference = (pref: string) => {
    setPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleDrawRoute = () => {
    setConfigMode('draw-mode');
    onDrawModeChange(true);
    mapViewRef.current?.enableDrawMode();
  };

  // Called by App when drawing is confirmed & generated successfully
  // Reset local draw-mode state
  useEffect(() => {
    if (!pendingDrawnFeature && configMode === 'draw-mode') {
      setConfigMode('default');
    }
  }, [pendingDrawnFeature, configMode]);

  const prefOptions = [
    { id: 'green', label: '🌿 Parks & Greenery' },
    { id: 'quiet', label: '🤫 Quiet Streets' },
    { id: 'avoid_steps', label: '🚫 No Stairs' },
  ];

  return (
    <div className="flex flex-col h-full gap-4 p-4 lg:p-5 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div>
        <h1 className="text-xl font-bold tracking-tight mb-0.5 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          Route Configurator
        </h1>
        <p className="text-xs text-slate-500">
          {drawMode || configMode === 'draw-mode'
            ? 'Draw a line or circle on the map' 
            : 'Fine-tune your next run seamlessly.'}
        </p>
      </div>

      <div className="space-y-4 flex-1">
        {/* Route Mode */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Route Type</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onRouteModeChange('loop')}
              disabled={configMode === 'draw-mode'}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                routeMode === 'loop'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
              } ${configMode === 'draw-mode' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Loop / Return
            </button>
            <button
              onClick={() => onRouteModeChange('one-way')}
              disabled={configMode === 'draw-mode'}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                routeMode === 'one-way'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
              } ${configMode === 'draw-mode' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              One-way
            </button>
          </div>
        </div>

        {/* Start Location */}
        <div className={`rounded-lg border border-slate-200 bg-white p-2.5 space-y-0.5 ${
          configMode === 'draw-mode' ? 'opacity-50' : ''
        }`}>
          <Label className="text-sm font-semibold">Start Location</Label>
          <p className="text-xs text-slate-500">
            {locationSource === 'user'
              ? 'Using your current location. Drag pin to adjust.'
              : 'Defaulting to Mission Bay, Auckland. Drag pin to adjust.'}
          </p>
          <p className="text-xs font-medium text-slate-700">
            {`${startPoint[0].toFixed(5)}, ${startPoint[1].toFixed(5)}`}
          </p>
        </div>

        {/* Distance Slider - Hidden in draw mode */}
        {configMode !== 'draw-mode' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Target Distance</Label>
              <span className="text-lg font-bold text-blue-600">{distance[0]} km</span>
            </div>
            <Slider 
              value={distance} 
              max={42.2} 
              min={1} 
              step={0.1} 
              onValueChange={setDistance} 
              className="w-full"
            />
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '3k', val: 3 },
                { label: '5k', val: 5 },
                { label: '10k', val: 10 },
                { label: 'Half', val: 21.1 },
                { label: 'Full', val: 42.2 }
              ].map(d => (
                <button
                  key={d.label}
                  onClick={() => setDistance([d.val])}
                  className={`px-2.5 py-0.5 rounded border text-xs font-medium transition-colors ${
                    distance[0] === d.val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Difficulty / Elevation</Label>
          <Select 
            value={difficulty} 
            onValueChange={setDifficulty}
            disabled={configMode === 'draw-mode'}
          >
            <SelectTrigger className={`h-9 ${configMode === 'draw-mode' ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy (Flat)</SelectItem>
              <SelectItem value="moderate">Moderate (Rolling Hills)</SelectItem>
              <SelectItem value="hard">Hard (Steep Climbs)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preferences */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Route Preferences</Label>
          <div className="flex flex-wrap gap-1.5">
            {prefOptions.map(opt => {
              const isActive = preferences.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => configMode !== 'draw-mode' && togglePreference(opt.id)}
                  disabled={configMode === 'draw-mode'}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${
                    isActive 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                  } ${configMode === 'draw-mode' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 ${configMode === 'draw-mode' ? 'hidden' : ''}`}>
        {!(drawMode || configMode === 'draw-mode') && (
          <>
            <Button
              className="w-full h-10 text-sm flex items-center gap-2 bg-green-600 hover:bg-green-700"
              onClick={handleDrawRoute}
              disabled={isGenerating}
            >
              <Edit3 className="w-4 h-4" />
              Draw Route
            </Button>
            <Button
              className="w-full h-10 text-sm flex items-center gap-2"
              onClick={() =>
                onGenerateRoute({
                  distanceKm: distance[0],
                  difficulty,
                  preferences,
                })
              }
              disabled={isGenerating}
            >
              <Activity className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Generate Route'}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          className="w-full h-9 text-sm flex items-center gap-2"
          onClick={onExportGpx}
          disabled={!canExportGpx}
        >
          <Download className="w-3.5 h-3.5" />
          Export to Garmin (.GPX)
        </Button>
      </div>

    </div>
  );
};
