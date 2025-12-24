
import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Icons } from './Icons';
import { useAuth } from './AuthContext';
import { Dropdown, DropdownItem, Badge, Button } from './UI';
import { notificationService } from '../services/api';
import { Notification } from '../types';
import HelpCenter from './HelpCenter';
import { AIChatButton } from './AIChatButton';
import { DemoButton } from './DemoButton';

const overviewNav = [
  { name: 'Dashboard', path: '/dashboard', icon: Icons.Dashboard },
  { name: 'Payments', path: '/payments', icon: Icons.Payments },
  { name: 'Alerts', path: '/alerts', icon: Icons.Alerts },
];

const operationsNav = [
  { name: 'System Health', path: '/health', icon: Icons.Health },
  { name: 'Batch Jobs', path: '/batch-jobs', icon: Icons.Refresh },
  { name: 'Audit Logs', path: '/audit', icon: Icons.Logs },
  { name: 'Incident Replay', path: '/incidents', icon: Icons.Incident },
];

const automationNav = [
  { name: 'Automation', path: '/automation', icon: Icons.Rules },
];

const accountNav = [
  { name: 'Profile', path: '/profile', icon: Icons.User },
  { name: 'Settings', path: '/settings', icon: Icons.Settings },
  { name: 'Logout', path: '/logout', icon: Icons.Lock, isLogout: true },
];

