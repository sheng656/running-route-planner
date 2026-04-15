import React from 'react';

export const Slider = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { value: number[], onValueChange: (val: number[]) => void }>(
  ({ value, onValueChange, className = '', max = 100, min = 0, step = 1, ...props }, ref) => {
    return (
      <div className={`relative flex w-full touch-none select-none items-center ${className}`}>
        <input 
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onValueChange([parseFloat(e.target.value)])}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:accent-blue-600"
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = 'Slider';
