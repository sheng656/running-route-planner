import React, { useState } from 'react';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, Navigation, Activity } from 'lucide-react';

type RouteMode = 'loop' | 'one-way';
type LocationSource = 'user' | 'mission-bay';

interface RouteConfiguratorProps {
  routeMode: RouteMode;
  onRouteModeChange: (mode: RouteMode) => void;
  locationSource: LocationSource;
  startPoint: [number, number];
  canExportGpx: boolean;
  onGenerateRoute: (payload: {
    distanceKm: number;
    difficulty: 'easy' | 'moderate' | 'hard';
    preferences: string[];
  }) => void;
  onExportGpx: () => void;
  isGenerating: boolean;
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
}) => {
  const [distance, setDistance] = useState<number[]>([5]);
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard'>('moderate');
  const [preferences, setPreferences] = useState<string[]>(["green"]);

  const togglePreference = (pref: string) => {
    setPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const prefOptions = [
    { id: 'green', label: '🌿 Parks & Greenery', desc: 'Prefer paths through parks, gardens and green areas' },
    { id: 'quiet', label: '🤫 Quiet Streets', desc: 'Avoid busy roads, prefer calm residential areas' },
    { id: 'avoid_steps', label: '🚫 No Stairs', desc: 'Avoid routes with steps or staircases' },
    { id: 'avoid_fords', label: '💧 No Water Crossings', desc: 'Avoid paths crossing streams or fords' },
  ];

  return (
    <div className="flex flex-col h-full gap-8 p-6 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Navigation className="w-6 h-6 text-blue-600" />
          Route Configurator
        </h1>
        <p className="text-sm text-slate-500">Fine-tune your next run seamlessly.</p>
      </div>

      <div className="space-y-6 flex-1">
        {/* Route Mode */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Route Type</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onRouteModeChange('loop')}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                routeMode === 'loop'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
              }`}
            >
              Loop / Return
            </button>
            <button
              onClick={() => onRouteModeChange('one-way')}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                routeMode === 'one-way'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
              }`}
            >
              One-way
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Default is Loop/Return, where start and end are the same location.
          </p>
        </div>

        {/* Start Location */}
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <Label className="text-base font-semibold">Start Location</Label>
          <p className="text-xs text-slate-600">
            {locationSource === 'user'
              ? 'Using your current location as the default start point.'
              : 'Location permission unavailable. Defaulting to Mission Bay, Auckland.'}
          </p>
          <p className="text-xs text-slate-500">
            Drag the pin on the map to move the start point.
          </p>
          <p className="text-xs font-medium text-slate-700">
            {`Lng ${startPoint[0].toFixed(5)}, Lat ${startPoint[1].toFixed(5)}`}
          </p>
        </div>

        {/* Distance Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Target Distance</Label>
            <span className="text-xl font-bold text-blue-600">{distance[0]} km</span>
          </div>
          <Slider 
            value={distance} 
            max={42.2} 
            min={1} 
            step={0.1} 
            onValueChange={setDistance} 
            className="w-full"
          />
          <div className="flex flex-wrap gap-2 mt-2">
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
                className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${
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

        {/* Difficulty */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Difficulty / Elevation</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger>
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
        <div className="space-y-3">
          <Label className="text-base font-semibold">Route Preferences</Label>
          <p className="text-xs text-slate-500">These options directly influence how routes are generated.</p>
          <div className="grid grid-cols-1 gap-2">
            {prefOptions.map(opt => {
              const isActive = preferences.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => togglePreference(opt.id)}
                  className={`flex flex-col items-start px-3 py-2.5 text-sm rounded-xl transition-all border ${
                    isActive 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:shadow-sm'
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className={`text-xs mt-0.5 ${
                    isActive ? 'text-blue-100' : 'text-slate-400'
                  }`}>{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Button Area */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <Button
          className="w-full h-12 text-lg flex items-center gap-2"
          onClick={() =>
            onGenerateRoute({
              distanceKm: distance[0],
              difficulty,
              preferences,
            })
          }
          disabled={isGenerating}
        >
          <Activity className="w-5 h-5" />
          {isGenerating ? 'Generating...' : 'Generate Route'}
        </Button>
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={onExportGpx}
          disabled={!canExportGpx}
        >
          <Download className="w-4 h-4" />
          Export to Garmin (.GPX)
        </Button>
        <p className="text-xs text-center text-slate-500">
          Sync with your Garmin Connect app seamlessly.
        </p>
      </div>
    </div>
  );
};
