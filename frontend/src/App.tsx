import { useEffect, useState } from 'react';
import { RouteConfigurator } from './components/RouteConfigurator';
import { MapView } from './components/MapView';
import { ElevationChart } from './components/ElevationChart';
import { AreaChart, TrendingUp, Map as MapIcon, Star } from 'lucide-react';
import { MISSION_BAY_COORDINATES, type RoutePoint } from './data/mockRoute';
import { exportRouteToGpx, generateRoute } from './services/routeApi';

type RouteMode = 'loop' | 'one-way';
type LocationSource = 'user' | 'mission-bay';
type RouteStats = {
  name: string;
  scenicSummary: string;
  distance: number;
  durationRange: string;
  maxElevation: number;
  totalAscent: number;
  scenicRating: number;
};

function App() {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>('loop');
  const [startPoint, setStartPoint] = useState<[number, number]>(MISSION_BAY_COORDINATES);
  const [locationSource, setLocationSource] = useState<LocationSource>('mission-bay');
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStartPoint([position.coords.longitude, position.coords.latitude]);
        setLocationSource('user');
      },
      () => {
        setStartPoint(MISSION_BAY_COORDINATES);
        setLocationSource('mission-bay');
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  }, []);

  const handleGenerateRoute = async (payload: {
    distanceKm: number;
    difficulty: 'easy' | 'moderate' | 'hard';
    preferences: string[];
  }) => {
    setIsGenerating(true);
    setApiMessage(null);

    try {
      const generated = await generateRoute({
        startPoint,
        distanceKm: payload.distanceKm,
        routeMode,
        difficulty: payload.difficulty,
        preferences: payload.preferences,
      });

      setRoutePoints(generated.points);
      setRouteStats({
        name: generated.name,
        scenicSummary: generated.scenicSummary,
        distance: generated.distance,
        durationRange: generated.durationRange,
        maxElevation: generated.maxElevation,
        totalAscent: generated.totalAscent,
        scenicRating: generated.scenicRating,
      });
      setApiMessage('Route generated from AWS backend.');
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : 'Route generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportGpx = async () => {
    if (!routeStats || routePoints.length < 2) {
      setApiMessage('Generate a route first before exporting GPX.');
      return;
    }

    setApiMessage(null);
    try {
      const blob = await exportRouteToGpx(routeStats.name, routePoints);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${routeStats.name.toLowerCase().replace(/\s+/g, '-')}.gpx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setApiMessage('GPX exported successfully.');
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : 'GPX export failed.');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-white text-slate-900 font-sans">
      {/* Sidebar: Configurator */}
      <aside className="w-full md:w-[350px] lg:w-[400px] h-full overflow-y-auto shrink-0 transition-all border-r border-slate-200">
        <RouteConfigurator
          routeMode={routeMode}
          onRouteModeChange={setRouteMode}
          locationSource={locationSource}
          startPoint={startPoint}
          canExportGpx={routePoints.length > 1 && !!routeStats}
          onGenerateRoute={handleGenerateRoute}
          onExportGpx={handleExportGpx}
          isGenerating={isGenerating}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Top Info Banner (Route Stats) */}
        <div className="absolute top-4 left-4 right-4 z-10 bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-4 border border-slate-100 flex items-center justify-between pointer-events-auto max-w-2xl mx-auto">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-blue-600" />
              {routeStats?.name ?? 'No route generated yet'}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-1">
              <span className="flex items-center gap-1 font-medium text-slate-800"><TrendingUp className="w-4 h-4" /> {routeStats?.distance ?? '-'} km</span>
              <span className="flex items-center gap-1">⌚ {routeStats?.durationRange ?? '-'}</span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                 {Array.from({ length: routeStats?.scenicRating ?? 0 }).map((_, i) => (
                   <Star key={i} className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                 ))}
                 {routeStats ? 'Scenic' : 'Generate to score'}
              </span>
            </div>
            {apiMessage && <p className="mt-1 text-xs text-slate-500">{apiMessage}</p>}
          </div>
        </div>

        {/* The Map */}
        <div className="flex-1 bg-slate-50 relative pointer-events-auto overflow-hidden shadow-inner">
          <MapView
            activePointIndex={activePointIndex}
            routeMode={routeMode}
            startPoint={startPoint}
            onStartPointChange={setStartPoint}
            routePoints={routePoints}
          />
        </div>

        {/* Bottom Elevation Profile */}
        <div className="bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative pointer-events-auto shrink-0 z-10 p-4">
          <div className="flex justify-between items-center mb-2 px-2">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <AreaChart className="w-4 h-4 text-blue-600" /> 
              Elevation Profile
            </h3>
            <div className="flex gap-4 text-xs font-medium text-slate-500">
              <span className="bg-slate-100 px-2 py-1 rounded">Max: {routeStats?.maxElevation ?? '-'}m</span>
              <span className="bg-slate-100 px-2 py-1 rounded">Ascent: {routeStats?.totalAscent ?? '-'}m</span>
            </div>
          </div>
          
          <ElevationChart onHoverPoint={setActivePointIndex} routePoints={routePoints} />
          
          {/* Scenic Review */}
          <div className="mt-2 text-xs text-slate-600 italic px-2">
            <p className="bg-slate-50 border border-slate-100 p-2.5 rounded-md leading-relaxed">
              {routeStats?.scenicSummary ?? 'Generate a route to see a route-specific scenic summary.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

