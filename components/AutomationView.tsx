
import React from 'react';

const WORKFLOWS = [
  { id: 'w1', name: 'Auto-Welcome Email', trigger: 'Lead Created', action: 'Send Email Template', status: true },
  { id: 'w2', name: 'High-Value Alert', trigger: 'Deal Value > $50k', action: 'Notify Sales Lead', status: true },
  { id: 'w3', name: 'Dormant Lead Follow-up', trigger: 'No Activity 7 Days', action: 'Create Task', status: false },
  { id: 'w4', name: 'Closed Won Onboarding', trigger: 'Stage: Won', action: 'Zapier Webhook', status: true },
];

const AutomationView: React.FC = () => {
  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Automation</h2>
          <p className="text-slate-500 font-medium mt-2">Scale your team with event-based workflows.</p>
        </div>
        <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">Create Workflow</button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {WORKFLOWS.map(w => (
            <div key={w.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-6">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${w.status ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4"/><path d="m16.2 4.2 2.9 2.9"/><path d="M21 12h-4"/><path d="m18.5 16.2-2.9 2.9"/><path d="M12 22v-4"/><path d="m7.8 19.8-2.9-2.9"/><path d="M3 12h4"/><path d="m5.5 7.8 2.9-2.9"/></svg>
                 </div>
                 <div>
                    <h4 className="font-black text-slate-900 text-lg">{w.name}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">If {w.trigger} → Do {w.action}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <span className={`text-[10px] font-black uppercase tracking-widest ${w.status ? 'text-emerald-500' : 'text-slate-400'}`}>
                   {w.status ? 'Active' : 'Paused'}
                 </span>
                 <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${w.status ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${w.status ? 'right-1' : 'left-1'}`}></div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-xl flex flex-col justify-between h-64">
           <div>
              <h3 className="text-2xl font-black mb-2">Nexus Connect</h3>
              <p className="text-indigo-100 text-sm font-medium">Link your CRM data to 2,000+ external tools via Webhooks and Zapier.</p>
           </div>
           <button className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest self-start transition-all">Explore Marketplace</button>
        </div>
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl flex flex-col justify-between h-64">
           <div>
              <h3 className="text-2xl font-black mb-2">Smart Triggers</h3>
              <p className="text-slate-400 text-sm font-medium">Use AI to detect sentiment change in emails and trigger automatic escalations.</p>
           </div>
           <button className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest self-start transition-all">Activate AI Triggers</button>
        </div>
      </div>
    </div>
  );
};

export default AutomationView;
