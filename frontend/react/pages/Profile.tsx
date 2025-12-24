
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../components/UI';
import { Icons } from '../components/Icons';
import { HelpIcon } from '../components/Tooltip';
import { useAuth } from '../components/AuthContext';
import { useNotification } from '../components/NotificationSystem';
import { authService } from '../services/api';

const Profile: React.FC = () => {
  const { user, updatePreferences, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    density: user?.preferences?.density || 'comfortable',
    notifications: user?.preferences?.notifications_enabled || false,
    region: user?.preferences?.default_region || 'us-east-1'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        density: user.preferences?.density || 'comfortable',
        notifications: user.preferences?.notifications_enabled || false,
        region: user.preferences?.default_region || 'us-east-1'
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setError(null);

    try {

      if (formData.name !== user.name) {
        await authService.updateProfile({ name: formData.name });

        await updateUser();
      }

      const prefsChanged = 
        formData.density !== user.preferences?.density ||
        formData.notifications !== user.preferences?.notifications_enabled ||
        formData.region !== user.preferences?.default_region;

      if (prefsChanged) {
        await updatePreferences({
          ...user.preferences,
          density: formData.density as any,
          notifications_enabled: formData.notifications,
          default_region: formData.region
        });
      }

      showNotification({
        type: 'success',
        message: 'Profile saved successfully',
        duration: 5000,
      });
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to save profile';
      setError(errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-10 pb-12 font-['Plus_Jakarta_Sans'] max-w-3xl">
       <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[#2563eb] rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-blue-500/20">
               {user.name.charAt(0)}
            </div>
            <div className="space-y-1">
               <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{user.name}</h2>
               <div className="flex items-center gap-2">
                  <Badge variant="info">{user.role}</Badge>
                  <span className="text-xs text-slate-500 font-mono font-bold">{user.email}</span>
               </div>
            </div>
          </div>
          <HelpIcon content="Update your profile information and preferences. Name changes are saved immediately. Email changes require verification." />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Identity Details">
             <div className="space-y-4">
                <Input label="Display Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} icon={Icons.User} />
                {}
                <Input label="Login Email" value={formData.email} disabled icon={Icons.X} />
                <div>
                   <label className="text-sm font-bold text-slate-700 mb-1.5 block">Session Validity</label>
                   <p className="text-xs font-mono text-emerald-600 font-extrabold">Active: Expires in 12h 45m</p>
                </div>
             </div>
          </Card>

          <Card title="Workstation Preferences">
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700 block">UI Density</label>
                   <div className="flex p-1 bg-slate-100 rounded-lg gap-1">
                      {['comfortable', 'compact'].map(d => (
                        <button 
                          key={d}
                          onClick={() => setFormData({...formData, density: d as any})}
                          className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${
                            formData.density === d ? 'bg-white shadow-sm text-[#2563eb]' : 'text-slate-500'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700 block">Operational Region</label>
                   <select 
                    value={formData.region}
                    onChange={e => setFormData({...formData, region: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]/50"
                   >
                      <option value="us-east-1">US-East-1 (N. Virginia)</option>
                      <option value="eu-central-1">EU-Central-1 (Frankfurt)</option>
                      <option value="ap-southeast-1">AP-Southeast-1 (Singapore)</option>
                   </select>
                </div>

                <div className="flex items-center justify-between">
                   <div>
                      <p className="text-sm font-extrabold text-slate-900">Push Notifications</p>
                      <p className="text-xs text-slate-500 font-medium">Global operational alerts</p>
                   </div>
                   <button 
                    onClick={() => setFormData({...formData, notifications: !formData.notifications})}
                    className={`w-10 h-5 rounded-full relative transition-colors ${formData.notifications ? 'bg-[#2563eb]' : 'bg-slate-300'}`}
                   >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.notifications ? 'left-6' : 'left-1'}`} />
                   </button>
                </div>
             </div>
          </Card>
       </div>

       {error && (
         <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold">
           <Icons.Error size={16} />
           {error}
         </div>
       )}

       <div className="flex justify-end gap-3 pt-6">
          <Button variant="ghost" onClick={() => {
            if (user) {
              setFormData({
                name: user.name || '',
                email: user.email || '',
                density: user.preferences?.density || 'comfortable',
                notifications: user.preferences?.notifications_enabled || false,
                region: user.preferences?.default_region || 'us-east-1'
              });
            }
            setError(null);
          }}>Discard Changes</Button>
          <Button onClick={handleSave} disabled={isSaving}>
             {isSaving ? (
               <>
                 <Icons.Refresh size={16} className="animate-spin mr-2" />
                 Saving...
               </>
             ) : (
               <>
                 <Icons.Check size={16} className="mr-2" />
                 Save Profile
               </>
             )}
          </Button>
       </div>
    </div>
  );
};

export default Profile;
