
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Badge, Button, Modal, DataTable } from '../components/UI';
import { Icons } from '../components/Icons';
import { HelpIcon } from '../components/Tooltip';
import { WelcomeBanner } from '../components/WelcomeBanner';
import { getHealth, getQueueStats } from '../services/api';
import { HealthStatus, QueueStats } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from 'recharts';

const Metric: React.FC<React.HTMLAttributes<HTMLDivElement> & { 
  label: string; 
  value: string | number; 
  trend?: number; 
  icon: any; 
  onClick?: () => void;
  help?: string;
}> = ({ label, value, trend, icon: Icon, onClick, help, ...props }) => (
  <div 
    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 flex items-center justify-between shadow-none transition-colors hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer group"
    onClick={onClick}
    {...props}
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center border bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900">
        <Icon size={22} />
      </div>
      <div>
        {trend !== undefined && (
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{trend > 0 ? '+' : ''}{trend}%</p>
        )}
        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{label}</h4>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
      </div>
    </div>
    <button className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors p-1"><Icons.More size={18} /></button>
  </div>
);

const Overview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [h, s] = await Promise.all([getHealth(), getQueueStats()]);
        setHealth(h);
        setStats(s);
      } catch (err: any) {

        const isConnectionError = err.code === 'ERR_NETWORK' || 
                                  err.code === 'ECONNREFUSED' ||
                                  err.message?.includes('ERR_CONNECTION_REFUSED') ||
                                  err.message?.includes('Network Error') ||
                                  err.silent;
        
        if (!isConnectionError) {
          setError(err.message || 'Failed to load dashboard data');
          console.error('Failed to fetch overview data:', err);
        } else {

          setError(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const anomalies: any[] = [];

  const filteredAnomalies = searchQuery 
    ? anomalies.filter(a => 
        a.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.source?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : anomalies;

  const chartData: any[] = [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Loading Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <Card className="p-8 text-center max-w-md">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.Error size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Failed to Load Dashboard</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 font-['Plus_Jakarta_Sans'] text-slate-900 dark:text-slate-100">
      {searchQuery && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icons.Search size={18} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
              Search results for: <span className="font-extrabold">"{searchQuery}"</span>
            </span>
            <Badge variant="info">{filteredAnomalies.length} result{filteredAnomalies.length !== 1 ? 's' : ''}</Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              navigate('/dashboard');
            }}
          >
            <Icons.X size={14} className="mr-2" /> Clear
          </Button>
        </div>
      )}
      {}
      <div className="bg-[#2563eb] rounded-lg p-10 relative overflow-hidden flex flex-col items-start justify-center min-h-[260px] border border-blue-400/20 shadow-none">
        <div className="relative z-10 max-w-xl">
          <p className="text-blue-100/80 text-[10px] font-black uppercase tracking-[0.3em] mb-4">System Status</p>
          <h2 className="text-white text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-10">
            Monitor Your <br/> Operations in Real-Time
          </h2>
          <Button 
            variant="secondary" 
            size="md" 
            className="!rounded-full px-8 py-3 text-sm font-bold flex items-center gap-2 shadow-none hover:bg-slate-50"
            onClick={() => navigate('/health')}
          >
            View Health 
            <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white">
              <Icons.ChevronRight size={14} />
            </div>
          </Button>
        </div>
        {}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-10 text-white pointer-events-none">
          <Icons.Health size={200} />
        </div>
        <div className="absolute right-48 top-20 opacity-10 text-white pointer-events-none">
          <Icons.Dashboard size={80} />
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Metric 
          label="Health Score" 
          value={health?.status === 'healthy' ? '99.9%' : '85.2%'} 
          icon={Icons.Health} 
          onClick={() => setActiveModal('health-drilldown')}
          help="Overall system health based on PostgreSQL, Redis, and service status"
          data-demo="health-score"
        />
        <Metric 
          label="Queue Depth" 
          value={stats?.ApproximateNumberOfMessages || 0} 
          trend={12} 
          icon={Icons.Dashboard} 
          onClick={() => setActiveModal('queue-drilldown')}
          help="Number of messages waiting in the processing queue"
          data-demo="queue-depth"
        />
        <Metric 
          label="Avg Latency" 
          value="124ms" 
          trend={-4} 
          icon={Icons.Clock} 
          onClick={() => setActiveModal('latency-drilldown')}
          help="Average response time for API requests"
          data-demo="latency"
        />
        <Metric 
          label="Total Daily Vol" 
          value="$2.4M" 
          trend={8} 
          icon={Icons.Payments} 
          onClick={() => navigate('/payments')}
          help="Total transaction volume processed today"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Traffic & Latency Trends" className="dark:bg-slate-800 dark:border-slate-700" actions={<Icons.More size={16} className="text-slate-500 dark:text-slate-400 cursor-pointer" />}>
          <div className="h-64 mt-4 min-h-[256px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <AreaChart data={chartData}>
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
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">
                No chart data available
              </div>
            )}
          </div>
        </Card>

        <Card title="Error Frequency" actions={<Icons.Error size={16} className="text-rose-500 cursor-pointer" />}>
          <div className="h-64 mt-4 min-h-[256px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#16181D', border: '1px solid #2D3139', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Line type="stepAfter" dataKey="errors" stroke="#f43f5e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">
                No chart data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Operational Anomalies</h3>
          <button className="text-sm font-black text-[#2563eb] hover:underline uppercase tracking-widest" onClick={() => navigate('/alerts')}>See all</button>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-none">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-900/50">
              <tr>
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Severity</th>
                <th className="px-8 py-5">Source</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAnomalies.length > 0 ? filteredAnomalies.map(anomaly => (
                <tr 
                  key={anomaly.id}
                  onClick={() => { setSelectedAnomaly(anomaly); setActiveModal('anomaly-inspector'); }}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-[10px] ${
                        anomaly.severity === 'critical' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      }`}>
                        <Icons.Alerts size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{anomaly.type}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{anomaly.merchant}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant={anomaly.severity === 'critical' ? 'error' : 'warning'}>{anomaly.severity}</Badge>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-bold">{anomaly.source}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 transition-all ml-auto">
                      <Icons.ExternalLink size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <Icons.Health size={48} className="text-slate-300 dark:text-slate-700" />
                      <p>{searchQuery ? `No results found for "${searchQuery}"` : 'No anomalies detected'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      {}
      <section className="space-y-6">
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Fleet Saturation</h3>
        <Card>
          <div className="space-y-6 py-2">
            {[
              { label: 'Worker Utilization', value: 78, color: 'bg-[#2563eb]' },
              { label: 'DB Pool usage', value: 45, color: 'bg-emerald-500' },
              { label: 'Memory index', value: 92, color: 'bg-amber-500' },
              { label: 'Ingestion Backlog', value: 15, color: 'bg-[#2563eb]' }
            ].map(res => (
              <div key={res.label}>
                <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest">
                  <span className="text-slate-400 dark:text-slate-500">{res.label}</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{res.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${res.color} transition-all duration-1000 ease-out`} style={{ width: `${res.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {}
      <Modal 
        isOpen={activeModal === 'queue-drilldown'} 
        onClose={() => setActiveModal(null)} 
        title="Ingestion Queue Inspector"
        actions={<Button onClick={() => setActiveModal(null)}>Close</Button>}
      >
         <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
               <h4 className="text-xs font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-2">Real-time SQS Metrics</h4>
               <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-mono font-extrabold text-slate-900 dark:text-slate-100">{stats?.ApproximateNumberOfMessages || 0}</p>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Visible</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-mono font-extrabold text-[#2563eb]">{stats?.ApproximateNumberOfMessagesInFlight || 0}</p>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">In Flight</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-mono font-extrabold text-rose-600">{stats?.ApproximateNumberOfMessagesInDeadLetterQueue || 0}</p>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">DLQ</p>
                  </div>
               </div>
            </div>
            <div className="h-40 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">
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
               <div key={name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                     <Icons.Dashboard size={16} className="text-[#2563eb]" />
                     <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{name}</span>
                  </div>
                  <Badge variant={(check as any)?.status === 'healthy' ? 'success' : 'error'}>{(check as any)?.status || 'unknown'}</Badge>
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
               <Card title="P95 Latency"><p className="text-3xl font-mono font-extrabold text-[#2563eb]">245ms</p></Card>
               <Card title="P99 Latency"><p className="text-3xl font-mono font-extrabold text-rose-600">892ms</p></Card>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs">
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
            <div className="flex items-center gap-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
               <div className="p-2 bg-rose-500 text-white rounded-lg">
                  <Icons.Alerts size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{selectedAnomaly?.type}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">System detected unusual processing patterns matching known fraud signatures or duplicate ingestion streams.</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Source Cluster</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">{selectedAnomaly?.source}</p>
               </div>
               <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Affected Entity</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">{selectedAnomaly?.merchant}</p>
               </div>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default Overview;
