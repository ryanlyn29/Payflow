
import React from 'react';
import { Card, Button, Badge } from '../components/UI';
// Fixed: Import Icons from components/Icons instead of components/UI
import { Icons } from '../components/Icons';

const Settings: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-8 pb-12">
       <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Global Configuration</h2>
          <Card title="Security & Authentication">
             <div className="space-y-6">
                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Enterprise API Key</label>
                   <div className="flex gap-2">
                      <div className="flex-1 bg-slate-900 border border-slate-800 p-2.5 rounded font-mono text-sm flex items-center justify-between text-slate-300">
                         <span>pk_live_************************3a9f</span>
                         <Icons.Lock size={16} className="text-slate-600" />
                      </div>
                      <Button variant="secondary">Reveal</Button>
                      <Button variant="secondary"><Icons.Refresh size={16} /></Button>
                   </div>
                   <p className="text-[10px] text-slate-500 mt-2">Last rotated 45 days ago. Key has full write permissions to the transaction store.</p>
                </div>

                <div className="pt-6 border-t border-enterprise-border-light dark:border-enterprise-border-dark">
                   <h4 className="text-sm font-bold mb-4">Webhooks Signature</h4>
                   <div className="p-4 bg-brand-500/5 border border-brand-500/20 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-brand-500/20 flex items-center justify-center text-brand-500">
                            <Icons.Lock size={16} />
                         </div>
                         <p className="text-xs text-slate-400">Sign all outgoing requests with HS256 algorithm.</p>
                      </div>
                      <Badge variant="success">Enabled</Badge>
                   </div>
                </div>
             </div>
          </Card>
       </section>

       <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Infrastructure Limits</h2>
          <Card>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h4 className="text-sm font-bold">Rate Limiting</h4>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400">Burst Limit</span>
                         <span className="font-mono">5,000 req/s</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400">Sustain Limit</span>
                         <span className="font-mono">2,500 req/s</span>
                      </div>
                   </div>
                   <Button size="sm" variant="secondary" className="w-full">Edit Limits</Button>
                </div>
                
                <div className="space-y-4">
                   <h4 className="text-sm font-bold">Data Retention</h4>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400">Audit Logs</span>
                         <span className="font-mono">90 Days</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400">Transaction Replay</span>
                         <span className="font-mono">7 Days</span>
                      </div>
                   </div>
                   <Button size="sm" variant="secondary" className="w-full">Configure Archival</Button>
                </div>
             </div>
          </Card>
       </section>

       <div className="flex justify-end gap-3 pt-6 border-t border-enterprise-border-light dark:border-enterprise-border-dark">
          <Button variant="ghost">Discard Changes</Button>
          <Button>Save Settings</Button>
       </div>
    </div>
  );
};

export default Settings;
