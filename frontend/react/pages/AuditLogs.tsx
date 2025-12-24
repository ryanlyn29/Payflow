
import React, { useState } from 'react';
import { Card, Badge, Button, Input, Modal } from '../components/UI';
import { Icons } from '../components/Icons';
import { useNotification } from '../components/NotificationSystem';

const mockLogs = Array.from({ length: 40 }).map((_, i) => ({
  id: `LOG-${i + 1000}`,
  timestamp: new Date(Date.now() - i * 60000).toISOString(),
  service: ['payment-engine', 'risk-service', 'auth-gate', 'ledger-sync', 'worker-pool-7'][i % 5],
  level: ['INFO', 'WARN', 'ERROR', 'DEBUG'][i % 4],
  message: `Shard Processed: Event for TXN-${i + 2000}. Result: COMPLETED. CRC: ${Math.random().toString(36).substring(7).toUpperCase()}`,
  payload: { user_id: 'USR-88', ip: '1.1.1.1', cluster: 'us-east-1', thread: i % 10 }
}));

const AuditLogs: React.FC = () => {
  const [logs] = useState(mockLogs);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [isParametersOpen, setParametersOpen] = useState(false);
  const { showNotification } = useNotification();

  const filteredLogs = logs.filter(l => 
    l.message.toLowerCase().includes(search.toLowerCase()) ||
    l.service.toLowerCase().includes(search.toLowerCase()) ||
    l.level.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-12 font-['Plus_Jakarta_Sans'] text-slate-900 dark:text-slate-100">
       <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Audit Logs</h1>
       
       <Card title="Operational Log Stream">
          <div className="flex flex-col gap-4">
             <div className="flex gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <Input 
                  placeholder="Filter by keyword, service ID, or shard index..." 
                  icon={Icons.Search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button 
                  variant="secondary" 
                  size="md" 
                  onClick={() => setParametersOpen(true)}
                >
                  <Icons.Filter size={14} className="mr-2" /> Parameters
                </Button>
                <Button 
                  variant="ghost" 
                  size="md" 
                  onClick={() => {
                    setSearch('');
                    showNotification({
                      type: 'success',
                      message: 'Search cleared',
                      duration: 2000,
                    });
                  }}
                >
                  <Icons.Trash size={14} />
                </Button>
             </div>
             
             <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] overflow-hidden flex flex-col h-[650px] shadow-none">
                <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                   <div className="flex gap-4 text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                      <span className="w-24">Timestamp</span>
                      <span className="w-16">Level</span>
                      <span className="w-32">Source</span>
                      <span>Message</span>
                   </div>
                   <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live</span>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                   {filteredLogs.map(log => (
                     <div 
                       key={log.id} 
                       className="group flex gap-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 cursor-pointer rounded-lg transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                       onClick={() => setSelectedLog(log)}
                     >
                       <span className="text-slate-500 dark:text-slate-400 shrink-0 w-24 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                       <span className={`shrink-0 w-16 font-extrabold ${
                         log.level === 'ERROR' ? 'text-rose-600 dark:text-rose-400' : 
                         log.level === 'WARN' ? 'text-amber-600 dark:text-amber-400' : 
                         log.level === 'INFO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                       }`}>{log.level}</span>
                       <span className="text-[#2563eb] dark:text-blue-400 shrink-0 w-32 font-extrabold uppercase">[{log.service}]</span>
                       <span className="text-slate-700 dark:text-slate-300 truncate font-medium">{log.message}</span>
                       <Icons.ExternalLink size={12} className="opacity-0 group-hover:opacity-100 text-[#2563eb] dark:text-blue-400 ml-auto transition-opacity" />
                     </div>
                   ))}
                   {filteredLogs.length === 0 && (
                      <div className="py-20 text-center text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-[0.2em]">
                         Zero matches found for query index.
                      </div>
                   )}
                </div>
             </div>
          </div>
       </Card>

       <Modal 
          isOpen={!!selectedLog} 
          onClose={() => setSelectedLog(null)} 
          title="Shard Log Inspector"
          actions={
             <>
                <Button variant="ghost" onClick={() => setSelectedLog(null)}>Dismiss</Button>
                <Button variant="primary" onClick={() => {}}>Trace ID: {selectedLog?.id}</Button>
             </>
          }
       >
          <div className="space-y-6">
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Log Level</p>
                   <Badge variant={selectedLog?.level === 'ERROR' ? 'error' : selectedLog?.level === 'WARN' ? 'warning' : 'info'}>{selectedLog?.level}</Badge>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 text-right">Source Cluster</p>
                   <p className="text-sm font-extrabold text-[#2563eb] dark:text-blue-400 font-mono">{selectedLog?.service}</p>
                </div>
             </div>
             <div className="space-y-4">
                <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed">{selectedLog?.message}</p>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Metadata Context</p>
                    <Button variant="ghost" size="sm" onClick={() => {}}><Icons.ExternalLink size={12} className="mr-1" /> Copy</Button>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs whitespace-pre">
                    {JSON.stringify(selectedLog?.payload || {}, null, 2)}
                  </div>
                </div>
             </div>
          </div>
       </Modal>

       <Modal
         isOpen={isParametersOpen}
         onClose={() => setParametersOpen(false)}
         title="Filter Parameters"
         actions={
           <>
             <Button variant="ghost" onClick={() => setParametersOpen(false)}>Cancel</Button>
             <Button onClick={() => {
               setParametersOpen(false);
               showNotification({
                 type: 'success',
                 message: 'Filter parameters applied',
                 duration: 3000,
               });
             }}>Apply Filters</Button>
           </>
         }
       >
         <div className="space-y-4">
           <div>
             <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Log Level</label>
             <select className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100">
               <option>All Levels</option>
               <option>ERROR</option>
               <option>WARN</option>
               <option>INFO</option>
               <option>DEBUG</option>
             </select>
           </div>
           <div>
             <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Service</label>
             <select className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100">
               <option>All Services</option>
               <option>node-api</option>
               <option>go-worker</option>
             </select>
           </div>
           <div>
             <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Time Range</label>
             <select className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100">
               <option>Last Hour</option>
               <option>Last 24 Hours</option>
               <option>Last 7 Days</option>
               <option>Last 30 Days</option>
             </select>
           </div>
         </div>
       </Modal>
    </div>
  );
};

export default AuditLogs;
