
import React, { useState } from 'react';
import { useCRM } from '../CRMContext';
import { ICONS } from '../constants';

interface ContactsViewProps {
  searchQuery: string;
}

const ContactsView: React.FC<ContactsViewProps> = ({ searchQuery }) => {
  const { contacts, addContact, deals, setActiveDealId } = useCRM();
  const [showAdd, setShowAdd] = useState(false);
  const [newContact, setNewContact] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    phoneCountryCode: '+256', // Fix: Added required phoneCountryCode property
    company: '', 
    jobTitle: '',
    industry: '',
    location: '',
    linkedinUrl: ''
  });

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    // Fix: spread newContact which now includes phoneCountryCode
    addContact({ ...newContact, name: `${newContact.firstName} ${newContact.lastName}` });
    setNewContact({ 
      firstName: '', lastName: '', email: '', phone: '', phoneCountryCode: '+256', company: '', 
      jobTitle: '', industry: '', location: '', linkedinUrl: '' 
    });
    setShowAdd(false);
  };

  const handleRowClick = (contactId: string) => {
    const contactDeal = deals.find(d => d.contactId === contactId);
    if (contactDeal) {
      setActiveDealId(contactDeal.id);
    } else {
      alert("This contact exists but has no active opportunity linked.");
    }
  };

  return (
    <div className="p-10 space-y-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">CRM Directory</h2>
          <p className="text-slate-500 font-medium mt-2">Total of <span className="text-blue-600 font-black">{contacts.length}</span> verified professional identities.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
        >
          <ICONS.Plus /> Register New Profile
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stakeholder Persona</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Corporate Affiliation</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity Node</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(contact => (
                <tr 
                  key={contact.id} 
                  onClick={() => handleRowClick(contact.id)}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-sm font-black text-slate-300 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-md transition-all uppercase border border-transparent group-hover:border-blue-100">
                        {contact.firstName?.[0] || '?'}{contact.lastName?.[0] || ''}
                      </div>
                      <div>
                        <span className="font-black text-slate-900 block group-hover:text-blue-700 tracking-tight text-base leading-tight">{contact.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{contact.jobTitle || 'No Title'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col">
                        <span className="text-slate-900 font-black text-sm uppercase tracking-tight">{contact.company}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{contact.industry || 'General Industry'}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors">{contact.email}</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{contact.phone || 'No Phone'}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-3">
                        {contact.linkedinUrl && (
                          <div title="LinkedIn Profile Linked" className="p-2 bg-slate-50 rounded-xl text-blue-600 border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                          </div>
                        )}
                        {contact.location && (
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-3 py-1.5 rounded-full border">📍 {contact.location}</span>
                        )}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-32 text-center bg-slate-50/30">
             <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-100 shadow-xl shadow-slate-200/50">
                <ICONS.Users />
             </div>
             <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">No records found in identity cache.</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <form onSubmit={handleAdd} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl p-12 space-y-10 max-h-[90vh] overflow-y-auto relative">
            <button 
              type="button" 
              onClick={() => setShowAdd(false)} 
              className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div className="text-center">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Register Persona</h3>
              <p className="text-sm text-slate-400 font-medium mt-2">Initialize a verified professional profile.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4 col-span-2">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] text-center border-b pb-4">Personal Identity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="First Name" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold" value={newContact.firstName} onChange={e => setNewContact({...newContact, firstName: e.target.value})} />
                  <input required placeholder="Last Name" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold" value={newContact.lastName} onChange={e => setNewContact({...newContact, lastName: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4 col-span-2">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] text-center border-b pb-4 mt-4">Professional Context</h4>
                <input required placeholder="Job Title / Designation" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={newContact.jobTitle} onChange={e => setNewContact({...newContact, jobTitle: e.target.value})} />
                <input required placeholder="Organization Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={newContact.company} onChange={e => setNewContact({...newContact, company: e.target.value})} />
                <input required type="email" placeholder="Professional Email Node" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} />
                <div className="flex gap-2">
                  <select 
                    className="w-24 bg-slate-50 border border-slate-200 rounded-2xl px-2 font-bold text-xs outline-none focus:border-indigo-500" 
                    value={newContact.phoneCountryCode} 
                    onChange={e => setNewContact({...newContact, phoneCountryCode: e.target.value})}
                  >
                    <option value="+256">🇺🇬 +256</option>
                    <option value="+254">🇰🇪 +254</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <input placeholder="Phone / Direct Line" className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
              <button type="submit" className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all">Commit Profile</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ContactsView;
