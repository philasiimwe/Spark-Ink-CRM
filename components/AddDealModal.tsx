
import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../CRMContext';
import { STAGES, ICONS, SOURCES, PRIORITIES } from '../constants';
import { DealPriority, DealSource } from '../types';

interface AddDealModalProps {
  onClose: () => void;
}

const INDUSTRIES = [
  'Aerospace', 'Agriculture', 'Agri-tech', 'AI & Machine Learning', 'Automotive', 'Beauty & Cosmetics',
  'Biotechnology', 'Blockchain', 'Chemicals', 'Civil Engineering', 'Cloud Computing', 'Construction',
  'Consumer Electronics', 'Cybersecurity', 'Defense', 'E-commerce', 'Education', 'Energy & Renewables',
  'Entertainment', 'Fashion & Apparel', 'Fintech', 'Food & Beverage', 'Gaming', 'Healthcare',
  'Hospitality', 'Insurance', 'Logistics', 'Luxury Goods', 'Manufacturing', 'Maritime', 'Media',
  'Mining', 'Oil & Gas', 'Pharmaceuticals', 'Real Estate', 'Retail', 'SaaS', 'Telecommunications',
  'Transportation', 'Travel & Tourism', 'Venture Capital', 'Waste Management'
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'UGX', symbol: 'USh', label: 'Uganda Shilling' },
  { code: 'KES', symbol: 'KSh', label: 'Kenya Shilling' },
  { code: 'ZAR', symbol: 'R', label: 'SA Rand' },
  { code: 'NGN', symbol: '₦', label: 'Nigeria Naira' },
];

const COUNTRY_CODES = [
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
];

