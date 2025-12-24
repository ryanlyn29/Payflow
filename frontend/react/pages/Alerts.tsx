
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { Icons } from '../components/Icons';
import { HelpIcon } from '../components/Tooltip';
import { getAlerts, alertService } from '../services/api';
import { useNotification } from '../components/NotificationSystem';
import { Alert } from '../types';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getAlerts();
      setAlerts(res);
    } catch (err: any) {

      const isConnectionError = err.code === 'ERR_NETWORK' || 
                                err.message?.includes('ERR_CONNECTION_REFUSED') ||
                                err.code === 'ECONNREFUSED';
      
      if (!isConnectionError) {
        setError(err.message || 'Failed to load alerts');
        console.error('Failed to load alerts:', err);
      } else {

        setAlerts([]);
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await alertService.acknowledge(alertId);
      setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, resolved: true } : a));
      showNotification({
        type: 'success',
        message: 'Alert acknowledged successfully',
        duration: 3000,
      });
    } catch (err: any) {
      showNotification({
        type: 'error',
        message: 'Failed to acknowledge alert',
        duration: 5000,
      });
    }
  };

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Loading Alerts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Error size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Failed to Load Alerts</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={loadAlerts}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 font-['Plus_Jakarta_Sans'] text-slate-900 dark:text-slate-100">
       <div className="flex items-center justify-between">
         <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Alerts</h1>
         <div className="flex items-center gap-3">
            {['all', 'critical', 'high', 'medium'].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all shadow-none ${
                  filter === f 
                    ? 'bg-[#2563eb] border-[#2563eb] text-white' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
            <Button variant="secondary" size="sm" onClick={loadAlerts}><Icons.Refresh size={14} className="mr-2" /> Refresh</Button>
         </div>
       </div>

       <div className="grid grid-cols-1 gap-4">
          {filtered.map(alert => (
            <div 
              key={alert.alert_id} 
              className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 flex items-center justify-between shadow-none transition-colors hover:border-slate-300 dark:hover:border-slate-600 ${
                alert.severity === 'critical' ? 'border-l-4 border-l-rose-500' : 
                alert.severity === 'high' ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-amber-500'
              }`}
            >
               <div className="flex gap-4 items-center">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${
                     alert.severity === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                     alert.severity === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                     'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                     <Icons.Alerts size={22} />
                  </div>
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{alert.alert_type.replace(/_/g, ' ')}</h4>
                        <Badge variant={alert.severity === 'critical' ? 'error' : 'warning'}>{alert.severity}</Badge>
                     </div>
                     <p className="text-sm text-slate-600 dark:text-slate-400 font-medium max-w-2xl">{alert.description}</p>
                     <div className="flex items-center gap-4 mt-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>ID: {alert.alert_id}</span>
                        <span>{new Date(alert.detected_at).toLocaleString()}</span>
                        {alert.merchant_id && <span>{alert.merchant_id}</span>}
                     </div>
                  </div>
               </div>
               <div className="flex gap-2 shrink-0" data-demo="alert-actions">
                  <Button 
                    size="sm" 
                    variant="primary" 
                    onClick={() => handleAcknowledge(alert.alert_id)}
                    disabled={alert.resolved}
                  >
                    {alert.resolved ? 'Resolved' : 'Acknowledge'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => {

                      window.location.href = `/incidents?alert=${alert.alert_id}`;
                    }}
                  >
                    View
                  </Button>
               </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">
               <Icons.Health size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
               <h3 className="text-slate-600 dark:text-slate-400 font-extrabold mb-2">No active alerts</h3>
               <p className="text-sm text-slate-500 dark:text-slate-500 font-medium">All systems operational.</p>
            </div>
          )}
       </div>
    </div>
  );
};

export default Alerts;
