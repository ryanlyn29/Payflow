
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
      className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col transition-all shadow-none ${onClick ? 'cursor-pointer active:scale-[0.99] hover:border-slate-300 dark:hover:border-slate-600' : ''} ${className}`}
    >
      {(title || actions) && (
        <div className={`${isCompact ? 'px-5 py-4' : 'px-6 py-5'} border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0`}>
          {title && <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`flex-1 overflow-auto ${isCompact ? 'p-4' : 'p-6'}`}>
        {children}
      </div>
    </div>
  );
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50';
  
  const variants = {
    primary: 'bg-[#2563eb] hover:bg-blue-700 text-white shadow-none',
    secondary: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-none',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
    outline: 'bg-transparent border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Container: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`max-w-[1400px] mx-auto px-6 lg:px-12 ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ 
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'; 
  children: React.ReactNode 
}> = ({ variant = 'neutral', children }) => {
  const styles = {
    success: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
    warning: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    error: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800",
    info: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
    neutral: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap ${styles[variant]}`}>
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
  const [isClosing, setIsClosing] = useState(false);
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl'
  };

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 150); // Faster fade out
  };

  if (!isOpen && !isClosing) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4" 
      style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className={`fixed inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity ${
          isClosing ? 'opacity-0 duration-150' : 'opacity-100 duration-200'
        }`}
        style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        onClick={handleClose} 
      />
      <div 
        className={`relative w-full ${sizes[size]} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-all z-[101] ${
          isClosing ? 'opacity-0 scale-95 duration-150' : 'opacity-100 scale-100 duration-200'
        }`}
        style={{ margin: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h2>
          <button onClick={handleClose} className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <Icons.X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        {actions && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
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
          className={`absolute top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[100] py-1 animate-in fade-in slide-in-from-top-2 duration-150 ${align === 'right' ? 'right-0' : 'left-0'}`}
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
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-left transition-colors ${
      danger 
        ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20' 
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
    } ${className}`}
  >
    {Icon && <Icon size={16} className="shrink-0" />}
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
    <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-none">
      <table className="w-full text-left border-collapse">
        <thead className="border-b border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-900/50">
          <tr>
            {columns.map(col => (
              <th key={col.key} className={`${isCompact ? 'px-6 py-4' : 'px-8 py-5'}`}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                 <div className="animate-pulse flex flex-col items-center gap-3">
                    <Icons.Refresh size={24} className="animate-spin text-[#2563eb]" />
                    <span className="text-xs font-bold">Loading...</span>
                 </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">No records found.</td>
            </tr>
          ) : data.map((row, i) => (
            <tr 
              key={i} 
              className={`transition-all ${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700' : ''}`}
              onClick={() => onRowClick?.(row)}
              data-demo={onRowClick ? 'transaction-row' : undefined}
            >
              {columns.map(col => (
                <td key={col.key} className={`${isCompact ? 'px-6 py-4' : 'px-8 py-6'} whitespace-nowrap`}>
                  {col.render ? col.render(row[col.key], row) : <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{row[col.key]}</span>}
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
  className?: string;
}> = ({ label, type = 'text', placeholder, value, onChange, error, icon: Icon, required, disabled, className = '' }) => (
  <div className="space-y-2 w-full">
    {label && (
      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-rose-500 dark:text-rose-400">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />}
      <input
        type={type}
        {...(onChange 
          ? { value: value || '', onChange } 
          : value !== undefined 
            ? { value: value || '', readOnly: true } 
            : { defaultValue: value || '' }
        )}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3 bg-white dark:bg-slate-800 border ${
          error ? 'border-rose-500 dark:border-rose-500' : 'border-slate-200 dark:border-slate-700'
        } rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${className}`}
      />
      {type === 'date' && (
         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
            <Icons.Clock size={18} />
         </div>
      )}
    </div>
    {error && <p className="text-xs font-bold text-rose-500 dark:text-rose-400">{error}</p>}
  </div>
);
