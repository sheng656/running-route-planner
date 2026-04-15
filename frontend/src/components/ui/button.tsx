import React from 'react';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' }>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2";
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
      outline: "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900"
    };
    return (
      <button ref={ref} className={`${baseStyle} ${variants[variant]} ${className}`} {...props} />
    );
  }
);
Button.displayName = 'Button';
