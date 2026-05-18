import React, { useState, useCallback } from 'react';
import { type BackendTarget, getActiveBackend, setActiveBackend } from '../services/routeApi';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Cloud, Server, ChevronDown, ChevronUp } from 'lucide-react';

interface BackendToggleProps {
  /** Called after the user switches backends, so the parent can react (e.g. re-fetch health). */
  onSwitch?: (backend: BackendTarget) => void;
  className?: string;
}

export const BackendToggle: React.FC<BackendToggleProps> = ({ onSwitch, className = '' }) => {
  const [active, setActive] = useState<BackendTarget>(getActiveBackend);
  const [health, setHealth] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [healthInfo, setHealthInfo] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const handleSwitch = useCallback(
    async (target: BackendTarget) => {
      setActive(target);
      setActiveBackend(target);
      setHealth('idle');
      setHealthInfo('');
      onSwitch?.(target);
    },
    [onSwitch]
  );

  const checkHealth = useCallback(async () => {
    setHealth('loading');
    setHealthInfo('');

    const AZURE_URL = import.meta.env.VITE_API_BASE_URL_DOTNET;
    const AWS_URL   = import.meta.env.VITE_API_BASE_URL;
    const baseUrl   = active === 'azure' ? AZURE_URL : AWS_URL;

    if (!baseUrl) {
      setHealth('error');
      setHealthInfo(`${active === 'azure' ? 'VITE_API_BASE_URL_DOTNET' : 'VITE_API_BASE_URL'} not set`);
      return;
    }

    try {
      const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(8000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setHealth('ok');
      setHealthInfo(data.service ?? data.runtime ?? 'healthy');
    } catch (e) {
      setHealth('error');
      setHealthInfo((e as Error).message ?? 'unreachable');
    }
  }, [active]);

  const isAzure = active === 'azure';
  const hasAzureUrl = !!import.meta.env.VITE_API_BASE_URL_DOTNET;

  return (
    <div className={`flex flex-col gap-2.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-sm transition-all duration-200 ${className}`}>
      
      {/* Clickable Header Row */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full text-left focus:outline-none group select-none"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer">
            Backend Target
          </Label>

          {/* Active target badge */}
          <span className="inline-flex items-center bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all">
            {isAzure ? 'Azure C#/.NET' : 'AWS Node.js'}
          </span>

          {/* Mini health dot */}
          <span className={`w-1.5 h-1.5 rounded-full transition-colors shrink-0 ${
            health === 'ok' ? 'bg-emerald-500' :
            health === 'error' ? 'bg-rose-500' :
            health === 'loading' ? 'bg-blue-500 animate-pulse' :
            'bg-slate-300'
          }`} title={health === 'ok' ? 'Online' : health === 'error' ? 'Offline' : 'Unchecked'} />
        </div>

        {/* Chevron Expand Indicator */}
        <div className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Panel */}
      {!isCollapsed && (
        <div className="flex flex-col gap-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Grid of Toggle Targets */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="backend-aws-btn"
              onClick={() => handleSwitch('aws')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all duration-200 ${
                !isAzure
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-blue-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
              }`}
              title="Node.js · AWS Lambda · API Gateway"
            >
              <Cloud className="w-4 h-4 mb-1" />
              <span className="text-xs font-bold leading-none">AWS</span>
              <span className={`text-[9px] leading-none mt-1 opacity-80 ${!isAzure ? 'text-blue-100' : 'text-slate-400'}`}>Node.js</span>
            </button>

            <button
              id="backend-azure-btn"
              disabled={!hasAzureUrl}
              onClick={() => hasAzureUrl && handleSwitch('azure')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all duration-200 ${
                isAzure
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-blue-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
              } ${!hasAzureUrl ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
              title={hasAzureUrl ? 'C# .NET 8 · Azure Functions' : 'Set VITE_API_BASE_URL_DOTNET in .env to enable'}
            >
              <Server className="w-4 h-4 mb-1" />
              <span className="text-xs font-bold leading-none">Azure</span>
              <span className={`text-[9px] leading-none mt-1 opacity-80 ${isAzure ? 'text-blue-100' : 'text-slate-400'}`}>C# .NET</span>
            </button>
          </div>

          {/* Action Check button */}
          <Button
            id="backend-health-check-btn"
            variant="outline"
            className="w-full h-8 text-xs font-semibold border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={checkHealth}
            disabled={health === 'loading'}
          >
            {health === 'loading' ? 'Checking…' : 'Check Server Health'}
          </Button>

          {/* Info Message Box */}
          {healthInfo && (
            <div className={`p-2 rounded-md border text-[11px] leading-snug font-mono transition-all ${
              health === 'ok' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
            }`}>
              {health === 'ok' ? `✓ ${healthInfo}` : `✗ ${healthInfo}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
