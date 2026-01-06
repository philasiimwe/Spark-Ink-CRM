
import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../CRMContext';
import { STAGES, ICONS, SOURCES, PRIORITIES } from '../constants';
import { DealPriority, DealSource } from '../types';

interface AddDealModalProps {
  onClose: () => void;
}

const INDUSTRIES = [
  'AI & Machine Learning', 'Biotechnology', 'Cloud Computing', 'Cybersecurity', 'Fintech', 'Logistics', 'SaaS', 'Venture Capital'
];

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'UGX', symbol: 'USh' },
];

const COUNTRY_CODES = [
  { code: '+256', flag: '🇺🇬' },
  { code: '+254', flag: '🇰🇪' },
  { code: '+1', flag: '🇺🇸' },
  { code: '+44', flag: '🇬🇧' },
];

const JOB_TITLES = ['CEO', 'CTO', 'Founder', 'VP Sales', 'Managing Director'];

// --- UI Components ---

const FormLabel: React.FC<{ label: string; required?: boolean; sublabel?: string }> = ({ label, required, sublabel }) => (
  <div className="flex flex-col gap-1 mb-2.5 ml-1">
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</span>
      {required && <span className="w-1 h-1 rounded-full bg-rose-500"></span>}
    </div>
    {sublabel && <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{sublabel}</span>}
  </div>
);

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; colorClass: string }> = ({ title, icon, colorClass }) => (
  <div className="flex items-center gap-4 mb-8">
    <div className={`w-11 h-11 rounded-2xl ${colorClass} flex items-center justify-center shadow-sm border border-white/50`}>
      {icon}
    </div>
    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.25em]">{title}</h3>
  </div>
);

