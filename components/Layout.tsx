
import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Icons } from './Icons';
import { useAuth } from './AuthContext';
import { Dropdown, DropdownItem, Badge, Button } from './UI';
import { notificationService } from '../services/api';
import { Notification } from '../types';

const navigation = [
  { name: 'Dashboard', path: '/', icon: Icons.Dashboard },
  { name: 'Payments', path: '/payments', icon: Icons.Payments },
  { name: 'Alerts', path: '/alerts', icon: Icons.Alerts },
  { name: 'Incident Replay', path: '/incidents', icon: Icons.Incident },
  { name: 'Automation', path: '/automation', icon: Icons.Rules },
  { name: 'System Health', path: '/health', icon: Icons.Health },
  { name: 'Audit Logs', path: '/audit', icon: Icons.Logs },
  { name: 'Settings', path: '/settings', icon: Icons.Settings },
];

export const EnterpriseLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const { user, logout, updatePreferences } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setNotifs(notificationService.getAll());
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markRead = (id: string, route?: string) => {
    notificationService.markAsRead(id);
    setNotifs(notificationService.getAll());
    if (route) navigate(route);
  };

  const clearNotifs = () => {
    const updated = notificationService.clearAll();
    setNotifs(updated);
  };

  const currentNav = navigation.find(n => n.path === location.pathname);
  const currentPage = currentNav?.name || 'Inspector';
  const isCompact = user?.preferences.density === 'compact';

  if (!user) return <>{children}</>;

  return (
    <div className={`flex h-screen bg-enterprise-bg-light dark:bg-enterprise-bg-dark text-slate-800 dark:text-slate-200 transition-colors duration-200 overflow-hidden font-sans ${isCompact ? 'text-[13px]' : 'text-base'}`}>
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-enterprise-surface-light dark:bg-enterprise-surface-dark border-r border-enterprise-border-light dark:border-enterprise-border-dark flex flex-col transition-all duration-300 ease-in-out z-40`}
      >
        <div className="h-16 flex items-center gap-3 px-6 shrink-0 border-b border-enterprise-border-light/50 dark:border-enterprise-border-dark/50">
          <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-500/20">
            <Icons.Health size={20} />
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tighter">PaySignal<span className="text-brand-500 font-normal">Core</span></span>}
        </div>

        <nav className={`flex-1 ${isCompact ? 'px-2 py-2' : 'px-3 py-4'} space-y-1 overflow-y-auto overflow-x-hidden`}>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group text-sm font-bold uppercase tracking-wider ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-500/20'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 border border-transparent'
                }`
              }
            >
              <item.icon size={isCompact ? 16 : 18} className="shrink-0 transition-transform group-hover:scale-110" />
              {isSidebarOpen && <span className="text-[11px]">{item.name}</span>}
              {!isSidebarOpen && (
                <div className="fixed left-20 ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none uppercase tracking-widest whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-enterprise-border-light dark:border-enterprise-border-dark space-y-2">
           <button 
            onClick={() => updatePreferences({ ...user.preferences, theme: user.preferences.theme === 'dark' ? 'light' : 'dark' })}
            className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-md transition-all"
           >
            {user.preferences.theme === 'dark' ? <Icons.Sun size={18} /> : <Icons.Moon size={18} />}
            {isSidebarOpen && <span>{user.preferences.theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
           </button>
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-md transition-all"
          >
            {isSidebarOpen ? <Icons.X size={18} /> : <Icons.Menu size={18} />}
            {isSidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-enterprise-surface-light dark:bg-enterprise-surface-dark border-b border-enterprise-border-light dark:border-enterprise-border-dark flex items-center justify-between px-6 shrink-0 z-30">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
             <Icons.Clock size={16} className="text-brand-500" />
             <Link to="/" className="hover:text-brand-500 transition-colors hidden md:inline">Console</Link>
             <Icons.ChevronRight size={12} className="text-slate-600" />
             <span className="text-slate-900 dark:text-white">{currentPage}</span>
          </div>
          
          <div className="flex items-center gap-2">
             <Dropdown trigger={
               <button className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 relative bg-slate-100 dark:bg-slate-800 rounded-md transition-all hover:scale-105 active:scale-95">
                 <Icons.Bell size={20} />
                 {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full border-2 border-white dark:border-enterprise-surface-dark animate-bounce">
                     {unreadCount}
                   </span>
                 )}
               </button>
             }>
               <div className="px-4 py-2 border-b border-enterprise-border-light dark:border-enterprise-border-dark flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Activity Hub</span>
                  <button onClick={clearNotifs} className="text-[9px] text-brand-500 hover:underline font-bold tracking-widest uppercase">Flush All</button>
               </div>
               <div className="max-h-80 overflow-y-auto">
                 {notifs.length === 0 ? (
                   <div className="p-8 text-center text-slate-500 italic text-[10px] uppercase font-bold tracking-widest">Zero Inbox</div>
                 ) : notifs.map(n => (
                   <div 
                    key={n.id} 
                    onClick={() => markRead(n.id, n.type === 'error' ? '/alerts' : n.type === 'warning' ? '/health' : undefined)}
                    className={`p-4 border-b border-enterprise-border-light dark:border-enterprise-border-dark last:border-0 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-brand-500/5 transition-colors ${!n.read ? 'bg-brand-50/50 dark:bg-brand-500/10' : ''}`}
                   >
                     <div className="flex justify-between items-start gap-2 mb-1">
                        <span className={`text-[11px] font-bold uppercase tracking-tight ${n.type === 'error' ? 'text-rose-500' : n.type === 'warning' ? 'text-amber-500' : 'text-brand-500'}`}>{n.title}</span>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1 shadow-sm shadow-brand-500" />}
                     </div>
                     <p className="text-[11px] text-slate-500 leading-tight mb-2 font-medium">{n.message}</p>
                     <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(n.timestamp).toLocaleTimeString()}</span>
                   </div>
                 ))}
               </div>
             </Dropdown>

             <div className="w-px h-6 bg-enterprise-border-light dark:border-enterprise-border-dark mx-2" />

             <Dropdown trigger={
               <button className="flex items-center gap-3 p-1.5 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all group hover:scale-[1.02] active:scale-95">
                 <div className="h-8 w-8 bg-brand-500 rounded flex items-center justify-center text-white font-bold text-xs shadow-md shadow-brand-500/20">
                    {user.name.charAt(0)}
                 </div>
                 <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors uppercase tracking-tight">{user.name}</p>
                    <p className="text-[9px] text-slate-500 uppercase font-extrabold tracking-widest leading-none">{user.role}</p>
                 </div>
                 <Icons.ChevronDown size={14} className="text-slate-500 group-hover:text-brand-500 transition-colors" />
               </button>
             }>
               <DropdownItem icon={Icons.User} onClick={() => navigate('/profile')}>Identity Node</DropdownItem>
               <DropdownItem icon={Icons.Dashboard} onClick={() => navigate('/')}>Operations Hub</DropdownItem>
               <DropdownItem icon={Icons.Settings} onClick={() => navigate('/settings')}>Fleet Config</DropdownItem>
               <div className="border-t border-enterprise-border-light dark:border-enterprise-border-dark my-1" />
               <DropdownItem icon={Icons.ExternalLink} danger onClick={handleLogout}>Terminate Session</DropdownItem>
             </Dropdown>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto ${isCompact ? 'p-3' : 'p-6'} scroll-smooth bg-slate-50/50 dark:bg-transparent`}>
           <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
};
