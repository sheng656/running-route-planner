import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { RoutePoint } from '../data/mockRoute';

interface Props {
  onHoverPoint: (index: number | null) => void;
  routePoints: RoutePoint[];
}

export const ElevationChart: React.FC<Props> = ({ onHoverPoint, routePoints }) => {
  if (routePoints.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
        Generate a route to view elevation profile.
      </div>
    );
  }

  // Reduce tick count to avoid label overlap on small containers
  const maxDistance = routePoints[routePoints.length - 1]?.distance ?? 0;
  const tickCount = maxDistance > 20000 ? 5 : maxDistance > 8000 ? 4 : 3;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={routePoints}
          onMouseMove={(data: any) => {
            if (data && data.activeTooltipIndex !== undefined && data.activeTooltipIndex !== null) {
              onHoverPoint(Number(data.activeTooltipIndex));
            }
          }}
          onMouseLeave={() => onHoverPoint(null)}
          margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorElevation" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="distance" 
            tickFormatter={(val: any) => `${(val / 1000).toFixed(1)}`}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickCount={tickCount}
            interval="preserveStartEnd"
          />
          <YAxis 
            dataKey="elevation" 
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={32}
            tickCount={3}
          />
          <Tooltip 
            content={({ active, payload }: any) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg border border-slate-100 text-xs">
                    <p className="font-semibold">{`${(data.distance / 1000).toFixed(1)} km`}</p>
                    <p className="text-blue-600">Elev: {data.elevation}m</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="elevation" 
            stroke="#2563eb" 
            fillOpacity={1} 
            fill="url(#colorElevation)" 
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
