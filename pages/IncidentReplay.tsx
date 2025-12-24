
import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/UI';
// Fixed: Import Icons from components/Icons instead of components/UI
import { Icons } from '../components/Icons';

const IncidentReplay: React.FC = () => {
  const [isReplaying, setReplaying] = useState(false);
  const [step, setStep] = useState(0);

  const steps = [
    { time: '12:00:01', event: 'Connection Established', status: 'success', detail: 'Worker node cluster-7 initiated connection to payment processor prime.' },
    { time: '12:00:03', event: 'TLS Handshake Error', status: 'error', detail: 'Negotiation failed for TXN-9988. Cipher mismatch detected.' },
    { time: '12:00:05', event: 'Automatic Retry', status: 'warning', detail: 'Retry attempt 1/3 triggered by system policy R-104.' },
    { time: '12:00:08', event: 'Database Timeout', status: 'error', detail: 'Storage lock wait timeout exceeded on tx_sharding_node_4.' },
    { time: '12:00:12', event: 'Fallback Routing', status: 'info', detail: 'Routing traffic to DR region us-east-2 secondary gateway.' }
  ];

  const handleStart = () => {
    setReplaying(true);
    setStep(0);
    const interval = setInterval(() => {
      setStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
       <Card title="Time Window Configuration" actions={<Button size="sm" onClick={handleStart} disabled={isReplaying}><Icons.Refresh size={14} className="mr-2" /> Start Replay</Button>}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Time</label>
               <input type="datetime-local" className="w-full bg-slate-50 dark:bg-slate-900 border border-enterprise-border-light dark:border-enterprise-border-dark p-2 rounded text-sm focus:outline-none" defaultValue="2024-03-20T12:00:00" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Time</label>
               <input type="datetime-local" className="w-full bg-slate-50 dark:bg-slate-900 border border-enterprise-border-light dark:border-enterprise-border-dark p-2 rounded text-sm focus:outline-none" defaultValue="2024-03-20T12:05:00" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Playback Speed</label>
               <select className="w-full bg-slate-50 dark:bg-slate-900 border border-enterprise-border-light dark:border-enterprise-border-dark p-2 rounded text-sm focus:outline-none">
                 <option>Real-time (1x)</option>
                 <option>Fast (2x)</option>
                 <option>Turbo (5x)</option>
               </select>
             </div>
          </div>
       </Card>

       <div className="relative">
          <div className="absolute left-[31px] top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="space-y-8">
             {steps.slice(0, isReplaying ? step + 1 : 0).map((s, i) => (
               <div key={i} className={`flex gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                  <div className={`w-16 h-16 rounded-full border-4 border-enterprise-bg-light dark:border-enterprise-bg-dark z-10 shrink-0 flex items-center justify-center text-white ${
                    s.status === 'success' ? 'bg-emerald-500' :
                    s.status === 'error' ? 'bg-rose-500' :
                    s.status === 'warning' ? 'bg-amber-500' : 'bg-brand-500'
                  }`}>
                    <Icons.Clock size={24} />
                  </div>
                  <Card className="flex-1">
                     <div className="flex justify-between items-start">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-lg">{s.event}</h4>
                              <Badge variant={s.status === 'error' ? 'error' : s.status === 'warning' ? 'warning' : 'info'}>{s.status}</Badge>
                           </div>
                           <p className="text-sm text-slate-400 font-mono mb-4">{s.time}</p>
                           <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-enterprise-border-light dark:border-enterprise-border-dark italic text-sm">
                             {s.detail}
                           </p>
                        </div>
                        <Button size="sm" variant="ghost"><Icons.ExternalLink size={14} /></Button>
                     </div>
                  </Card>
               </div>
             ))}
             {!isReplaying && (
                <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-enterprise-border-light dark:border-enterprise-border-dark rounded-xl">
                   <Icons.Incident size={48} className="text-slate-700 mb-4" />
                   <p className="text-slate-500 font-bold uppercase tracking-widest">Select range and start playback</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default IncidentReplay;
