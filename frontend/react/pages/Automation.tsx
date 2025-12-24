
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Dropdown, DropdownItem, Modal, Input } from '../components/UI';
import { Icons } from '../components/Icons';
import { useNotification } from '../components/NotificationSystem';
import { rulesService } from '../services/api';

const Automation: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', threshold: '', operator: '<' });
  const { showNotification } = useNotification();

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const data = await rulesService.getAll();
      setRules(data || []);
    } catch (err: any) {
      console.error('Failed to load rules:', err);
      setRules([]);
      showNotification({
        type: 'error',
        message: 'Failed to load automation policies',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRule = async (id: string) => {
    try {
      const rule = rules.find(r => r.id === id);
      if (!rule) return;
      const updated = await rulesService.toggle(id, !rule.enabled);
      setRules(prev => prev.map(r => r.id === id ? updated : r));
      showNotification({
        type: 'success',
        message: `Rule ${updated.enabled ? 'enabled' : 'disabled'} successfully`,
        duration: 3000,
      });
    } catch (err: any) {
      showNotification({
        type: 'error',
        message: 'Failed to toggle rule',
        duration: 5000,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await rulesService.delete(id);
      setRules(prev => prev.filter(r => r.id !== id));
      showNotification({
        type: 'success',
        message: 'Rule deleted successfully',
        duration: 3000,
      });
    } catch (err: any) {
      showNotification({
        type: 'error',
        message: 'Failed to delete rule',
        duration: 5000,
      });
    }
  };

  const handleEdit = (rule: any) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name || '',
      description: rule.description || '',
      threshold: rule.threshold?.toString() || '',
      operator: rule.operator || '<',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const ruleData = {
        name: formData.name,
        description: formData.description,
        threshold: formData.threshold,
        enabled: selectedRule?.enabled ?? true,
        rule_definition: {
          operator: formData.operator,
          threshold: formData.threshold,
        },
      };

      if (selectedRule) {
        await rulesService.update(selectedRule.id, ruleData);
        showNotification({
          type: 'success',
          message: 'Rule updated successfully',
          duration: 3000,
        });
      } else {
        await rulesService.create(ruleData);
        showNotification({
          type: 'success',
          message: 'Rule created successfully',
          duration: 3000,
        });
      }
      setIsModalOpen(false);
      setSelectedRule(null);
      setFormData({ name: '', description: '', threshold: '', operator: '<' });
      loadRules();
    } catch (err: any) {
      showNotification({
        type: 'error',
        message: 'Failed to save rule',
        duration: 5000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-10 pb-12 font-['Plus_Jakarta_Sans']">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Loading Automation Policies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 font-['Plus_Jakarta_Sans'] text-slate-900 dark:text-slate-100">
       <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Automation Policies</h1>
          <Button 
            size="sm" 
            onClick={() => { 
              setSelectedRule(null); 
              setFormData({ name: '', description: '', threshold: '', operator: '<' });
              setIsModalOpen(true); 
            }}
            data-demo="create-rule"
          >
            <Icons.Plus size={14} className="mr-2" /> New Rule
          </Button>
       </div>

       {rules.length === 0 ? (
         <Card>
           <div className="text-center py-12">
             <Icons.Rules size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
             <p className="text-sm font-extrabold text-slate-600 dark:text-slate-400">No Automation Policies</p>
             <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">Create your first automation policy to get started</p>
           </div>
         </Card>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map(rule => (
            <div key={rule.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col shadow-none transition-colors hover:border-slate-300 dark:hover:border-slate-700">
               <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-colors ${
                    rule.enabled ? 'bg-[#2563eb] text-white border-blue-200 dark:border-blue-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600'
                  }`}>
                     <Icons.Rules size={22} />
                  </div>
                  <div className="flex items-center gap-4">
                     <button 
                       onClick={() => toggleRule(rule.id)}
                       title={rule.enabled ? "Disable Rule" : "Enable Rule"}
                       className={`w-10 h-5 rounded-full relative transition-colors active:scale-95 ${rule.enabled ? 'bg-[#2563eb]' : 'bg-slate-300 dark:bg-slate-600'}`}
                     >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${rule.enabled ? 'left-6' : 'left-1'}`} />
                     </button>
                     <Dropdown trigger={<Icons.More size={18} className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-pointer transition-colors" />}>
                        <DropdownItem icon={Icons.Settings} onClick={() => handleEdit(rule)}>Configure Logic</DropdownItem>
                        <DropdownItem icon={Icons.Clock} onClick={() => {}}>View History</DropdownItem>
                        <DropdownItem icon={Icons.Success} onClick={() => {}}>Test against Logs</DropdownItem>
                        <div className="border-t border-slate-100 my-1" />
                        <DropdownItem icon={Icons.Trash} danger onClick={() => handleDelete(rule.id)}>Purge Rule</DropdownItem>
                     </Dropdown>
                  </div>
               </div>
               
               <h3 className="font-extrabold text-base mb-2 tracking-tight text-slate-900 dark:text-slate-100">{rule.name}</h3>
               <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-medium">
                 {rule.description || rule.rule_definition?.description || 'No description'}
               </p>
               
               <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Threshold:</span>
                     <span className="text-xs font-mono font-extrabold text-[#2563eb]">{rule.threshold || rule.rule_definition?.threshold || 'N/A'}</span>
                  </div>
                  <Badge variant={rule.enabled ? 'success' : 'neutral'}>{rule.enabled ? 'Operational' : 'Hibernated'}</Badge>
               </div>
            </div>
          ))}
         </div>
       )}

       <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={selectedRule ? "Reconfigure Logic Engine" : "Create Detection Signature"}
          actions={
            <>
              <Button variant="ghost" onClick={() => {
                setIsModalOpen(false);
                setSelectedRule(null);
                setFormData({ name: '', description: '', threshold: '', operator: '<' });
              }}>Discard</Button>
              <Button variant="primary" onClick={handleSave}>Commit Policy</Button>
            </>
          }
       >
          <div className="space-y-4">
             <Input 
               label="Rule Signature Name" 
               placeholder="e.g. Velocity Check" 
               value={formData.name}
               onChange={(e) => setFormData({...formData, name: e.target.value})}
             />
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Logic Description</label>
                <textarea 
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]/50 transition-all text-slate-900 dark:text-slate-100 min-h-[80px]" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Threshold Value" 
                  placeholder="30s" 
                  value={formData.threshold}
                  onChange={(e) => setFormData({...formData, threshold: e.target.value})}
                />
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Logic Operator</label>
                   <select 
                     className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]/50 text-slate-900 dark:text-slate-100"
                     value={formData.operator}
                     onChange={(e) => setFormData({...formData, operator: e.target.value})}
                   >
                      <option value="<">Less Than (&lt;)</option>
                      <option value=">">Greater Than (&gt;)</option>
                      <option value="=">Equal To (=)</option>
                   </select>
                </div>
             </div>
          </div>
       </Modal>
    </div>
  );
};

export default Automation;