const JOB_TITLES = ['CEO', 'CTO', 'Founder', 'VP Sales', 'Product Manager', 'Managing Director', 'Sales Lead'];

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
      <label className="block text-[11px] font-black text-slate-400 uppercase mb-2 tracking-widest">
        Address {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <input
          type="text" placeholder="e.g. Tankhill road, Muyenga Kampala"
          className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-[1.25rem] outline-none font-semibold text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
          value={value} onChange={handleChange} onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 200)}
        />
        {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
      </div>
      {show && suggestions.length > 0 && (
        <div className="absolute z-[300] w-full mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl max-h-60 overflow-y-auto p-2">
          {suggestions.map((s, idx) => (
            <button key={idx} type="button" className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 font-bold text-slate-700 rounded-xl transition-colors" onClick={() => { onChange(s.display_name); setShow(false); }}>
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
  type?: string; prefix?: string;
}> = ({ label, value, onChange, suggestions, placeholder, required, type = 'text', prefix }) => {
  const [show, setShow] = useState(false);
  const filtered = suggestions?.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s !== value) || [];

  return (
    <div className="relative w-full">
      <label className="block text-[11px] font-black text-slate-400 uppercase mb-2 tracking-widest">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative flex items-center group">
        {prefix && (
          <div className="absolute left-4 font-black text-slate-400 text-[10px] pointer-events-none bg-slate-200/50 px-2 py-1 rounded-md">
            {prefix}
          </div>
        )}
        <input
          type={type} placeholder={placeholder}
          className={`w-full ${prefix ? 'pl-24' : 'pl-5'} pr-5 py-5 bg-slate-50 border border-slate-200 rounded-[1.25rem] outline-none font-semibold text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm`}
          value={value} onChange={e => { onChange(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)} onBlur={() => setTimeout(() => setShow(false), 200)}
        />
      </div>
      {show && filtered.length > 0 && (
        <div className="absolute z-[300] w-full mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl max-h-48 overflow-y-auto p-2">
          {filtered.map(s => (
            <button key={s} type="button" className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-blue-50 text-slate-700 rounded-xl" onClick={() => { onChange(s); setShow(false); }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!dealForm.tags.includes(tagInput.trim())) {
        setDealForm({ ...dealForm, tags: [...dealForm.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setDealForm({ ...dealForm, tags: dealForm.tags.filter(t => t !== tag) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.title || !dealForm.value) {
        alert("Opportunity Name and Valuation are required.");
        return;
    }
    if (entryMode === 'NEW' && (!contactForm.firstName || !contactForm.email || !contactForm.company)) {
      alert("Name, Email, and Company are required.");
      return;
    }
    addDeal(dealForm, entryMode === 'NEW' ? { ...contactForm, name: `${contactForm.firstName} ${contactForm.lastName}` } : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 md:p-10">
      <div className="bg-white w-full max-w-6xl h-full flex flex-col rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-8 md:px-12 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-blue-200">
               <ICONS.Plus />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">New Opportunity</h2>
              <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Initialize deal record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-16">
          <form id="master-deal-form" onSubmit={handleSubmit} className="space-y-20">
            
            {/* Section 1: Financials */}
            <section className="space-y-10">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] border-l-4 border-blue-600 pl-4">Commercials</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8">
                  <SmartField label="Opportunity Name" required placeholder="e.g. Acme Corp License Renewal" value={dealForm.title} onChange={v => setDealForm({...dealForm, title: v})} />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-2 tracking-widest">Valuation <span className="text-rose-500">*</span></label>
                  <div className="flex gap-2">
                    <select 
                      className="w-24 bg-slate-100 border border-slate-200 rounded-[1.25rem] px-3 font-black text-[10px] outline-none"
                      value={dealForm.currency} onChange={e => setDealForm({...dealForm, currency: e.target.value})}
                    >
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                    <input 
                      required type="number" placeholder="50000"
                      className="flex-1 p-5 bg-slate-50 border border-slate-200 rounded-[1.25rem] outline-none font-black text-blue-600 text-xl shadow-inner"
                      value={dealForm.value} onChange={e => setDealForm({...dealForm, value: e.target.value})}
                    />
                  </div>
                </div>
                <div className="md:col-span-6">
                   <label className="block text-[11px] font-black text-slate-400 uppercase mb-2 tracking-widest">Assign to Salesperson</label>
                   <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.25rem] outline-none font-bold text-slate-700" value={dealForm.ownerId} onChange={e => setDealForm({...dealForm, ownerId: e.target.value})}>
                     {team.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                   </select>
                </div>
                <div className="md:col-span-6">
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-2 tracking-widest">Tags (Press Enter)</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-[1.25rem] min-h-[64px]">
                    {dealForm.tags.map(t => (
                      <span key={t} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                        {t} <button onClick={() => removeTag(t)} className="text-white/50">×</button>
                      </span>
                    ))}
                    <input 
                      placeholder="e.g. Q4 Target"
                      className="flex-1 bg-transparent outline-none font-bold text-sm min-w-[120px]"
                      value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Person */}
            <section className="space-y-10 p-10 bg-indigo-50/20 rounded-[3rem] border border-indigo-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] border-l-4 border-indigo-600 pl-4">Contact Person</h3>
                <div className="flex bg-white p-1 rounded-2xl border">
                   <button type="button" onClick={() => setEntryMode('NEW')} className={`px-6 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${entryMode === 'NEW' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>New</button>
                   <button type="button" onClick={() => setEntryMode('EXISTING')} className={`px-6 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${entryMode === 'EXISTING' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Existing</button>
                </div>
              </div>

              {entryMode === 'EXISTING' ? (
                <select className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-black text-slate-800" value={dealForm.contactId} onChange={e => setDealForm({...dealForm, contactId: e.target.value})}>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name} • {c.company}</option>)}
                </select>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <SmartField label="First Name" required placeholder="e.g. Mark" value={contactForm.firstName} onChange={v => setContactForm({...contactForm, firstName: v})} />
                  <SmartField label="Last Name" placeholder="e.g. Benioff" value={contactForm.lastName} onChange={v => setContactForm({...contactForm, lastName: v})} />
                  <SmartField label="Designation" suggestions={JOB_TITLES} placeholder="e.g. CEO" value={contactForm.jobTitle} onChange={v => setContactForm({...contactForm, jobTitle: v})} />
                  <SmartField label="Email" required type="email" placeholder="name@company.com" value={contactForm.email} onChange={v => setContactForm({...contactForm, email: v})} />
                  
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-2 tracking-widest">Phone</label>
                    <div className="flex gap-2">
                       <select className="w-20 bg-slate-50 border border-slate-200 rounded-2xl px-2 font-bold text-xs outline-none" value={contactForm.phoneCountryCode} onChange={e => setContactForm({...contactForm, phoneCountryCode: e.target.value})}>
                          {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                       </select>
                       <input type="tel" placeholder="e.g. 772 123 456" className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} />
                    </div>
                  </div>

                  <LocationAutocomplete required value={contactForm.location} onChange={v => setContactForm({...contactForm, location: v})} />
                  <SmartField label="LinkedIn URL" prefix="https://" placeholder="linkedin.com/in/..." value={contactForm.linkedinUrl} onChange={v => setContactForm({...contactForm, linkedinUrl: v})} />
                </div>
              )}
            </section>

            {/* Section 3: Company */}
            <section className="space-y-10">
              <h3 className="text-xs font-black text-amber-600 uppercase tracking-[0.3em] border-l-4 border-amber-500 pl-4">Company Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <SmartField label="Company Name" required placeholder="e.g. Salesforce" value={entryMode === 'NEW' ? contactForm.company : ''} onChange={v => setContactForm({...contactForm, company: v})} />
                <SmartField label="Industry" suggestions={INDUSTRIES} placeholder="e.g. SaaS" value={contactForm.industry} onChange={v => setContactForm({...contactForm, industry: v})} />
                <SmartField label="Website URL" prefix="https://" placeholder="www.domain.com" value={contactForm.website} onChange={v => setContactForm({...contactForm, website: v})} />
                <div className="lg:col-span-3">
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-2 tracking-widest">Notes & Context</label>
                  <textarea rows={4} placeholder="Summarize pain points, budget, and decision makers..." className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-medium text-slate-600 italic shadow-sm" value={dealForm.notes} onChange={e => setDealForm({...dealForm, notes: e.target.value})} />
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-slate-100 bg-white flex flex-col md:flex-row gap-6 shrink-0">
          <button type="button" onClick={onClose} className="px-14 py-6 text-slate-400 font-black uppercase text-xs tracking-[0.4em] hover:text-rose-500 transition-all rounded-3xl">Cancel</button>
          <button form="master-deal-form" type="submit" className="flex-1 bg-slate-900 text-white py-7 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Save Opportunity</button>
        </div>
      </div>
    </div>
  );
};

export default AddDealModal;
