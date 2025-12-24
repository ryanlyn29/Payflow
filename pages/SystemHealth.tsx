
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/UI';
// Fixed: Import Icons from components/Icons instead of components/UI
import { Icons } from '../components/Icons';
import { getHealth, getQueueStats } from '../services/api';
import { HealthStatus, QueueStats } from '../types';

const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isRefreshing, setRefreshing] = useState(true);

  useEffect(() => {
    let interval: any;
    if (isRefreshing) {
      const fetchData = async () => {
        const [h, s] = await Promise.all([getHealth(), getQueueStats()]);
        setHealth(h);
        setStats(s);
      };
      fetchData();
      interval = setInterval(fetchData, 5000);
    }
    return () => clearInterval(interval);
  }, [isRefreshing]);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-enterprise-surface-light dark:bg-enterprise-surface-dark p-4 rounded-lg border border-enterprise-border-light dark:border-enterprise-border-dark">
          <div className="flex items-center gap-4">
             <div className={`w-3 h-3 rounded-full animate-pulse ${health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
             <span className="text-sm font-bold uppercase tracking-widest">Global Engine Status: <span className={health?.status === 'healthy' ? 'text-emerald-500' : 'text-rose-500'}>{health?.status || 'POLLING...'}</span></span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setRefreshing(!isRefreshing)}>
            {isRefreshing ? <><Icons.X size={14} className="mr-2" /> Stop Refresh</> : <><Icons.Refresh size={14} className="mr-2" /> Resume Refresh</>}
          </Button>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Database & Core Checks">
             <div className="space-y-4">
                {/* Fixed: cast Object.entries to provide correct typing for check.status */}
                {health && (Object.entries(health.checks) as [string, { status: string }][]).map(([name, check]) => (
                  <div key={name} className="flex items-center justify-between p-3 rounded bg-slate-50 dark:bg-slate-900/30 border border-enterprise-border-light dark:border-enterprise-border-dark">
                     <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{name}</span>
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Latency: {Math.floor(Math.random() * 20 + 2)}ms</span>
                        <Badge variant={check.status === 'healthy' ? 'success' : 'error'}>{check.status}</Badge>
                     </div>
                  </div>
                ))}
             </div>
          </Card>

          <Card title="Ingestion Queue (SQS Simulator)">
             <div className="flex flex-col h-full justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-400">Total Pending</span>
                    <span className="text-xl font-mono font-bold">{stats?.ApproximateNumberOfMessages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-400">In-Flight</span>
                    <span className="text-xl font-mono font-bold text-brand-500">{stats?.ApproximateNumberOfMessagesInFlight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-rose-400">Dead Letter Queue</span>
                    <span className="text-xl font-mono font-bold text-rose-500">{stats?.ApproximateNumberOfMessagesInDeadLetterQueue}</span>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                   <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Saturation 24h</p>
                   <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 w-[15%]" />
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
