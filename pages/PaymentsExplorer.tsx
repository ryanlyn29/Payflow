
import React, { useState, useEffect } from 'react';
import { Card, DataTable, Badge, Button, Dropdown, DropdownItem, Modal, Input } from '../components/UI';
import { Icons } from '../components/Icons';
import { getTransactions, getAuditLogs } from '../services/api';
import { Transaction, AuditLog } from '../types';

export const PaymentsExplorer: React.FC = () => {
  const [data, setData] = useState<Transaction[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await getTransactions();
    setData(res.transactions);
    setLoading(false);
  };

  const handleRowClick = async (tx: Transaction) => {
    setSelectedTx(tx);
    setDrawerOpen(true);
    const logs = await getAuditLogs(tx.payment_transaction_id);
    setAuditLogs(logs.logs);
  };

  const filteredData = data.filter(t => {
    const matchesSearch = t.payment_transaction_id.toLowerCase().includes(search.toLowerCase()) || 
                          t.merchant_id.toLowerCase().includes(search.toLowerCase());
    const matchesDate = dateFilter ? t.created_at.startsWith(dateFilter) : true;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-enterprise-surface-light dark:bg-enterprise-surface-dark p-4 rounded-lg border border-enterprise-border-light dark:border-enterprise-border-dark">
        <div className="flex flex-1 gap-3 w-full">
          <Input 
            placeholder="Filter by ID, Merchant, or Payer..." 
            icon={Icons.Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="w-48">
             <Input 
               type="date"
               value={dateFilter}
               onChange={(e) => setDateFilter(e.target.value)}
             />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={loadData}>
            <Icons.Refresh size={14} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sync
          </Button>
          <Button size="md">
            <Icons.Plus size={14} className="mr-2" /> New Ingest
          </Button>
        </div>
      </div>

      <Card>
        <DataTable 
          isLoading={isLoading}
          columns={[
            { header: 'ID (SHARD)', key: 'payment_transaction_id', render: (val) => <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{val}</span> },
            { header: 'Merchant Cluster', key: 'merchant_id' },
            { header: 'Gross Vol', key: 'amount', render: (val, row) => <span className="font-mono font-bold">${(val / 100).toFixed(2)} {row.currency}</span> },
            { header: 'Lifecycle', key: 'current_state', render: (val) => <Badge variant={val === 'completed' ? 'success' : val === 'failed' ? 'error' : 'warning'}>{val}</Badge> },
            { header: 'Hops', key: 'retry_count', render: (val) => <span className={val > 2 ? 'text-rose-500 font-bold' : ''}>{val}</span> },
            { header: 'Ingest Time', key: 'created_at', render: (val) => <span className="text-[10px] font-mono font-bold uppercase text-slate-500">{new Date(val).toLocaleString()}</span> },
            { header: '', key: 'actions', render: (val, row) => (
              <Dropdown trigger={<Icons.More size={16} className="text-slate-400 hover:text-white transition-colors cursor-pointer" />}>
                 <DropdownItem icon={Icons.ExternalLink} onClick={() => handleRowClick(row)}>Inspect Trace</DropdownItem>
                 <DropdownItem icon={Icons.Incident} onClick={() => {}}>Replay Event</DropdownItem>
                 <DropdownItem icon={Icons.Dashboard} onClick={() => {}}>View Metrics</DropdownItem>
                 <div className="border-t border-enterprise-border-light dark:border-enterprise-border-dark my-1" />
                 <DropdownItem icon={Icons.Trash} danger onClick={() => {}}>Purge Shard</DropdownItem>
              </Dropdown>
            ) }
          ]}
          data={filteredData}
          onRowClick={handleRowClick}
        />
      </Card>

      {/* Drill-down Sidebar (Drawer) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[110] overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-enterprise-surface-light dark:bg-enterprise-surface-dark border-l border-enterprise-border-light dark:border-enterprise-border-dark shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-400">
            <div className="p-6 border-b border-enterprise-border-light dark:border-enterprise-border-dark flex items-center justify-between shrink-0">
              <div>
                 <h2 className="text-xl font-bold font-mono text-brand-500">{selectedTx?.payment_transaction_id}</h2>
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Lifecycle Inspector • Trace ACTIVE</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                <Icons.X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               <section>
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Transaction Snapshot</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded border border-enterprise-border-light dark:border-enterprise-border-dark">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status</p>
                      <Badge variant={selectedTx?.current_state === 'completed' ? 'success' : 'error'}>{selectedTx?.current_state}</Badge>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded border border-enterprise-border-light dark:border-enterprise-border-dark">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Value</p>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">${(selectedTx?.amount || 0 / 100).toFixed(2)} {selectedTx?.currency}</p>
                    </div>
                 </div>
               </section>

               <section>
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Event Timeline (Trace)</h3>
                 <div className="space-y-0 relative">
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />
                    {auditLogs.map((log, idx) => (
                      <div key={idx} className="relative pl-12 pb-8 animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                         <div className={`absolute left-2.5 top-1 w-5 h-5 rounded-full border-4 border-enterprise-surface-light dark:border-enterprise-surface-dark z-10 transition-colors shadow-sm ${
                           log.new_state === 'completed' ? 'bg-emerald-500' : 
                           log.new_state === 'failed' ? 'bg-rose-500' : 'bg-brand-500'
                         }`} />
                         <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-enterprise-border-light dark:border-enterprise-border-dark hover:border-brand-500/50 transition-colors cursor-default">
                            <div className="flex justify-between items-start mb-2">
                               <h4 className="text-sm font-bold capitalize tracking-tight">{log.event_type.replace(/_/g, ' ')}</h4>
                               <span className="text-[10px] font-mono text-slate-500 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Service: <span className="font-mono text-brand-500">{log.source_service}</span></p>
                            <div className="text-[10px] flex items-center gap-2">
                               <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-slate-500 font-bold">{log.previous_state || 'ORIGIN'}</span>
                               <Icons.ChevronRight size={10} className="text-slate-600" />
                               <span className="px-1.5 py-0.5 bg-brand-500/10 text-brand-500 rounded font-mono font-bold border border-brand-500/20">{log.new_state}</span>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               </section>

               <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metadata Payload</h3>
                    <Button variant="ghost" size="sm" onClick={() => {}}><Icons.X size={12} className="mr-1" /> Copy JSON</Button>
                  </div>
                  <div className="p-4 bg-slate-950 text-brand-400 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto whitespace-pre shadow-inner">
                    {JSON.stringify(selectedTx?.metadata || {}, null, 2)}
                  </div>
               </section>
            </div>

            <div className="p-6 border-t border-enterprise-border-light dark:border-enterprise-border-dark flex gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
               <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>Close Trace</Button>
               <Button variant="primary" className="flex-1" onClick={() => {}}>Force Re-Process</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsExplorer;
