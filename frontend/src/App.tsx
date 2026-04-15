import { useState } from 'react';
import { RouteConfigurator } from './components/RouteConfigurator';
import { MapView } from './components/MapView';
import { ElevationChart } from './components/ElevationChart';
import { AreaChart, TrendingUp, Map as MapIcon, Star } from 'lucide-react';
import { MOCK_STATS } from './data/mockRoute';

function App() {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-white text-slate-900 font-sans">
      {/* Sidebar: Configurator */}
      <aside className="w-full md:w-[350px] lg:w-[400px] h-full overflow-y-auto shrink-0 transition-all border-r border-slate-200">
        <RouteConfigurator />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Top Info Banner (Route Stats) */}
        <div className="absolute top-4 left-4 right-4 z-10 bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-4 border border-slate-100 flex items-center justify-between pointer-events-auto max-w-2xl mx-auto">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-blue-600" />
              {MOCK_STATS.name}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-1">
              <span className="flex items-center gap-1 font-medium text-slate-800"><TrendingUp className="w-4 h-4" /> {MOCK_STATS.distance} km</span>
              <span className="flex items-center gap-1">⌚ {MOCK_STATS.durationRange}</span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                 {Array.from({ length: MOCK_STATS.scenicRating }).map((_, i) => (
                   <Star key={i} className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                 ))}
                 Scenic
              </span>
            </div>
          </div>
        </div>

        {/* The Map */}
        <div className="flex-1 bg-slate-50 relative pointer-events-auto overflow-hidden shadow-inner">
          <MapView activePointIndex={activePointIndex} />
        </div>

        {/* Bottom Elevation Profile */}
        <div className="bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative pointer-events-auto shrink-0 z-10 p-4">
          <div className="flex justify-between items-center mb-2 px-2">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <AreaChart className="w-4 h-4 text-blue-600" /> 
              Elevation Profile
            </h3>
            <div className="flex gap-4 text-xs font-medium text-slate-500">
              <span className="bg-slate-100 px-2 py-1 rounded">Max: {MOCK_STATS.maxElevation}m</span>
              <span className="bg-slate-100 px-2 py-1 rounded">Ascent: {MOCK_STATS.totalAscent}m</span>
            </div>
          </div>
          
          <ElevationChart onHoverPoint={setActivePointIndex} />
          
          {/* Scenic Review */}
          <div className="mt-2 text-xs text-slate-600 italic px-2">
            <p className="bg-slate-50 border border-slate-100 p-2.5 rounded-md leading-relaxed">
              "全程 70% 覆盖海景。在 Tamaki Drive 赛段，你可以远眺 Rangitoto 岛。清晨跑步还能避开游客，非常安静。"
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

