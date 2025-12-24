
import React, { useState, useEffect } from 'react';
import { Card, DataTable, Badge, Button, Dropdown, DropdownItem, Modal, Input } from '../components/UI';
import { Icons } from '../components/Icons';
import { HelpIcon } from '../components/Tooltip';
import { useNotification } from '../components/NotificationSystem';
import { DatePicker } from '../components/DatePicker';
import { getTransactions, getAuditLogs, createTransaction } from '../services/api';
import { Transaction, AuditLog, PaymentTransactionState } from '../types';

export const PaymentsExplorer: React.FC = () => {
  const [data, setData] = useState<Transaction[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ingestForm, setIngestForm] = useState({
    merchant_id: '',
    amount: '',
    currency: 'USD',
    payer_id: '',
    current_state: 'pending' as PaymentTransactionState,
    metadata: ''
  });
  const { showNotification } = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getTransactions();

      const sortedTransactions = [...res.transactions].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setData(sortedTransactions);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (tx: Transaction) => {
    setSelectedTx(tx);
    setDrawerOpen(true);
    try {
      const logs = await getAuditLogs(tx.payment_transaction_id);
      setAuditLogs(logs.logs);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setAuditLogs([]);
    }
  };

  const filteredData = data.filter(t => {
    const matchesSearch = t.payment_transaction_id.toLowerCase().includes(search.toLowerCase()) || 
                          t.merchant_id.toLowerCase().includes(search.toLowerCase());
    const matchesDate = dateFilter ? t.created_at.startsWith(dateFilter) : true;
    return matchesSearch && matchesDate;
  });

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ingestForm.merchant_id || !ingestForm.amount) {
      showNotification({
        type: 'error',
        message: 'Please fill in required fields (Merchant ID and Amount)',
        duration: 3000,
      });
      return;
    }

    const amount = parseFloat(ingestForm.amount);
    if (isNaN(amount) || amount <= 0) {
      showNotification({
        type: 'error',
        message: 'Amount must be a positive number',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let metadata = {};
      if (ingestForm.metadata.trim()) {
        try {
          metadata = JSON.parse(ingestForm.metadata);
        } catch (err) {
          showNotification({
            type: 'error',
            message: 'Invalid JSON in metadata field',
            duration: 3000,
          });
          setIsSubmitting(false);
          return;
        }
      }

      const transactionData: {
        merchant_id: string;
        amount: number;
        currency?: string;
        payer_id?: string;
        current_state?: string;
        metadata?: Record<string, any>;
      } = {
        merchant_id: ingestForm.merchant_id.trim(),
        amount: amount,
        currency: ingestForm.currency,
        current_state: ingestForm.current_state
      };

      if (ingestForm.payer_id && ingestForm.payer_id.trim()) {
        transactionData.payer_id = ingestForm.payer_id.trim();
      }

      if (Object.keys(metadata).length > 0) {
        transactionData.metadata = metadata;
      }

      const newTransaction = await createTransaction(transactionData);

      showNotification({
        type: 'success',
        message: 'Transaction ingested successfully',
        duration: 3000,
      });

      setIngestForm({
        merchant_id: '',
        amount: '',
        currency: 'USD',
        payer_id: '',
        current_state: 'pending',
        metadata: ''
      });

      setIsIngestModalOpen(false);

      await new Promise(resolve => setTimeout(resolve, 100));
      await loadData(); // Refresh the list
    } catch (err: any) {
      console.error('Failed to ingest transaction:', err);
      
      let errorMessage = 'Failed to ingest transaction';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error.message || errorMessage;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        errorMessage = 'Unable to connect to server. Please check if the backend is running.';
      }
      
      showNotification({
        type: 'error',
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 pb-12 font-['Plus_Jakarta_Sans'] relative h-full text-slate-900 dark:text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Payments Explorer</h1>
      </div>
      
      <Card className="p-6 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full">
            <Input 
              placeholder="Filter by ID, Merchant, or Payer..." 
              icon={Icons.Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="w-48">
               <DatePicker
                 value={dateFilter}
                 onChange={setDateFilter}
                 placeholder="Select date"
               />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={loadData}>
              <Icons.Refresh size={14} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sync
            </Button>
            <Button 
              size="md"
              onClick={() => setIsIngestModalOpen(true)}
              data-demo="new-ingest"
            >
              <Icons.Plus size={14} className="mr-2" /> New Ingest
            </Button>
          </div>
        </div>
      </Card>

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <DataTable 
          isLoading={isLoading}
          columns={[
            { header: 'ID (SHARD)', key: 'payment_transaction_id', render: (val) => <span className="font-mono font-bold text-[#2563eb]">{val}</span> },
            { header: 'Merchant Cluster', key: 'merchant_id' },
            { header: 'Gross Vol', key: 'amount', render: (val, row) => <span className="font-mono font-bold">${(val / 100).toFixed(2)} {row.currency}</span> },
            { header: 'Lifecycle', key: 'current_state', render: (val) => <Badge variant={val === 'completed' ? 'success' : val === 'failed' ? 'error' : 'warning'}>{val}</Badge> },
            { header: 'Hops', key: 'retry_count', render: (val) => <span className={val > 2 ? 'text-rose-600 font-bold' : ''}>{val}</span> },
            { header: 'Ingest Time', key: 'created_at', render: (val) => <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">{new Date(val).toLocaleString()}</span> },
            { header: '', key: 'actions', render: (val, row) => (
              <Dropdown trigger={<Icons.More size={16} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer" />}>
                 <DropdownItem icon={Icons.ExternalLink} onClick={() => handleRowClick(row)}>Inspect Trace</DropdownItem>
                 <DropdownItem icon={Icons.Incident} onClick={() => {}}>Replay Event</DropdownItem>
                 <DropdownItem icon={Icons.Dashboard} onClick={() => {}}>View Metrics</DropdownItem>
                 <div className="border-t border-slate-100 my-1" />
                 <DropdownItem icon={Icons.Trash} danger onClick={() => {}}>Purge Shard</DropdownItem>
              </Dropdown>
            ) }
          ]}
          data={filteredData}
          onRowClick={handleRowClick}
        />
      </Card>

      {}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4" 
          style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div 
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity"
            style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setDrawerOpen(false)} 
          />
          <div 
            className="relative w-full max-w-4xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-all z-[111]"
            style={{ margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 rounded-t-2xl">
              <div>
                 <h2 className="text-xl font-bold font-mono text-[#2563eb]">{selectedTx?.payment_transaction_id}</h2>
                 <p className="text-xs text-slate-500 font-bold mt-1">Lifecycle Inspector • Trace ACTIVE</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <Icons.X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               <section>
                 <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Transaction Snapshot</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">Status</p>
                      <Badge variant={selectedTx?.current_state === 'completed' ? 'success' : 'error'}>{selectedTx?.current_state}</Badge>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">Total Value</p>
                      <p className="font-mono font-bold text-slate-900 dark:text-slate-100">${((selectedTx?.amount || 0) / 100).toFixed(2)} {selectedTx?.currency}</p>
                    </div>
                 </div>
               </section>

               <section>
                 <h3 className="text-sm font-bold text-slate-700 mb-4">Event Timeline (Trace)</h3>
                 <div className="space-y-0 relative">
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />
                    {auditLogs.map((log, idx) => (
                      <div key={idx} className="relative pl-12 pb-8 animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                         <div className={`absolute left-2.5 top-1 w-5 h-5 rounded-full border-4 border-white z-10 transition-colors shadow-sm ${
                           log.new_state === 'completed' ? 'bg-emerald-500' : 
                           log.new_state === 'failed' ? 'bg-rose-500' : 'bg-[#2563eb]'
                         }`} />
                         <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#2563eb]/50 transition-colors cursor-default">
                            <div className="flex justify-between items-start mb-2">
                               <h4 className="text-sm font-bold capitalize text-slate-900 dark:text-slate-100">{log.event_type.replace(/_/g, ' ')}</h4>
                               <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Service: <span className="font-mono text-[#2563eb]">{log.source_service}</span></p>
                            <div className="text-[10px] flex items-center gap-2">
                               <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-slate-500 dark:text-slate-400 font-bold">{log.previous_state || 'ORIGIN'}</span>
                               <Icons.ChevronRight size={10} className="text-slate-600 dark:text-slate-400" />
                               <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#2563eb] dark:text-blue-400 rounded font-mono font-bold border border-blue-200 dark:border-blue-800">{log.new_state}</span>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               </section>

               <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Metadata Payload</h3>
                    <Button variant="ghost" size="sm" onClick={() => {}}><Icons.X size={12} className="mr-1" /> Copy JSON</Button>
                  </div>
                  <div className="p-4 bg-slate-900 text-blue-400 font-mono text-xs rounded-lg border border-slate-700 overflow-x-auto whitespace-pre shadow-inner">
                    {JSON.stringify(selectedTx?.metadata || {}, null, 2)}
                  </div>
               </section>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
               <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>Close Trace</Button>
               <Button variant="primary" className="flex-1" onClick={() => {}}>Force Re-Process</Button>
            </div>
          </div>
        </div>
      )}

      {}
      <Modal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        title="Ingest New Payment Transaction"
        size="lg"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsIngestModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleIngestSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icons.Refresh size={14} className="mr-2 animate-spin" />
                  Ingesting...
                </>
              ) : (
                <>
                  <Icons.Plus size={14} className="mr-2" />
                  Ingest Transaction
                </>
              )}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleIngestSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Merchant ID <span className="text-rose-500">*</span>
              </label>
              <Input
                value={ingestForm.merchant_id}
                onChange={(e) => setIngestForm({ ...ingestForm, merchant_id: e.target.value })}
                placeholder="merchant_123"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Amount <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={ingestForm.amount}
                onChange={(e) => setIngestForm({ ...ingestForm, amount: e.target.value })}
                placeholder="100.00"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Currency
              </label>
              <select
                value={ingestForm.currency}
                onChange={(e) => setIngestForm({ ...ingestForm, currency: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent disabled:opacity-50"
                disabled={isSubmitting}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Payer ID
              </label>
              <Input
                value={ingestForm.payer_id}
                onChange={(e) => setIngestForm({ ...ingestForm, payer_id: e.target.value })}
                placeholder="payer_123"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Initial State
              </label>
              <select
                value={ingestForm.current_state}
                onChange={(e) => setIngestForm({ ...ingestForm, current_state: e.target.value as PaymentTransactionState })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent disabled:opacity-50"
                disabled={isSubmitting}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Metadata (JSON)
            </label>
            <textarea
              value={ingestForm.metadata}
              onChange={(e) => setIngestForm({ ...ingestForm, metadata: e.target.value })}
              placeholder='{"key": "value"}'
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent disabled:opacity-50 resize-none"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Optional: JSON object for additional transaction metadata
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentsExplorer;
