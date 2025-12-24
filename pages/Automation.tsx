
import React, { useState } from 'react';
import { Card, Badge, Button, Dropdown, DropdownItem, Modal, Input } from '../components/UI';
import { Icons } from '../components/Icons';

const initialRules = [
  { id: '1', name: 'Duplicate Payment Detector', description: 'Prevents multiple charges for same amount within 30s window.', threshold: '30s', enabled: true },
  { id: '2', name: 'Retry Storm Throttle', description: 'Automatically silences alerts if retry count exceeds 50/sec per region.', threshold: 50, enabled: false },
  { id: '3', name: 'High Failure Escalation', description: 'Escalates to L2 support if failure rate > 15% for 5 consecutive minutes.', threshold: '15%', enabled: true },
  { id: '4', name: 'Geo-Anomaly Check', description: 'Flags transactions originating from multiple disparate ASN ranges within 10 minutes.', threshold: '2+ ASNs', enabled: true }
];

const Automation: React.FC = () => {
  const [rules, setRules] = useState(initialRules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleDelete = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleEdit = (rule: any) => {
    setSelectedRule(rule);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div>
             <h1 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Automation Policies</h1>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detection Engine V2.1 • Latency: 4ms</p>
          </div>
          <Button size="sm" onClick={() => { setSelectedRule(null); setIsModalOpen(true); }}><Icons.Plus size={14} className="mr-2" /> Define Engine Rule</Button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map(rule => (
            <Card key={rule.id}>
               <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-lg transition-colors ${rule.enabled ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                     <Icons.Rules size={20} />
                  </div>
                  <div className="flex items-center gap-4">
                     <button 
                       onClick={() => toggleRule(rule.id)}
                       title={rule.enabled ? "Disable Rule" : "Enable Rule"}
                       className={`w-10 h-5 rounded-full relative transition-colors active:scale-95 ${rule.enabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                     >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${rule.enabled ? 'left-6' : 'left-1'}`} />
                     </button>
                     <Dropdown trigger={<Icons.More size={16} className="text-slate-500 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors" />}>
                        <DropdownItem icon={Icons.Settings} onClick={() => handleEdit(rule)}>Configure Logic</DropdownItem>
                        <DropdownItem icon={Icons.Clock} onClick={() => {}}>View History</DropdownItem>
                        <DropdownItem icon={Icons.Success} onClick={() => {}}>Test against Logs</DropdownItem>
                        <div className="border-t border-enterprise-border-light dark:border-enterprise-border-dark my-1" />
                        <DropdownItem icon={Icons.Trash} danger onClick={() => handleDelete(rule.id)}>Purge Rule</DropdownItem>
                     </Dropdown>
                  </div>
               </div>
               
               <h3 className="font-bold text-lg mb-1 tracking-tight">{rule.name}</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                 {rule.description}
               </p>
               
               <div className="flex items-center justify-between pt-4 border-t border-enterprise-border-light dark:border-enterprise-border-dark">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engine Threshold:</span>
                     <span className="text-xs font-mono font-bold text-brand-500">{rule.threshold}</span>
                  </div>
                  <Badge variant={rule.enabled ? 'success' : 'neutral'}>{rule.enabled ? 'Operational' : 'Hibernated'}</Badge>
               </div>
            </Card>
          ))}
       </div>

       <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={selectedRule ? "Reconfigure Logic Engine" : "Create Detection Signature"}
          actions={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Discard</Button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>Commit Policy</Button>
            </>
          }
       >
          <div className="space-y-4">
             <Input label="Rule Signature Name" placeholder="e.g. Velocity Check" value={selectedRule?.name} />
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logic Description</label>
                <textarea className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-enterprise-border-light dark:border-enterprise-border-dark rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-slate-900 dark:text-slate-100 min-h-[80px]" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Input label="Threshold Value" placeholder="30s" value={selectedRule?.threshold?.toString()} />
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logic Operator</label>
                   <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-enterprise-border-light dark:border-enterprise-border-dark rounded-md text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-brand-500">
                      <option>Less Than (&lt;)</option>
                      <option>Greater Than (&gt;)</option>
                      <option>Equal To (=)</option>
                   </select>
                </div>
             </div>
          </div>
       </Modal>
    </div>
  );
};

export default Automation;
