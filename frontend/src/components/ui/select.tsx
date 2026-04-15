import React from "react";

export const Select = ({ value, onValueChange, children }: any) => {
  return (
    <div className="relative w-full">
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === SelectContent) {
          // Pass the state mapping
          return React.cloneElement(child as React.ReactElement<any>, {
            value,
            onChange: (e: any) => onValueChange(e.target.value)
          });
        }
        return null;
      })}
    </div>
  )
};

export const SelectTrigger = ({ children }: any) => <>{children}</>; // Dummy since we use native
export const SelectValue = ({ placeholder }: any) => <>{placeholder}</>; // Dummy

export const SelectContent = ({ children, value, onChange }: any) => (
  <select
    value={value}
    onChange={onChange}
    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {children}
  </select>
);

export const SelectItem = ({ value, children }: any) => (
  <option value={value}>{children}</option>
);
