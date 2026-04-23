import { useEffect, useState } from 'react';
import { RouteConfigurator } from './components/RouteConfigurator';
import { MapView } from './components/MapView';
import { ElevationChart } from './components/ElevationChart';
import { AreaChart, TrendingUp, Map as MapIcon, Star, Settings2, X } from 'lucide-react';
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
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(true);

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
      setIsMobileSettingsOpen(false);
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
    <div className="h-[100dvh] w-full flex overflow-hidden bg-white text-slate-900 font-sans relative">
      
      {/* Sidebar / Bottom Sheet Configurator */}
      <aside 
        className={`
          absolute md:static bottom-0 left-0 w-full md:w-[350px] lg:w-[400px] 
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl md:bg-white md:backdrop-blur-none
          border-t md:border-t-0 md:border-r border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none
          transition-transform duration-300 ease-in-out z-40
          flex flex-col
          ${isMobileSettingsOpen ? 'translate-y-0' : 'translate-y-[100%] md:translate-y-0'}
          h-[85dvh] md:h-full rounded-t-3xl md:rounded-none
        `}
      >
        {/* Mobile drag handle / close button */}
        <div 
          className="md:hidden flex items-center justify-between px-6 py-4 cursor-pointer border-b border-slate-100"
          onClick={() => setIsMobileSettingsOpen(false)}
        >
           <h3 className="font-semibold text-slate-800">Route Settings</h3>
           <button className="p-1 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition">
             <X className="w-5 h-5" />
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
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
        </div>
      </aside>

      {/* Main Content Area (Map) */}
      <main className="flex-1 h-full relative z-0">
        
        {/* The Map */}
        <div className="absolute inset-0 bg-slate-50 pointer-events-auto">
          <MapView
            activePointIndex={activePointIndex}
            routeMode={routeMode}
            startPoint={startPoint}
            onStartPointChange={setStartPoint}
            routePoints={routePoints}
          />
        </div>

        {/* Top Info Banner (Route Stats) */}
        <div className="absolute top-4 left-4 right-4 z-10 bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-4 border border-slate-100 flex flex-col pointer-events-auto max-w-2xl mx-auto md:mx-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-blue-600" />
            {routeStats?.name ?? 'No route generated yet'}
          </h2>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600 mt-2">
            <span className="flex items-center gap-1 font-medium text-slate-800"><TrendingUp className="w-4 h-4" /> {routeStats?.distance ?? '-'} km</span>
            <span className="flex items-center gap-1">⌚ {routeStats?.durationRange ?? '-'}</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
               {Array.from({ length: routeStats?.scenicRating ?? 0 }).map((_, i) => (
                 <Star key={i} className="w-3 h-3 fill-emerald-500 text-emerald-500" />
               ))}
               {routeStats ? 'Scenic' : 'Generate to score'}
            </span>
          </div>
          {apiMessage && <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100">{apiMessage}</p>}
        </div>

        {/* Floating Bottom Elements */}
        <div className="absolute bottom-6 left-4 right-4 z-10 flex flex-col gap-4 pointer-events-none md:left-auto md:w-[450px]">
          
          {/* Elevation Profile & Summary (Floating Panel) */}
          <div className={`bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-4 border border-slate-100 pointer-events-auto transition-all ${isMobileSettingsOpen ? 'opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'opacity-100'}`}>
            <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <AreaChart className="w-4 h-4 text-blue-600" /> 
                Elevation Profile
              </h3>
              <div className="flex gap-2 text-xs font-medium text-slate-500">
                <span className="bg-slate-100 px-2 py-1 rounded-md">Max: {routeStats?.maxElevation ?? '-'}m</span>
                <span className="bg-slate-100 px-2 py-1 rounded-md">Ascent: {routeStats?.totalAscent ?? '-'}m</span>
              </div>
            </div>
            
            <div className="h-24 md:h-32 -mx-2">
              <ElevationChart onHoverPoint={setActivePointIndex} routePoints={routePoints} />
            </div>
            
            {/* Scenic Review */}
            {routeStats?.scenicSummary && (
              <div className="mt-3 text-xs text-slate-600 italic">
                <p className="bg-blue-50/50 border border-blue-100/50 p-2 rounded-lg leading-relaxed">
                  {routeStats.scenicSummary}
                </p>
              </div>
            )}
          </div>

          {/* Mobile "Open Settings" Button (visible when closed) */}
          <div className="md:hidden flex justify-center pointer-events-auto">
             <button 
               onClick={() => setIsMobileSettingsOpen(true)}
               className={`
                 flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-full font-semibold shadow-lg shadow-blue-600/30
                 transition-all duration-300 transform border border-blue-500
                 ${isMobileSettingsOpen ? 'scale-0 opacity-0 translate-y-10' : 'scale-100 opacity-100 translate-y-0'}
               `}
             >
               <Settings2 className="w-5 h-5" />
               Configure Route
             </button>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;

