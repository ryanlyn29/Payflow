
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { useAuth } from './AuthContext';

export const Card: React.FC<{ 
  title?: string; 
  children: React.ReactNode; 
  className?: string; 
  actions?: React.ReactNode;
  onClick?: () => void;
}> = ({ title, children, className = '', actions, onClick }) => {
  const { user } = useAuth();
  const isCompact = user?.preferences.density === 'compact';
  
  return (
    <div 
      onClick={onClick}
      className={`bg-enterprise-surface-light dark:bg-enterprise-surface-dark border border-enterprise-border-light dark:border-enterprise-border-dark rounded-lg overflow-hidden flex flex-col transition-all ${onClick ? 'cursor-pointer active:scale-[0.99] hover:border-brand-500/50' : ''} ${className}`}
    >
      {(title || actions) && (
        <div className={`${isCompact ? 'px-3 py-2' : 'px-5 py-4'} border-b border-enterprise-border-light dark:border-enterprise-border-dark flex items-center justify-between shrink-0`}>
          {title && <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`flex-1 overflow-auto ${isCompact ? 'p-3' : 'p-5'}`}>
        {children}
      </div>
    </div>
  );
};

export const Button: React.FC<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}> = ({ variant = 'primary', size = 'md', children, onClick, className = '', disabled, type = 'button' }) => {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-95";
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
    secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    ghost: "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
  };
  const sizes = {
    sm: "px-2.5 py-1.5 text-[11px] uppercase tracking-widest font-bold",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

export const Badge: React.FC<{ 
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'; 
  children: React.ReactNode 
}> = ({ variant = 'neutral', children }) => {
  const styles = {
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    error: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    info: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${styles[variant]}`}>
      {children}
    </span>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ isOpen, onClose, title, children, actions, size = 'md' }) => {
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-enterprise-surface-light dark:bg-enterprise-surface-dark border border-enterprise-border-light dark:border-enterprise-border-dark rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}>
        <div className="p-6 border-b border-enterprise-border-light dark:border-enterprise-border-dark flex justify-between items-center shrink-0">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <Icons.X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        {actions && (
          <div className="p-6 border-t border-enterprise-border-light dark:border-enterprise-border-dark flex justify-end gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export const Dropdown: React.FC<{
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}> = ({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">{trigger}</div>
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className={`absolute top-full mt-2 w-56 bg-enterprise-surface-light dark:bg-enterprise-surface-dark border border-enterprise-border-light dark:border-enterprise-border-dark rounded-md shadow-xl z-[100] py-1 animate-in fade-in slide-in-from-top-2 duration-150 ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const DropdownItem: React.FC<{
  children: React.ReactNode;
  icon?: any;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
}> = ({ children, icon: Icon, onClick, className = '', danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-left transition-colors uppercase tracking-wider ${
      danger 
        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20' 
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    } ${className}`}
  >
    {Icon && <Icon size={14} className="shrink-0" />}
    <span className="flex-1">{children}</span>
  </button>
);

export const DataTable: React.FC<{
  columns: { key: string; header: string; render?: (val: any, row: any) => React.ReactNode }[];
  data: any[];
  onRowClick?: (row: any) => void;
  isLoading?: boolean;
}> = ({ columns, data, onRowClick, isLoading }) => {
  const { user } = useAuth();
  const isCompact = user?.preferences.density === 'compact';

  return (
    <div className="w-full overflow-x-auto border border-enterprise-border-light dark:border-enterprise-border-dark rounded-lg">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-enterprise-border-light dark:border-enterprise-border-dark">
          <tr>
            {columns.map(col => (
              <th key={col.key} className={`${isCompact ? 'px-3 py-2' : 'px-4 py-3'} font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]`}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-enterprise-border-light dark:divide-enterprise-border-dark bg-enterprise-surface-light dark:bg-enterprise-surface-dark">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                 <div className="animate-pulse flex flex-col items-center gap-3">
                    <Icons.Refresh size={24} className="animate-spin text-brand-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Synchronizing records...</span>
                 </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">No records found.</td>
            </tr>
          ) : data.map((row, i) => (
            <tr 
              key={i} 
              className={`transition-all ${onRowClick ? 'cursor-pointer hover:bg-slate-100/50 dark:hover:bg-brand-500/5' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <td key={col.key} className={`${isCompact ? 'px-3 py-2 text-[12px]' : 'px-4 py-3 text-sm'} whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium`}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Input: React.FC<{
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  icon?: any;
  required?: boolean;
  disabled?: boolean;
}> = ({ label, type = 'text', placeholder, value, onChange, error, icon: Icon, required, disabled }) => (
  <div className="space-y-1.5 w-full">
    {label && (
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border ${
          error ? 'border-rose-500' : 'border-enterprise-border-light dark:border-enterprise-border-dark'
        } rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-slate-100 placeholder:text-slate-500`}
      />
      {type === 'date' && (
         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Icons.Clock size={16} />
         </div>
      )}
    </div>
    {error && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{error}</p>}
  </div>
);
