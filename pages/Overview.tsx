
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Modal, DataTable } from '../components/UI';
import { Icons } from '../components/Icons';
import { getHealth, getQueueStats } from '../services/api';
import { HealthStatus, QueueStats } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from 'recharts';

const mockChartData = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  latency: Math.floor(Math.random() * 200 + 100),
  errors: Math.floor(Math.random() * 5)
}));

const Metric: React.FC<{ label: string; value: string | number; trend?: number; icon: any; onClick?: () => void }> = ({ label, value, trend, icon: Icon, onClick }) => (
  <Card className="hover:shadow-md transition-all cursor-pointer group" onClick={onClick}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">{value}</h3>
        {trend !== undefined && (
          <div className={`mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${trend > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {trend > 0 ? <Icons.TrendUp size={12} /> : <Icons.TrendDown size={12} />}
            <span>{Math.abs(trend)}% delta</span>
          </div>
        )}
      </div>
      <div className="p-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg group-hover:bg-brand-500 group-hover:text-white transition-all">
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

const Overview: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [h, s] = await Promise.all([getHealth(), getQueueStats()]);
      setHealth(h);
      setStats(s);
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const anomalies = [
    { id: 'AN-001', type: 'Duplicate Stream', merchant: 'MERC-5', source: 'GATEWAY-PRIME', time: '2m ago', severity: 'critical' },
    { id: 'AN-002', type: 'Latency Spike', merchant: 'GLOBAL', source: 'REDIS-CLUSTER-3', time: '14m ago', severity: 'warning' },
    { id: 'AN-003', type: 'Auth Failures', merchant: 'MERC-12', source: 'COGNITO-BRIDGE', time: '45m ago', severity: 'warning' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
         <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">System Fleet Overview</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operational Telemetry • {new Date().toLocaleTimeString()}</p>
         </div>
         <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setActiveModal('past-24h')}><Icons.Clock size={14} className="mr-2" /> Report v1.4</Button>
            <Button size="sm" onClick={() => navigate('/health')}><Icons.Refresh size={14} className="mr-2" /> Full Health</Button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Health Score" value={health?.status === 'healthy' ? '99.9%' : '85.2%'} icon={Icons.Health} onClick={() => setActiveModal('health-drilldown')} />
        <Metric label="Queue Depth" value={stats?.ApproximateNumberOfMessages || 0} trend={12} icon={Icons.Dashboard} onClick={() => setActiveModal('queue-drilldown')} />
        <Metric label="Avg Latency" value="124ms" trend={-4} icon={Icons.Clock} onClick={() => setActiveModal('latency-drilldown')} />
        <Metric label="Total Daily Vol" value="$2.4M" trend={8} icon={Icons.Payments} onClick={() => navigate('/payments')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Traffic & Latency Trends" actions={<Icons.More size={16} className="text-slate-500 cursor-pointer" />}>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#16181D', border: '1px solid #2D3139', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#0ea5e9' }}
                />
                <Area type="monotone" dataKey="latency" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorLat)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Error Frequency" actions={<Icons.Error size={16} className="text-rose-500 cursor-pointer" />}>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#16181D', border: '1px solid #2D3139', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Line type="stepAfter" dataKey="errors" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Operational Anomalies" className="lg:col-span-2" actions={<Button size="sm" variant="ghost" onClick={() => navigate('/alerts')}>View Inbox</Button>}>
           <div className="space-y-3">
              {anomalies.map(anomaly => (
                <div 
                  key={anomaly.id} 
                  onClick={() => { setSelectedAnomaly(anomaly); setActiveModal('anomaly-inspector'); }}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-enterprise-border-light dark:border-enterprise-border-dark hover:border-brand-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      anomaly.severity === 'critical' ? 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500' : 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500'
                    } group-hover:text-white`}>
                      <Icons.Alerts size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-tight">{anomaly.type}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{anomaly.merchant} • {anomaly.source} • {anomaly.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <Badge variant={anomaly.severity === 'critical' ? 'error' : 'warning'}>{anomaly.severity}</Badge>
                     <Icons.ChevronRight size={16} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>
                </div>
              ))}
           </div>
        </Card>
        
        <Card title="Fleet Saturation">
           <div className="space-y-6 py-2">
              {[
                { label: 'Worker Utilization', value: 78, color: 'bg-brand-500' },
                { label: 'DB Pool usage', value: 45, color: 'bg-emerald-500' },
                { label: 'Memory index', value: 92, color: 'bg-amber-500' },
                { label: 'Ingestion Backlog', value: 15, color: 'bg-brand-500' }
              ].map(res => (
                <div key={res.label}>
                   <div className="flex justify-between text-[10px] font-bold mb-2 uppercase tracking-widest">
                     <span className="text-slate-500">{res.label}</span>
                     <span className="font-mono text-slate-900 dark:text-white">{res.value}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${res.color} transition-all duration-1000 ease-out`} style={{ width: `${res.value}%` }}></div>
                   </div>
                </div>
              ))}
           </div>
        </Card>
      </div>

      {/* Metrics Modals */}
      <Modal 
        isOpen={activeModal === 'queue-drilldown'} 
        onClose={() => setActiveModal(null)} 
        title="Ingestion Queue Inspector"
        actions={<Button onClick={() => setActiveModal(null)}>Close</Button>}
      >
         <div className="space-y-6">
            <div className="p-4 bg-brand-500/5 border border-brand-500/20 rounded-lg">
               <h4 className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">Real-time SQS Metrics</h4>
               <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-mono font-bold">{stats?.ApproximateNumberOfMessages}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Visible</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-mono font-bold text-brand-500">{stats?.ApproximateNumberOfMessagesInFlight}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">In Flight</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-mono font-bold text-rose-500">{stats?.ApproximateNumberOfMessagesInDeadLetterQueue}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">DLQ</p>
                  </div>
               </div>
            </div>
            <div className="h-40 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center text-slate-600 font-mono text-xs">
               [HISTORICAL QUEUE CHART PLACEHOLDER]
            </div>
         </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'health-drilldown'} 
        onClose={() => setActiveModal(null)} 
        title="System Cluster Health"
        actions={<Button onClick={() => setActiveModal(null)}>Close</Button>}
      >
         <div className="space-y-4">
            {health && Object.entries(health.checks).map(([name, check]) => (
               <div key={name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-enterprise-border-light dark:border-enterprise-border-dark">
                  <div className="flex items-center gap-3">
                     <Icons.Dashboard size={16} className="text-brand-500" />
                     <span className="text-sm font-bold uppercase tracking-widest">{name}</span>
                  </div>
                  <Badge variant={check.status === 'healthy' ? 'success' : 'error'}>{check.status}</Badge>
               </div>
            ))}
         </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'latency-drilldown'} 
        onClose={() => setActiveModal(null)} 
        title="Global Latency Distribution"
        actions={<Button onClick={() => setActiveModal(null)}>Close</Button>}
      >
         <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <Card title="P95 Latency"><p className="text-3xl font-mono font-bold text-brand-500">245ms</p></Card>
               <Card title="P99 Latency"><p className="text-3xl font-mono font-bold text-rose-500">892ms</p></Card>
            </div>
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 text-brand-300 font-mono text-xs italic">
               Cluster node report: eu-central-1 reporting slight network jitter on egress paths.
            </div>
         </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'anomaly-inspector' && !!selectedAnomaly} 
        onClose={() => setActiveModal(null)} 
        title={`Anomaly Inspector: ${selectedAnomaly?.id}`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>Dismiss</Button>
            <Button variant="primary" onClick={() => navigate('/alerts')}>Escalate to On-Call</Button>
          </>
        }
      >
         <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-rose-500/5 border border-rose-500/20 rounded-lg">
               <div className="p-2 bg-rose-500 text-white rounded shadow-lg shadow-rose-500/20">
                  <Icons.Alerts size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-bold uppercase tracking-tight">{selectedAnomaly?.type}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">System detected unusual processing patterns matching known fraud signatures or duplicate ingestion streams.</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-widest">
               <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-enterprise-border-light dark:border-enterprise-border-dark">
                  <p className="text-slate-500 mb-1">Source Cluster</p>
                  <p className="font-mono">{selectedAnomaly?.source}</p>
               </div>
               <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-enterprise-border-light dark:border-enterprise-border-dark">
                  <p className="text-slate-500 mb-1">Affected Entity</p>
                  <p className="font-mono">{selectedAnomaly?.merchant}</p>
               </div>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default Overview;
