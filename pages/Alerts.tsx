
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/UI';
// Fixed: Import Icons from components/Icons instead of components/UI
import { Icons } from '../components/Icons';
import { getAlerts } from '../services/api';
import { Alert } from '../types';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    const res = await getAlerts();
    setAlerts(res);
  };

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            {['all', 'critical', 'high', 'medium'].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                  filter === f 
                    ? 'bg-brand-500 border-brand-500 text-white' 
                    : 'border-enterprise-border-light dark:border-enterprise-border-dark text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
         </div>
         <Button variant="secondary" size="sm" onClick={loadAlerts}><Icons.Refresh size={14} className="mr-2" /> Polling Active</Button>
       </div>

       <div className="grid grid-cols-1 gap-4">
          {filtered.map(alert => (
            <Card key={alert.alert_id} className={`border-l-4 ${
              alert.severity === 'critical' ? 'border-l-rose-500' : 
              alert.severity === 'high' ? 'border-l-orange-500' : 'border-l-amber-500'
            }`}>
               <div className="flex flex-col md:flex-row gap-6 justify-between">
                  <div className="flex gap-4 items-start">
                     <div className={`p-3 rounded-lg ${
                        alert.severity === 'critical' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                     }`}>
                        <Icons.Alerts size={24} />
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h3 className="font-bold text-lg">{alert.alert_type.replace(/_/g, ' ')}</h3>
                           <Badge variant={alert.severity === 'critical' ? 'error' : 'warning'}>{alert.severity}</Badge>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">{alert.description}</p>
                        <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           <span className="flex items-center gap-1"><Icons.Dashboard size={12} /> ID: {alert.alert_id}</span>
                           <span className="flex items-center gap-1"><Icons.Clock size={12} /> Detected: {new Date(alert.detected_at).toLocaleString()}</span>
                           {alert.merchant_id && <span className="flex items-center gap-1"><Icons.User size={12} /> Merchant: {alert.merchant_id}</span>}
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end">
                     <Button size="sm" variant="primary">Acknowledge</Button>
                     <Button size="sm" variant="secondary">View Incident</Button>
                     <Button size="sm" variant="ghost">Silence</Button>
                  </div>
               </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="py-24 text-center border-2 border-dashed border-enterprise-border-light dark:border-enterprise-border-dark rounded-xl">
               <Icons.Health size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
               <h3 className="text-slate-500 font-bold uppercase tracking-widest">No active alerts</h3>
               <p className="text-sm text-slate-400">All systems operational in this segment.</p>
            </div>
          )}
       </div>
    </div>
  );
};

export default Alerts;
