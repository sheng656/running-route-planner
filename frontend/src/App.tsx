import { useEffect, useRef, useState } from 'react';
import { RouteConfigurator } from './components/RouteConfigurator';
import { MapView } from './components/MapView';
import type { DrawnFeature, MapViewHandle } from './components/MapView';
import type { ConfirmDrawingPayload } from './components/RouteConfigurator';
import { ElevationChart } from './components/ElevationChart';
import { AreaChart, TrendingUp, Map as MapIcon, Star, Settings2, X, Trash2 } from 'lucide-react';
import { MISSION_BAY_COORDINATES, type RoutePoint } from './data/mockRoute';
import { exportRouteToGpx, generateRoute } from './services/routeApi';
import { Button } from './components/ui/button';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { formatDistance } from './utils/routeUtils';

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

type ConfirmDialogState = {
  isOpen: boolean;
  payload: ConfirmDrawingPayload | null;
  difficulty: 'easy' | 'moderate' | 'hard';
  preferences: string[];
};

function App() {
  const mapViewRef = useRef<MapViewHandle>(null);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>('loop');
  const [drawMode, setDrawMode] = useState(false);
  const [pendingDrawnFeature, setPendingDrawnFeature] = useState<DrawnFeature | null>(null);
  const [startPoint, setStartPoint] = useState<[number, number]>(MISSION_BAY_COORDINATES);
  const [locationSource, setLocationSource] = useState<LocationSource>('mission-bay');
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    payload: null,
    difficulty: 'moderate',
    preferences: ['green'],
  });

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
    distanceKm?: number;
    difficulty: 'easy' | 'moderate' | 'hard';
    preferences: string[];
    guidingWaypoints?: [number, number][];
    drawMode?: boolean;
  }) => {
    setIsGenerating(true);
    setApiMessage(null);

    try {
      const generated = await generateRoute({
        startPoint: payload.guidingWaypoints ? payload.guidingWaypoints[0] : startPoint,
        distanceKm: payload.distanceKm || 5,
        routeMode,
        difficulty: payload.difficulty,
        preferences: payload.preferences,
        guidingWaypoints: payload.guidingWaypoints,
        drawMode: payload.drawMode,
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
      setApiMessage(payload.drawMode ? 'Route generated from drawing.' : 'Route generated from AWS backend.');
      setIsMobileSettingsOpen(false);
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : 'Route generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRequestConfirm = (payload: ConfirmDrawingPayload) => {
    setConfirmDialog({
      isOpen: true,
      payload,
      difficulty: 'moderate',
      preferences: ['green'],
    });
  };

  const handleConfirmGenerate = () => {
    if (!confirmDialog.payload) return;

    handleGenerateRoute({
      difficulty: confirmDialog.difficulty,
      preferences: confirmDialog.preferences,
      guidingWaypoints: confirmDialog.payload.waypoints,
      drawMode: true,
    });

    // Reset all draw state
    setDrawMode(false);
    setPendingDrawnFeature(null);
    mapViewRef.current?.clearDrawing();
    setConfirmDialog({ isOpen: false, payload: null, difficulty: 'moderate', preferences: ['green'] });
  };

  const handleRedraw = () => {
    // Close dialog, keep drawMode active so user can redraw
    setConfirmDialog({ isOpen: false, payload: null, difficulty: 'moderate', preferences: ['green'] });
    setPendingDrawnFeature(null);
    mapViewRef.current?.clearDrawing();
    mapViewRef.current?.enableDrawMode();
  };

  const toggleConfirmPreference = (pref: string) => {
    setConfirmDialog(prev => ({
      ...prev,
      preferences: prev.preferences.includes(pref)
        ? prev.preferences.filter(p => p !== pref)
        : [...prev.preferences, pref],
    }));
  };

  const prefOptions = [
    { id: 'green', label: '🌿 Parks & Greenery' },
    { id: 'quiet', label: '🤫 Quiet Streets' },
    { id: 'avoid_steps', label: '🚫 No Stairs' },
  ];

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
          ${isMobileSettingsOpen && !drawMode ? 'translate-y-0' : 'translate-y-[100%] md:translate-y-0'}
          h-[70dvh] md:h-full rounded-t-3xl md:rounded-none
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
            drawMode={drawMode}
            onDrawModeChange={setDrawMode}
            pendingDrawnFeature={pendingDrawnFeature}
            onClearPendingDrawnFeature={() => setPendingDrawnFeature(null)}
            onRequestConfirm={handleRequestConfirm}
            locationSource={locationSource}
            startPoint={startPoint}
            canExportGpx={routePoints.length > 1 && !!routeStats}
            onGenerateRoute={handleGenerateRoute}
            onExportGpx={handleExportGpx}
            isGenerating={isGenerating}
            mapViewRef={mapViewRef}
          />
        </div>
      </aside>

      {/* Main Content Area (Map) */}
      <main className="flex-1 h-full relative z-0">
        
        {/* The Map */}
        <div className="absolute inset-0 bg-slate-50 pointer-events-auto">
          <MapView
            ref={mapViewRef}
            activePointIndex={activePointIndex}
            routeMode={routeMode}
            startPoint={startPoint}
            onStartPointChange={setStartPoint}
            routePoints={routePoints}
            drawMode={drawMode}
            onDrawingComplete={(feature) => setPendingDrawnFeature(feature)}
          />
        </div>

        {/* Top Info Banner (Route Stats) */}
        <div className={`absolute top-4 left-4 right-4 z-10 bg-white/60 backdrop-blur-xl shadow-lg shadow-black/5 rounded-2xl p-4 border border-white/40 flex flex-col pointer-events-auto max-w-2xl mx-auto md:mx-4 ${drawMode ? 'hidden md:flex' : 'flex'}`}>
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

        {/* Mobile: Draw mode compact top banner — direct child of main so absolute positioning works */}
        {drawMode && (
          <div className="md:hidden absolute top-4 left-4 right-4 z-20 bg-emerald-600/95 backdrop-blur-md rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 shadow-lg shadow-emerald-900/20 pointer-events-auto">
            <p className="text-xs font-medium text-white flex-1 min-w-0">
              ✏️ Tap map to add points · Double-tap to finish
            </p>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => {
                  mapViewRef.current?.disableDrawMode();
                  const feature = mapViewRef.current?.getDrawnFeatures();
                  if (feature && feature.coordinates.length > 1) {
                    setPendingDrawnFeature(feature);
                  } else {
                    setApiMessage('Please draw at least 2 points.');
                  }
                }}
                className="px-3 py-1 text-xs font-semibold bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                Finish
              </button>
              <button
                onClick={() => {
                  mapViewRef.current?.clearDrawing();
                  mapViewRef.current?.disableDrawMode();
                  setDrawMode(false);
                  setPendingDrawnFeature(null);
                }}
                className="px-2 py-1 text-xs font-semibold bg-emerald-700/60 text-white rounded-lg hover:bg-emerald-800/80 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Bottom Elements */}
        <div className="absolute bottom-6 left-4 right-4 z-10 flex flex-col gap-3 pointer-events-none md:left-auto md:w-[450px]">
          
          {/* Desktop: Draw Instructions bottom floating panel */}
          {drawMode && (
            <div className="hidden md:block">
                <div className="bg-white/90 backdrop-blur-xl shadow-lg shadow-black/10 rounded-2xl p-4 border border-white/50 pointer-events-auto space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Drawing Route</p>
                    <ul className="text-xs text-slate-600 mt-1 list-disc ml-4 space-y-0.5">
                      <li>Click map to add points.</li>
                      <li><strong>Double-click</strong> to finish, OR click Finish below.</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        mapViewRef.current?.disableDrawMode();
                        const feature = mapViewRef.current?.getDrawnFeatures();
                        if (feature && feature.coordinates.length > 1) {
                          setPendingDrawnFeature(feature);
                        } else {
                          setApiMessage('Please draw at least 2 points.');
                        }
                      }}
                      className="flex-1 h-8 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-700 rounded-lg transition-colors flex items-center justify-center"
                    >
                      Finish
                    </button>
                    <button
                      onClick={() => {
                        mapViewRef.current?.clearDrawing();
                        mapViewRef.current?.disableDrawMode();
                        setDrawMode(false);
                        setPendingDrawnFeature(null);
                      }}
                      className="flex-1 h-8 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                </div>
            </div>
          )}
          
          {/* Elevation Profile & Summary (Floating Panel) */}
          <div className={`bg-white/60 backdrop-blur-xl shadow-lg shadow-black/5 rounded-2xl p-3 border border-white/40 transition-all ${isMobileSettingsOpen || drawMode ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100 pointer-events-auto'}`}>
            <div className="flex justify-between items-center mb-1 px-1">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <AreaChart className="w-4 h-4 text-blue-600" /> 
                Elevation
              </h3>
              <div className="flex gap-1.5 text-[10px] font-medium text-slate-500">
                <span className="bg-white/60 px-1.5 py-0.5 rounded">Peak: {routeStats?.maxElevation ?? '-'}m</span>
                <span className="bg-white/60 px-1.5 py-0.5 rounded">↑{routeStats?.totalAscent ?? '-'}m</span>
              </div>
            </div>
            
            <div className="h-28 md:h-36">
              <ElevationChart onHoverPoint={setActivePointIndex} routePoints={routePoints} />
            </div>
            
            {/* Scenic Review */}
            {routeStats?.scenicSummary && (
              <p className="mt-2 text-[11px] text-slate-500 leading-relaxed px-1 line-clamp-2">
                {routeStats.scenicSummary}
              </p>
            )}
          </div>

          {/* Mobile "Open Settings" Button (visible when closed) */}
          <div className="md:hidden flex flex-col items-center gap-2 pointer-events-auto">
             {!routeStats && !isMobileSettingsOpen && (
               <p className="text-xs text-slate-500 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/40 shadow-sm">
                 📍 Drag the pin to set your start point
               </p>
             )}
             <button 
               onClick={() => setIsMobileSettingsOpen(true)}
               className={`
                 flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-blue-600/30
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

      {/* ── Confirm Drawing Modal (rendered at top level, outside <aside> transform) ── */}
      {confirmDialog.isOpen && confirmDialog.payload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm space-y-4 p-5 overflow-y-auto max-h-[90dvh]">
            {/* Header */}
            <div>
              <h2 className="text-base font-bold text-slate-900">Confirm Drawing</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                We detected a {confirmDialog.payload.detectedMode === 'loop' ? 'loop' : 'one-way'} route
              </p>
            </div>

            {/* Stats */}
            <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-sm border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Route Type</span>
                <span className="font-semibold">
                  {confirmDialog.payload.detectedMode === 'loop' ? '🔄 Loop' : '➡️ One-way'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Points</span>
                <span className="font-semibold">{confirmDialog.payload.feature.coordinates.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Est. Distance</span>
                <span className="font-semibold">{formatDistance(confirmDialog.payload.estimatedDistance)}</span>
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Difficulty</Label>
              <Select
                value={confirmDialog.difficulty}
                onValueChange={(v) => setConfirmDialog(prev => ({ ...prev, difficulty: v as 'easy' | 'moderate' | 'hard' }))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
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
              <Label className="text-sm font-semibold">Preferences</Label>
              <div className="flex flex-wrap gap-1.5">
                {prefOptions.map(opt => {
                  const isActive = confirmDialog.preferences.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleConfirmPreference(opt.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 h-10" onClick={handleRedraw}>
                Redraw
              </Button>
              <Button className="flex-1 h-10" onClick={handleConfirmGenerate} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Route'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

