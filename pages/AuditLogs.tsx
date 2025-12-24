
import React, { useState } from 'react';
// Fix: Import Icons from components/Icons instead of components/UI
import { Card, Badge, Button, Input, Modal } from '../components/UI';
import { Icons } from '../components/Icons';

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

  const filteredLogs = logs.filter(l => 
    l.message.toLowerCase().includes(search.toLowerCase()) ||
    l.service.toLowerCase().includes(search.toLowerCase()) ||
    l.level.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
       <Card title="Operational Log Stream">
          <div className="flex flex-col gap-4">
             <div className="flex gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-enterprise-border-light dark:border-enterprise-border-dark">
                <Input 
                  placeholder="Filter by keyword, service ID, or shard index..." 
                  icon={Icons.Search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button variant="secondary" size="md" onClick={() => {}}><Icons.Filter size={14} className="mr-2" /> Parameters</Button>
                {/* Fix: Removed unsupported 'title' prop from Button component */}
                <Button variant="ghost" size="md" onClick={() => setSearch('')}><Icons.Trash size={14} /></Button>
             </div>
             
             <div className="bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] overflow-hidden flex flex-col h-[650px] shadow-2xl">
                <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                   <div className="flex gap-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                      <span className="w-24">Timestamp</span>
                      <span className="w-16">Level</span>
                      <span className="w-32">Source</span>
                      <span>Message</span>
                   </div>
                   <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                   {filteredLogs.map(log => (
                     <div 
                       key={log.id} 
                       className="group flex gap-4 hover:bg-brand-500/10 p-1 cursor-pointer rounded transition-all border border-transparent hover:border-brand-500/20"
                       onClick={() => setSelectedLog(log)}
                     >
                       <span className="text-slate-500 shrink-0 w-24 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                       <span className={`shrink-0 w-16 font-extrabold ${
                         log.level === 'ERROR' ? 'text-rose-500' : 
                         log.level === 'WARN' ? 'text-amber-500' : 
                         log.level === 'INFO' ? 'text-emerald-500' : 'text-slate-600'
                       }`}>{log.level}</span>
                       <span className="text-brand-500 shrink-0 w-32 font-bold uppercase">[{log.service}]</span>
                       <span className="text-slate-300 truncate font-medium">{log.message}</span>
                       <Icons.ExternalLink size={12} className="opacity-0 group-hover:opacity-100 text-brand-500 ml-auto transition-opacity" />
                     </div>
                   ))}
                   {filteredLogs.length === 0 && (
                      <div className="py-20 text-center text-slate-600 font-bold uppercase tracking-[0.2em] italic">
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
             <div className="flex justify-between border-b border-enterprise-border-light dark:border-enterprise-border-dark pb-4">
                <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Log Level</p>
                   <Badge variant={selectedLog?.level === 'ERROR' ? 'error' : selectedLog?.level === 'WARN' ? 'warning' : 'info'}>{selectedLog?.level}</Badge>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-right">Source Cluster</p>
                   <p className="text-sm font-bold text-brand-500 font-mono">{selectedLog?.service}</p>
                </div>
             </div>
             <div className="space-y-4">
                <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed">{selectedLog?.message}</p>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Metadata Context</p>
                    <Button variant="ghost" size="sm" onClick={() => {}}><Icons.ExternalLink size={12} className="mr-1" /> Copy</Button>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-brand-300 font-mono text-xs whitespace-pre shadow-inner">
                    {JSON.stringify(selectedLog?.payload || {}, null, 2)}
                  </div>
                </div>
             </div>
          </div>
       </Modal>
    </div>
  );
};

export default AuditLogs;
