
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/UI';

import { Icons } from '../components/Icons';
import { getHealth, getQueueStats } from '../services/api';
import { HealthStatus, QueueStats } from '../types';

const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isRefreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (isRefreshing) {
      const fetchData = async () => {
        try {
          setError(null);
          const [h, s] = await Promise.all([getHealth(), getQueueStats()]);
          setHealth(h);
          setStats(s);
        } catch (err: any) {
          setError(err.message || 'Failed to load health data');
          console.error('Failed to fetch health data:', err);
        }
      };
      fetchData();
      interval = setInterval(fetchData, 5000);
    }
    return () => clearInterval(interval);
  }, [isRefreshing]);

  if (error && !health) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Error size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Failed to Load Health Data</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 font-['Plus_Jakarta_Sans'] text-slate-900 dark:text-slate-100">
       <div className="flex items-center justify-between">
         <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">System Health</h1>
         <Button size="sm" variant="secondary" onClick={() => setRefreshing(!isRefreshing)}>
           {isRefreshing ? <><Icons.X size={14} className="mr-2" /> Stop</> : <><Icons.Refresh size={14} className="mr-2" /> Resume</>}
         </Button>
       </div>
       
       <Card className="p-6">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  health?.status === 'healthy' ? 'bg-emerald-500' : 
                  health?.status === 'degraded' ? 'bg-amber-500' : 
                  'bg-rose-500'
                }`} />
                <div className="flex flex-col">
                   <span className="text-base font-extrabold">
                     Status: <span className={
                       health?.status === 'healthy' ? 'text-emerald-600' : 
                       health?.status === 'degraded' ? 'text-amber-600' : 
                       'text-rose-600'
                     }>{health?.status?.toUpperCase() || 'POLLING...'}</span>
                   </span>
                   {health?.environment && (
                     <span className="text-sm text-slate-500 mt-1 font-medium">
                       Environment: {health.environment}
                     </span>
                   )}
                </div>
             </div>
          </div>
       </Card>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Database & Core Checks">
             <div className="space-y-4">
                {}
                {health && (Object.entries(health.checks) as [string, { status: string; message?: string }][]).map(([name, check]) => (
                  <div key={name} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                     <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{name}</span>
                        {check.message && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{check.message}</span>
                        )}
                     </div>
                     <div className="flex items-center gap-2">
                        {check.status === 'healthy' && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Latency: {Math.floor(Math.random() * 20 + 2)}ms</span>
                        )}
                        <Badge variant={check.status === 'healthy' ? 'success' : 'error'}>
                          {check.status}
                        </Badge>
                     </div>
                  </div>
                ))}
             </div>
          </Card>

          <Card title="Ingestion Queue (SQS Simulator)">
             <div className="flex flex-col h-full justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Pending</span>
                    <span className="text-xl font-mono font-extrabold text-slate-900 dark:text-slate-100">{stats?.ApproximateNumberOfMessages || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">In-Flight</span>
                    <span className="text-xl font-mono font-extrabold text-[#2563eb]">{stats?.ApproximateNumberOfMessagesInFlight || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Dead Letter Queue</span>
                    <span className="text-xl font-mono font-extrabold text-rose-600">{stats?.ApproximateNumberOfMessagesInDeadLetterQueue || 0}</span>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                   <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-2">Saturation 24h</p>
                   <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2563eb] w-[15%]" />
                   </div>
                </div>
             </div>
          </Card>

          <Card title="Worker Pool Status">
             <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-enterprise-border-light dark:border-enterprise-border-dark last:border-0">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${i % 7 === 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                       <span className="text-xs font-mono">WRK-0{i+1}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{i % 7 === 0 ? 'Busy (98%)' : 'Idle'}</span>
                  </div>
                ))}
             </div>
          </Card>
       </div>
    </div>
  );
};

export default SystemHealth;
