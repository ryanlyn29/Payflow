
import React, { useState } from 'react';
// Fixed: Correctly import Icons from components/Icons
import { Card, Button, Input, Badge } from '../components/UI';
import { Icons } from '../components/Icons';
import { useAuth } from '../components/AuthContext';

const Profile: React.FC = () => {
  const { user, updatePreferences } = useAuth();
  const [isSaving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    density: user?.preferences.density || 'comfortable',
    notifications: user?.preferences.notifications_enabled || false,
    region: user?.preferences.default_region || 'us-east-1'
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    if (user) {
      updatePreferences({
        ...user.preferences,
        density: formData.density as any,
        notifications_enabled: formData.notifications,
        default_region: formData.region
      });
    }
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-3xl">
       <div className="flex items-center gap-6 pb-6 border-b border-enterprise-border-light dark:border-enterprise-border-dark">
          <div className="w-20 h-20 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-brand-500/20">
             {user.name.charAt(0)}
          </div>
          <div className="space-y-1">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
             <div className="flex items-center gap-2">
                <Badge variant="info">{user.role}</Badge>
                <span className="text-xs text-slate-500 font-mono">{user.email}</span>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Identity Details">
             <div className="space-y-4">
                <Input label="Display Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} icon={Icons.User} />
                {/* Fixed: Input now accepts disabled prop */}
                <Input label="Login Email" value={formData.email} disabled icon={Icons.X} />
                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Session Validity</label>
                   <p className="text-xs font-mono text-emerald-500 font-bold">Active: Expires in 12h 45m</p>
                </div>
             </div>
          </Card>

          <Card title="Workstation Preferences">
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">UI Density</label>
                   <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-lg gap-1">
                      {['comfortable', 'compact'].map(d => (
                        <button 
                          key={d}
                          onClick={() => setFormData({...formData, density: d as any})}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
                            formData.density === d ? 'bg-white dark:bg-slate-800 shadow-sm text-brand-500' : 'text-slate-500'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Operational Region</label>
                   <select 
                    value={formData.region}
                    onChange={e => setFormData({...formData, region: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-enterprise-border-light dark:border-enterprise-border-dark rounded-md text-xs font-bold uppercase tracking-widest focus:outline-none"
                   >
                      <option value="us-east-1">US-East-1 (N. Virginia)</option>
                      <option value="eu-central-1">EU-Central-1 (Frankfurt)</option>
                      <option value="ap-southeast-1">AP-Southeast-1 (Singapore)</option>
                   </select>
                </div>

                <div className="flex items-center justify-between">
                   <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Push Notifications</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Global operational alerts</p>
                   </div>
                   <button 
                    onClick={() => setFormData({...formData, notifications: !formData.notifications})}
                    className={`w-10 h-5 rounded-full relative transition-colors ${formData.notifications ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                   >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.notifications ? 'left-6' : 'left-1'}`} />
                   </button>
                </div>
             </div>
          </Card>
       </div>

       <div className="flex justify-end gap-3 pt-6">
          <Button variant="ghost" onClick={() => window.history.back()}>Discard Changes</Button>
          {/* Fixed: Corrected isSubmitting to isSaving */}
          <Button onClick={handleSave} disabled={isSaving}>
             {isSaving ? <Icons.Refresh size={16} className="animate-spin mr-2" /> : <Icons.Success size={16} className="mr-2" />}
             Save Profile
          </Button>
       </div>
    </div>
  );
};

export default Profile;
