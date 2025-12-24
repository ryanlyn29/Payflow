
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '../components/UI';
import { Icons } from '../components/Icons';
import { HelpIcon } from '../components/Tooltip';
import { useAuth } from '../components/AuthContext';
import { useNotification } from '../components/NotificationSystem';
import { authService } from '../services/api';

const Settings: React.FC = () => {
  const { user, updatePreferences } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const [theme, setTheme] = useState<'dark' | 'light'>(user?.preferences?.theme || 'dark');

  useEffect(() => {
    if (user?.preferences?.theme) {
      setTheme(user.preferences.theme);
    }
  }, [user]);

  const handleThemeChange = async (newTheme: 'dark' | 'light') => {
    if (!user) return;
    
    setTheme(newTheme);
    setIsSaving(true);
    setError(null);

    try {
      await updatePreferences({
        ...user.preferences,
        theme: newTheme
      });

      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      showNotification({
        type: 'success',
        message: 'Settings saved successfully',
        duration: 5000,
      });
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update theme';
      setError(errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage,
        duration: 5000,
      });

      setTheme(user.preferences?.theme || 'dark');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-10 pb-12 font-['Plus_Jakarta_Sans']">
       {error && (
         <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold">
           <Icons.Error size={16} />
           {error}
         </div>
       )}

       <section className="space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">User Preferences</h2>
          <Card title="Appearance" className="dark:bg-slate-800 dark:border-slate-700">
             <div className="space-y-6">
                <div>
                   <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Theme</label>
                   <div className="flex gap-2">
                      <Button
                         variant={theme === 'light' ? 'primary' : 'secondary'}
                         size="sm"
                         onClick={() => handleThemeChange('light')}
                         disabled={isSaving}
                      >
                         <Icons.Sun size={16} className="mr-2" />
                         Light
                      </Button>
                      <Button
                         variant={theme === 'dark' ? 'primary' : 'secondary'}
                         size="sm"
                         onClick={() => handleThemeChange('dark')}
                         disabled={isSaving}
                      >
                         <Icons.Moon size={16} className="mr-2" />
                         Dark
                      </Button>
                   </div>
                </div>
             </div>
          </Card>

          <Card title="Security & Authentication" className="dark:bg-slate-800 dark:border-slate-700">
             <div className="space-y-6">
                <div>
                   <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Enterprise API Key</label>
                   <div className="flex gap-2">
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg font-mono text-sm flex items-center justify-between text-slate-700 dark:text-slate-300">
                         <span className="api-key-display">pk_live_************************3a9f</span>
                         <Icons.Lock size={16} className="text-slate-400" />
                      </div>
                      <Button 
                        variant="secondary"
                        onClick={() => {
                          const element = document.querySelector('.api-key-display');
                          if (element) {
                            const isRevealed = element.textContent?.includes('pk_live_');
                            if (isRevealed) {
                              element.textContent = 'pk_live_************************3a9f';
                            } else {
                              element.textContent = 'pk_live_51a3b8c9d2e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f3a9f';
                            }
                          }
                        }}
                      >
                        Reveal
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={() => {
                          showNotification({
                            type: 'info',
                            message: 'API key rotation initiated. New key will be available in 24 hours.',
                            duration: 5000,
                          });
                        }}
                      >
                        <Icons.Refresh size={16} />
                      </Button>
                   </div>
                   <p className="text-xs text-slate-500 mt-2">Last rotated 45 days ago. Key has full write permissions to the transaction store.</p>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                   <h4 className="text-sm font-bold mb-4 dark:text-slate-300">Webhooks Signature</h4>
                   <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[#2563eb]">
                            <Icons.Lock size={16} />
                         </div>
                         <p className="text-sm text-slate-600 dark:text-slate-400">Sign all outgoing requests with HS256 algorithm.</p>
                      </div>
                      <Badge variant="success">Enabled</Badge>
                   </div>
                </div>
             </div>
          </Card>
       </section>

       <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Infrastructure Limits</h2>
          <Card className="dark:bg-slate-800 dark:border-slate-700">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h4 className="text-sm font-bold dark:text-slate-300">Rate Limiting</h4>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400 dark:text-slate-500">Burst Limit</span>
                         <span className="font-mono dark:text-slate-300">5,000 req/s</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400 dark:text-slate-500">Sustain Limit</span>
                         <span className="font-mono dark:text-slate-300">2,500 req/s</span>
                      </div>
                   </div>
                   <Button 
                     size="sm" 
                     variant="secondary" 
                     className="w-full"
                     onClick={() => {
                       showNotification({
                         type: 'info',
                         message: 'Rate limit configuration modal coming soon',
                         duration: 5000,
                       });
                     }}
                   >
                     Edit Limits
                   </Button>
                </div>
                
                <div className="space-y-4">
                   <h4 className="text-sm font-bold dark:text-slate-300">Data Retention</h4>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400 dark:text-slate-500">Audit Logs</span>
                         <span className="font-mono dark:text-slate-300">90 Days</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400 dark:text-slate-500">Transaction Replay</span>
                         <span className="font-mono dark:text-slate-300">7 Days</span>
                      </div>
                   </div>
                   <Button 
                     size="sm" 
                     variant="secondary" 
                     className="w-full"
                     onClick={() => {
                       showNotification({
                         type: 'info',
                         message: 'Data retention configuration modal coming soon',
                         duration: 5000,
                       });
                     }}
                   >
                     Configure Archival
                   </Button>
                </div>
             </div>
          </Card>
       </section>

       {user && (
         <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Account Information</h2>
            <Card title="Profile" className="dark:bg-slate-800 dark:border-slate-700">
               <div className="space-y-4">
                  <Input
                     label="Name"
                     value={user.name || ''}
                     disabled
                     icon={Icons.User}
                     className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  />
                  <Input
                     label="Email"
                     value={user.email || ''}
                     disabled
                     icon={Icons.Mail}
                     className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  />
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                     <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Account created: {new Date(user.created_at || Date.now()).toLocaleDateString()}</p>
                     {user.email_verified ? (
                        <Badge variant="success">Email Verified</Badge>
                     ) : (
                        <Badge variant="warning">Email Not Verified</Badge>
                     )}
                  </div>
               </div>
            </Card>
         </section>
       )}
    </div>
  );
};

export default Settings;
