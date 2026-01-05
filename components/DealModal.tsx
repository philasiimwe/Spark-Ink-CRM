
import React, { useState, useEffect } from 'react';
import { useCRM } from '../CRMContext';
import { Deal, Activity, Contact } from '../types';
import { ICONS, STAGES, PRIORITIES, SOURCES } from '../constants';
import { getDealInsights } from '../geminiService';
import { googleService } from '../googleService';

interface DealModalProps {
  deal: Deal;
  onClose: () => void;
}

const DealModal: React.FC<DealModalProps> = ({ deal, onClose }) => {
  const { contacts, activities, updateDeal, addActivity, toggleFollowDeal, team, updateContact, user } = useCRM();
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'ACTIVITIES' | 'AI'>('DETAILS');
  const [isEditing, setIsEditing] = useState(false);
  const [syncingToGoogle, setSyncingToGoogle] = useState(false);
  
  const [editedDeal, setEditedDeal] = useState<Deal>(deal);
  const contact = contacts.find(c => c.id === deal.contactId);
  const [editedContact, setEditedContact] = useState<Contact | null>(contact || null);

  const dealActivities = activities.filter(a => a.dealId === deal.id);
  const priority = PRIORITIES.find(p => p.id === deal.priority);

  const fetchAIInsights = async () => {
    if (!contact) return;
    setLoadingInsights(true);
    const data = await getDealInsights(deal, dealActivities, contact);
    setInsights(data);
    setLoadingInsights(false);
  };

  const handleSave = () => {
    updateDeal(deal.id, editedDeal);
    if (editedContact) {
      updateContact(editedContact.id, editedContact);
    }
    setIsEditing(false);
  };

  const handleGoogleSync = async () => {
    if (!user.googleClientId) {
      alert('Missing Google Client ID. Please configure it in Settings > Integrations.');
      return;
    }

    if (!editedDeal.expectedCloseDate) {
      alert('Please set an Expected Close Date first.');
      return;
    }

    setSyncingToGoogle(true);
    try {
      // Connect first if not connected
      if (!googleService.isConnected()) {
        await googleService.connect(user.googleClientId);
      }

      const result = await googleService.createCalendarEvent({
        summary: `MEETING: ${editedDeal.title} - Close Date Discussion`,
        description: `Closing discussion for deal ${editedDeal.title}. Stakeholder: ${contact?.name}`,
        startDateTime: new Date(editedDeal.expectedCloseDate).toISOString(),
        endDateTime: new Date(new Date(editedDeal.expectedCloseDate).getTime() + 60 * 60 * 1000).toISOString(),
        attendees: contact?.email ? [contact.email] : [],
        useMeet: true
      });

      alert(`Successfully synced to Google Calendar! Meet link generated: ${result.hangoutLink || 'Check your Google Calendar'}`);
    } catch (err: any) {
      console.error(err);
      const msg = err?.error || err?.message || JSON.stringify(err);
      alert(`Sync failed: ${msg}`);
    } finally {
      setSyncingToGoogle(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'AI' && !insights) fetchAIInsights();
  }, [activeTab]);

  const EditableField = ({ label, value, field, type = 'text', options, isContact = false }: any) => {
    const handleChange = (val: any) => {
      if (isContact && editedContact) {
        setEditedContact({ ...editedContact, [field]: val });
      } else {
        setEditedDeal({ ...editedDeal, [field]: val });
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 items-center py-4 border-b border-slate-50 last:border-0">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="md:col-span-2">
          {isEditing ? (
            options ? (
              <select 
                value={value || ''} 
                onChange={e => handleChange(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none"
              >
                {options.map((o: any) => <option key={o.id || o} value={o.id || o}>{o.label || o}</option>)}
              </select>
            ) : (
              <input 
                type={type} 
                value={value || ''} 
                onChange={e => handleChange(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none"
              />
            )
          ) : (
            <span className={`text-sm font-bold ${value ? 'text-slate-900' : 'text-slate-300 italic'}`}>
              {value || 'Not set'}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start shrink-0">
          <div className="flex gap-6 items-start">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
                <ICONS.Layout />
             </div>
             <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 text-[8px] font-black rounded-lg uppercase tracking-widest ${priority?.color}`}>
                    {priority?.label}
                  </span>
                  <button onClick={() => toggleFollowDeal(deal.id)} className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border ${deal.isFollowed ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-400'}`}>
                    {deal.isFollowed ? 'Following' : 'Follow'}
                  </button>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{deal.title}</h2>
             </div>
          </div>
          <div className="flex gap-4">
            <button 
              disabled={syncingToGoogle}
              onClick={handleGoogleSync}
              className="flex items-center gap-3 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
              {syncingToGoogle ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-4 h-4" alt="GCal" />
              )}
              {syncingToGoogle ? 'Syncing...' : 'Add to Google Calendar'}
            </button>
            {isEditing ? (
              <button onClick={handleSave} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all">Save Changes</button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Edit Record</button>
            )}
            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/20 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Primary Details (Left Column) */}
            <div className="lg:col-span-8 space-y-10">
              <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-6">Commercial Details</h3>
                <div className="space-y-1">
                  <EditableField label="Opportunity Name" value={editedDeal.title} field="title" />
                  <EditableField label="Pipeline Stage" value={editedDeal.stage} field="stage" options={STAGES} />
                  <EditableField label="Win Probability (%)" value={editedDeal.probability} field="probability" type="number" />
                  <EditableField label="Expected Close" value={editedDeal.expectedCloseDate} field="expectedCloseDate" type="date" />
                  <EditableField label="Sales Lead" value={team.find(t=>t.id===editedDeal.ownerId)?.name} field="ownerId" options={team.map(t=>({id:t.id, label:t.name}))} />
                  <EditableField label="Valuation" value={editedDeal.value} field="value" type="number" />
                </div>
              </section>

              <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-6">Strategic Notes</h3>
                {isEditing ? (
                  <textarea 
                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm italic h-48 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                    value={editedDeal.notes}
                    onChange={e => setEditedDeal({...editedDeal, notes: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed italic">{deal.notes || 'No strategic context provided.'}</p>
                )}
              </section>
            </div>

            {/* Stakeholder Identity (Right Column) */}
            <div className="lg:col-span-4 space-y-10">
              <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6">Primary Contact</h3>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                    {contact?.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 leading-none truncate">{contact?.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 truncate">{contact?.jobTitle}</p>
                  </div>
                </div>
                <div className="space-y-1">
                   <EditableField label="Email" value={editedContact?.email} field="email" isContact />
                   <EditableField label="Phone" value={editedContact?.phone} field="phone" isContact />
                   <EditableField label="Location" value={editedContact?.location} field="location" isContact />
                </div>
              </section>

              <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform">
                   <ICONS.Layout />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 relative z-10">Firmographics</h3>
                <div className="space-y-8 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase">Entity Name</p>
                    {isEditing ? (
                       <input className="w-full bg-white/10 border border-white/10 rounded-xl p-2 text-sm font-bold outline-none" value={editedContact?.company} onChange={e => setEditedContact(prev => prev ? {...prev, company: e.target.value} : null)} />
                    ) : (
                       <p className="text-xl font-black tracking-tight">{contact?.company}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-500 uppercase">Industry</p>
                      <p className="text-xs font-bold text-slate-300">{contact?.industry}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-500 uppercase">Headcount</p>
                      <p className="text-xs font-bold text-slate-300">{contact?.companySize || 'Unknown'}</p>
                    </div>
                  </div>
                  {contact?.website && (
                    <a href={`https://${contact.website}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                       Corporate Domain
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealModal;