const LocationAutocomplete: React.FC<{
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}> = ({ value, onChange, required }) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const timerRef = useRef<any>(null);

  const fetchLocations = async (query: string) => {
    if (query.length < 3) return;
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setSuggestions(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setShow(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchLocations(val), 500);
  };

  return (
    <div className="relative w-full">
      <FormLabel label="HQ Physical Node" required={required} />
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <input
          type="text" placeholder="Search global geodata..."
          className="w-full pl-14 pr-12 py-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 placeholder:text-slate-300 focus:ring-[6px] focus:ring-blue-600/5 focus:border-blue-600/50 transition-all shadow-sm"
          value={value} onChange={handleChange} onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 200)}
        />
        {loading && <div className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>}
      </div>
      {show && suggestions.length > 0 && (
        <div className="absolute z-[400] w-full mt-3 bg-white border border-slate-100 rounded-[1.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] max-h-64 overflow-y-auto p-2">
          {suggestions.map((s, idx) => (
            <button key={idx} type="button" className="w-full text-left px-5 py-4 text-xs font-bold text-slate-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all" onClick={() => { onChange(s.display_name); setShow(false); }}>
              {s.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SmartField: React.FC<{
  label: string; value: string; onChange: (val: string) => void;
  suggestions?: string[]; placeholder: string; required?: boolean;
  type?: string; icon?: React.ReactNode;
}> = ({ label, value, onChange, suggestions, placeholder, required, type = 'text', icon }) => {
  const [show, setShow] = useState(false);
  const filtered = suggestions?.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s !== value) || [];

  return (
    <div className="relative w-full">
      <FormLabel label={label} required={required} />
      <div className="relative group">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type} placeholder={placeholder}
          className={`w-full ${icon ? 'pl-14' : 'pl-6'} pr-6 py-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-800 placeholder:text-slate-300 focus:ring-[6px] focus:ring-indigo-600/5 focus:border-indigo-600/50 transition-all shadow-sm`}
          value={value} onChange={e => { onChange(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)} onBlur={() => setTimeout(() => setShow(false), 200)}
        />
      </div>
      {show && filtered.length > 0 && (
        <div className="absolute z-[400] w-full mt-3 bg-white border border-slate-100 rounded-[1.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] max-h-48 overflow-y-auto p-2">
          {filtered.map(s => (
            <button key={s} type="button" className="w-full text-left px-5 py-4 text-xs font-bold text-slate-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all" onClick={() => { onChange(s); setShow(false); }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Modal ---

const AddDealModal: React.FC<AddDealModalProps> = ({ onClose }) => {
  const { contacts, addDeal, team } = useCRM();
  const [entryMode, setEntryMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [tagInput, setTagInput] = useState('');

  const [dealForm, setDealForm] = useState({
    title: '', value: '', currency: 'USD', contactId: contacts[0]?.id || '',
    stage: 'LEAD' as any, probability: 20, expectedCloseDate: '',
    priority: 'WARM' as DealPriority, source: 'WEBSITE' as DealSource,
    ownerId: team[0]?.id || '', notes: '', tags: [] as string[]
  });

  const [contactForm, setContactForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', phoneCountryCode: '+256',
    company: '', jobTitle: '', linkedinUrl: '', twitterUrl: '',
    location: '', industry: '', companySize: '', website: '', annualRevenue: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.title || !dealForm.value) {
        alert("Primary valuation and title are required for authorization.");
        return;
    }
    addDeal(dealForm, entryMode === 'NEW' ? { ...contactForm, name: `${contactForm.firstName} ${contactForm.lastName}` } : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Dynamic Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-[1200px] h-full lg:h-[90vh] flex flex-col rounded-none lg:rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
        
        {/* Superior Header */}
        <div className="px-10 py-8 lg:px-14 flex justify-between items-center bg-white border-b border-slate-100 shrink-0 z-30">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.75rem] flex items-center justify-center shadow-2xl rotate-2">
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">New Opportunity</h2>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.35em] mt-2.5">Workspace Integrity Draft v2.5</p>
            </div>
          </div>
          
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active-scale">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Scrollable Form Column */}
          <div className="flex-1 overflow-y-auto p-10 lg:p-14 scrollbar-hide">
             <form id="master-deal-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-16">
                
                {/* Commercial Section */}
                <section>
                  <SectionHeader title="Commercials" colorClass="bg-blue-50 text-blue-600" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                      <SmartField label="Opportunity Title" required placeholder="Project Nova Expansion" value={dealForm.title} onChange={v => setDealForm({...dealForm, title: v})} />
                    </div>
                    
                    <div className="flex flex-col">
                      <FormLabel label="Valuation" required />
                      <div className="flex gap-2">
                        <select className="bg-slate-900 text-white pl-4 pr-10 py-5 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-slate-900/10 transition-all cursor-pointer appearance-none" value={dealForm.currency} onChange={e => setDealForm({...dealForm, currency: e.target.value})}>
                          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                        <input required type="number" placeholder="00.00" className="flex-1 p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl placeholder:text-slate-200 focus:bg-white focus:border-blue-600/50 transition-all" value={dealForm.value} onChange={e => setDealForm({...dealForm, value: e.target.value})} />
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <FormLabel label="Assigned Lead" />
                      <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:bg-white focus:border-blue-600/50 transition-all cursor-pointer" value={dealForm.ownerId} onChange={e => setDealForm({...dealForm, ownerId: e.target.value})}>
                        {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Stakeholder Section */}
                <section>
                  <div className="flex justify-between items-center mb-10">
                    <SectionHeader title="Stakeholder" colorClass="bg-indigo-50 text-indigo-600" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                       <button type="button" onClick={() => setEntryMode('NEW')} className={`px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${entryMode === 'NEW' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>New Persona</button>
                       <button type="button" onClick={() => setEntryMode('EXISTING')} className={`px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${entryMode === 'EXISTING' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Existing</button>
                    </div>
                  </div>

                  {entryMode === 'EXISTING' ? (
                    <div className="space-y-4">
                      <FormLabel label="Select Identity" />
                      <select className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-black text-slate-800 text-lg shadow-inner focus:bg-white focus:border-indigo-600/50 transition-all" value={dealForm.contactId} onChange={e => setDealForm({...dealForm, contactId: e.target.value})}>
                        {contacts.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <SmartField label="First Name" required placeholder="Jane" value={contactForm.firstName} onChange={v => setContactForm({...contactForm, firstName: v})} />
                      <SmartField label="Last Name" placeholder="Doe" value={contactForm.lastName} onChange={v => setContactForm({...contactForm, lastName: v})} />
                      <SmartField label="Corporate Email" required type="email" placeholder="jane@partner.com" value={contactForm.email} onChange={v => setContactForm({...contactForm, email: v})} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>} />
                      <div className="flex flex-col">
                        <FormLabel label="Direct Line" />
                        <div className="flex gap-2">
                           <select className="w-24 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-black text-[10px] outline-none cursor-pointer" value={contactForm.phoneCountryCode} onChange={e => setContactForm({...contactForm, phoneCountryCode: e.target.value})}>
                              {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                           </select>
                           <input type="tel" placeholder="Phone Number" className="flex-1 p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:border-indigo-600/50 transition-all" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <SmartField label="Designation" suggestions={JOB_TITLES} placeholder="VP of Strategy" value={contactForm.jobTitle} onChange={v => setContactForm({...contactForm, jobTitle: v})} />
                      </div>
                    </div>
                  )}
                </section>

                {/* Entity Section */}
                <section>
                  <SectionHeader title="Entity Insights" colorClass="bg-amber-50 text-amber-600" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                      <SmartField label="Firm Name" required placeholder="Nexus Global Corp" value={contactForm.company} onChange={v => setContactForm({...contactForm, company: v})} />
                    </div>
                    <SmartField label="Industry Vertical" suggestions={INDUSTRIES} placeholder="SaaS" value={contactForm.industry} onChange={v => setContactForm({...contactForm, industry: v})} />
                    <SmartField label="Corporate Website" placeholder="www.nexus.com" value={contactForm.website} onChange={v => setContactForm({...contactForm, website: v})} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>} />
                    <div className="md:col-span-2">
                       <LocationAutocomplete value={contactForm.location} onChange={v => setContactForm({...contactForm, location: v})} />
                    </div>
                  </div>
                </section>
             </form>
          </div>

          {/* Fixed Right Control Sidebar */}
          <div className="w-full lg:w-[400px] bg-[#fdfdfd] border-l border-slate-100 p-10 lg:p-12 shrink-0 flex flex-col z-20 overflow-y-auto">
             <div className="space-y-12">
                <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-8">Metadata Attributes</h4>
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <FormLabel label="Pipeline Stage" sublabel="Draft Status" />
                        <select className="w-full bg-white/10 border border-white/20 rounded-2xl p-5 font-bold text-sm outline-none cursor-pointer hover:bg-white/20 transition-all appearance-none" value={dealForm.stage} onChange={e => setDealForm({...dealForm, stage: e.target.value as any})}>
                          {STAGES.map(s => <option key={s.id} value={s.id} className="text-slate-900">{s.label}</option>)}
                        </select>
                     </div>
                     
                     <div className="space-y-3">
                        <FormLabel label="Priority Rating" />
                        <div className="grid grid-cols-3 gap-2">
                           {PRIORITIES.map(p => (
                             <button key={p.id} type="button" onClick={() => setDealForm({...dealForm, priority: p.id as any})} className={`py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${dealForm.priority === p.id ? 'bg-white text-blue-600 shadow-xl' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>{p.label}</button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-3">
                        <FormLabel label="Closing Window" />
                        <input type="date" className="w-full bg-white/10 border border-white/20 rounded-2xl p-5 font-bold text-sm outline-none hover:bg-white/20 transition-all invert" value={dealForm.expectedCloseDate} onChange={e => setDealForm({...dealForm, expectedCloseDate: e.target.value})} />
                     </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem]">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Tags</h4>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M2 12h20"/></svg>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {dealForm.tags.map(t => (
                      <span key={t} className="flex items-center gap-2 px-3 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm border border-slate-100">
                        {t} <button type="button" onClick={() => setDealForm({...dealForm, tags: dealForm.tags.filter(tg => tg !== t)})} className="text-rose-500 font-bold ml-1">×</button>
                      </span>
                    ))}
                  </div>
                  <input placeholder="Add tag + Enter..." className="w-full bg-transparent border-b-2 border-slate-200 py-3 outline-none font-bold text-xs focus:border-blue-600 transition-all" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      if (!dealForm.tags.includes(tagInput.trim())) setDealForm({...dealForm, tags: [...dealForm.tags, tagInput.trim()]});
                      setTagInput('');
                    }
                  }} />
                </div>
             </div>

             <div className="mt-auto pt-10 flex flex-col gap-4">
                <button form="master-deal-form" type="submit" className="w-full bg-slate-900 text-white py-8 rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-3xl hover-scale active-scale flex items-center justify-center gap-4 transition-all">
                  Sync Record
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="animate-pulse"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
                <button type="button" onClick={onClose} className="w-full py-6 text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] hover:text-rose-500 transition-all">Abort Changes</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDealModal;
