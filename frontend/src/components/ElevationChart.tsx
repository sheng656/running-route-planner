import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_ROUTE } from '../data/mockRoute';

interface Props {
  onHoverPoint: (index: number | null) => void;
}

export const ElevationChart: React.FC<Props> = ({ onHoverPoint }) => {
  return (
    <div className="w-full h-40 p-2 flex items-stretch">
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart
          data={MOCK_ROUTE}
          onMouseMove={(data: any) => {
            if (data && data.activeTooltipIndex !== undefined && data.activeTooltipIndex !== null) {
              onHoverPoint(Number(data.activeTooltipIndex));
            }
          }}
          onMouseLeave={() => onHoverPoint(null)}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorElevation" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="distance" 
            tickFormatter={(val: any) => `${(val / 1000).toFixed(1)} km`}
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            dataKey="elevation" 
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            content={({ active, payload }: any) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-2 rounded shadow-lg border border-slate-100 text-sm">
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
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