export const EnterpriseLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout, updatePreferences } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const notifications = await notificationService.getAll();
        setNotifs(Array.isArray(notifications) ? notifications : []);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        setNotifs([]);
      }
    };
    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = Array.isArray(notifs) ? notifs.filter(n => !n.read).length : 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markRead = async (id: string, route?: string) => {
    try {
      await notificationService.markAsRead(id);
      const notifications = await notificationService.getAll();
      setNotifs(Array.isArray(notifications) ? notifications : []);
      if (route) navigate(route);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearNotifs = async () => {
    try {
      await notificationService.clearAll();
      const notifications = await notificationService.getAll();
      setNotifs(Array.isArray(notifications) ? notifications : []);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const allNavItems = [...overviewNav, ...operationsNav, ...automationNav, ...accountNav];
  const currentNav = allNavItems.find(n => n.path === location.pathname);
  const currentPage = currentNav?.name || 'Dashboard';
  const isCompact = user?.preferences.density === 'compact';

  if (!user) return <>{children}</>;

  return (
    <div className={`flex h-screen site-gradient-wrapper text-slate-800 dark:text-slate-200 transition-colors duration-200 overflow-hidden ${isCompact ? 'text-[13px]' : 'text-base'}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out z-40`}
      >
        <Link to="/" className="h-16 flex items-center gap-3 px-6 shrink-0 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Icons.Logo size={24} className="text-[#2563eb] shrink-0" />
          {isSidebarOpen && <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100">PAYFLOW</span>}
        </Link>

        <nav className={`flex-1 ${isCompact ? 'px-2 py-2' : 'px-4 py-6'} space-y-6 overflow-y-auto overflow-x-hidden`}>
          {}
          {isSidebarOpen && (
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-3">OVERVIEW</p>
            </div>
          )}
          <div className="space-y-1">
            {overviewNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-bold ${
                    isActive
                      ? 'bg-[#2563eb] text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                <item.icon size={18} className="shrink-0" />
                {isSidebarOpen && <span>{item.name}</span>}
              </NavLink>
            ))}
          </div>

          {}
          {isSidebarOpen && (
            <div className="mt-6 mb-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-3">OPERATIONS</p>
            </div>
          )}
          <div className="space-y-1">
            {operationsNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-bold ${
                    isActive
                      ? 'bg-[#2563eb] text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                <item.icon size={18} className="shrink-0" />
                {isSidebarOpen && <span>{item.name}</span>}
              </NavLink>
            ))}
          </div>

          {}
          {isSidebarOpen && (
            <div className="mt-6 mb-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-3">AUTOMATION</p>
            </div>
          )}
          <div className="space-y-1">
            {automationNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-bold ${
                    isActive
                      ? 'bg-[#2563eb] text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                <item.icon size={18} className="shrink-0" />
                {isSidebarOpen && <span>{item.name}</span>}
              </NavLink>
            ))}
          </div>

          {}
          {isSidebarOpen && (
            <div className="mt-6 mb-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-3">ACCOUNT</p>
            </div>
          )}
          <div className="space-y-1">
            {accountNav.map((item) => {
              if (item.isLogout) {
                return (
                  <button
                    key={item.name}
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    <item.icon size={18} className="shrink-0" />
                    {isSidebarOpen && <span>{item.name}</span>}
                  </button>
                );
              }
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-bold ${
                      isActive
                        ? 'bg-[#2563eb] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <item.icon size={18} className="shrink-0" />
                  {isSidebarOpen && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </aside>

      {}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-30">
          {}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Icons.Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions, alerts, logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]/50 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = searchQuery.trim();
                    if (query) {

                      navigate(`/dashboard?search=${encodeURIComponent(query)}`);
                    }
                  }
                }}
              />
            </div>
          </div>
          
          {}
          <div className="flex items-center gap-4">
            <DemoButton />
             {}
             <Dropdown trigger={
               <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 relative rounded-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                 <Icons.Mail size={20} />
                 {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-blue-500 text-white text-xs font-bold rounded-full border-2 border-white dark:border-slate-900">
                     {unreadCount}
                   </span>
                 )}
               </button>
             }>
               <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                 <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Messages</span>
                 <button 
                   onClick={async () => {
                     try {
                       await notificationService.clearAll();
                       const notifications = await notificationService.getAll();
                       setNotifs(Array.isArray(notifications) ? notifications : []);
                     } catch (error) {
                       console.error('Failed to mark all as read:', error);
                     }
                   }}
                   className="text-xs text-[#2563eb] hover:underline font-bold"
                 >
                   Mark all read
                 </button>
               </div>
               <div className="max-h-80 overflow-y-auto">
                 {notifs.length === 0 ? (
                   <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm font-bold">No messages</div>
                 ) : notifs.map(msg => (
                   <div 
                     key={msg.id}
                     onClick={async () => {
                       try {
                         await notificationService.markAsRead(msg.id);
                         const notifications = await notificationService.getAll();
                         setNotifs(Array.isArray(notifications) ? notifications : []);
                       } catch (error) {
                         console.error('Failed to mark as read:', error);
                       }
                     }}
                     className={`p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!msg.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                   >
                     <div className="flex justify-between items-start gap-2 mb-1">
                       <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{msg.type === 'error' ? 'System Alert' : msg.type === 'warning' ? 'Alerts' : 'System'}</span>
                       {!msg.read && <div className="w-2 h-2 rounded-full bg-[#2563eb] shrink-0 mt-1" />}
                     </div>
                     <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight mb-1 font-medium">{msg.message}</p>
                     <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                   </div>
                 ))}
               </div>
             </Dropdown>
             
             {}
             <button 
               onClick={() => updatePreferences({ ...user.preferences, theme: user.preferences.theme === 'dark' ? 'light' : 'dark' })}
               className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
             >
               {user.preferences.theme === 'dark' ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
             </button>
             
             {}
             <Dropdown trigger={
               <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 relative rounded-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                 <Icons.Bell size={20} />
                 {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-xs font-bold rounded-full border-2 border-white dark:border-slate-900">
                     {unreadCount}
                   </span>
                 )}
               </button>
             }>
               <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <span className="text-sm font-bold text-slate-700">Activity Hub</span>
                  <button onClick={clearNotifs} className="text-xs text-[#2563eb] hover:underline font-bold">Clear All</button>
               </div>
               <div className="max-h-80 overflow-y-auto">
                 {!Array.isArray(notifs) || notifs.length === 0 ? (
                   <div className="p-8 text-center text-slate-400 text-sm font-bold">No notifications</div>
                 ) : notifs.map(n => (
                   <div 
                    key={n.id} 
                    onClick={() => markRead(n.id, n.type === 'error' ? '/alerts' : n.type === 'warning' ? '/health' : undefined)}
                    className={`p-4 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                   >
                     <div className="flex justify-between items-start gap-2 mb-1">
                        <span className={`text-sm font-bold ${n.type === 'error' ? 'text-rose-600' : n.type === 'warning' ? 'text-amber-600' : 'text-[#2563eb]'}`}>{n.title}</span>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-[#2563eb] shrink-0 mt-1" />}
                     </div>
                     <p className="text-xs text-slate-600 leading-tight mb-2 font-medium">{n.message}</p>
                     <span className="text-xs text-slate-400 font-bold">{new Date(n.timestamp).toLocaleTimeString()}</span>
                   </div>
                 ))}
               </div>
             </Dropdown>

             {}
             <Dropdown trigger={
               <button 
                 className="flex items-center gap-2 p-1.5 pr-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all group"
                 data-demo="profile-dropdown"
               >
                 <div className="h-9 w-9 bg-[#2563eb] rounded-full flex items-center justify-center text-white font-extrabold text-sm">
                    {user.name.charAt(0)}
                 </div>
                 <div className="hidden md:block text-left">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{user.name.split(' ')[0]}</p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">ACTIVE MEMBER</p>
                 </div>
                 <Icons.ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
               </button>
             }>
               <DropdownItem icon={Icons.User} onClick={() => navigate('/profile')}>Profile</DropdownItem>
               <DropdownItem icon={Icons.Dashboard} onClick={() => navigate('/dashboard')}>Dashboard</DropdownItem>
               <DropdownItem icon={Icons.Settings} onClick={() => navigate('/settings')}>Settings</DropdownItem>
               <div className="border-t border-slate-100 my-1" />
               <DropdownItem icon={Icons.Lock} danger onClick={handleLogout}>Logout</DropdownItem>
             </Dropdown>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto ${isCompact ? 'p-3' : 'p-6'} scroll-smooth bg-white dark:bg-slate-900`}>
           <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
              {children}
           </div>
        </main>
        
        {}
        <AIChatButton />
      </div>
    </div>
  );
};
