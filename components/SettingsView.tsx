
import React, { useState, useEffect } from 'react';
import { useCRM } from '../CRMContext';
import { googleService } from '../googleService';

const SettingsView: React.FC = () => {
  const { user, updateUser, team, updateTeamMember } = useCRM();
  const [activeTab, setActiveTab] = useState('PROFILE');

  // Form states
  const [localUser, setLocalUser] = useState(user);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const tabs = [
    { id: 'PROFILE', label: 'My Profile' },
    { id: 'TEAM', label: 'Team Members' },
    { id: 'INTEGRATIONS', label: 'Integrations' },
    { id: 'SECURITY', label: 'Security' },
  ];

  const handleUserSave = () => {
    updateUser(localUser);
    // Update the google service if ID changed
    if (localUser.googleClientId) {
      googleService.setClientId(localUser.googleClientId);
    }
    alert('Global settings updated successfully!');
  };

  const handleMemberSave = (id: string, name: string, role: string) => {
    updateTeamMember(id, { name, role });
    setEditingMemberId(null);
  };

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-12 max-w-7xl mx-auto h-full overflow-y-auto">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 font-medium mt-2">Workspace configuration for Administrator {user.name}.</p>
      </header>

      <div className="flex bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm w-fit gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden p-8 md:p-12">
        {activeTab === 'PROFILE' && (
          <div className="max-w-2xl space-y-10">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-3xl font-black text-white border-4 border-slate-50 shadow-xl">
                {localUser.name[0]}
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">Admin Control Node</h4>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Authorized for all modules</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                  value={localUser.name}
                  onChange={e => setLocalUser({ ...localUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Node</label>
                <input
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                  value={localUser.email}
                  onChange={e => setLocalUser({ ...localUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Professional Identity Bio</label>
                <textarea
                  rows={4}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none focus:border-blue-500 transition-all"
                  value={localUser.bio}
                  onChange={e => setLocalUser({ ...localUser, bio: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={handleUserSave}
              className="bg-blue-600 text-white px-12 py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Sync Profile Data
            </button>
          </div>
        )}

        {activeTab === 'TEAM' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <h4 className="text-2xl font-black text-slate-900">Workspace Teammates</h4>
              <button className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Invite Colleague</button>
            </div>

            <div className="grid gap-6">
              {team.map(m => {
                const isEditing = editingMemberId === m.id;
                return (
                  <div key={m.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-white hover:border-blue-100 transition-all group">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-slate-300 shadow-sm border border-slate-100 group-hover:text-blue-600 transition-colors">
                        {m.name[0]}
                      </div>
                      {isEditing ? (
                        <div className="flex flex-col md:flex-row gap-4 flex-1">
                          <input
                            className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                            defaultValue={m.name}
                            id={`name-${m.id}`}
                          />
                          <input
                            className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                            defaultValue={m.role}
                            id={`role-${m.id}`}
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-black text-slate-900 tracking-tight">{m.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{m.role}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {isEditing ? (
                        <button
                          onClick={() => handleMemberSave(
                            m.id,
                            (document.getElementById(`name-${m.id}`) as HTMLInputElement).value,
                            (document.getElementById(`role-${m.id}`) as HTMLInputElement).value
                          )}
                          className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                        >
                          Update
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingMemberId(m.id)}
                          className="p-3 bg-white text-slate-400 hover:text-blue-600 border border-slate-100 rounded-xl transition-all shadow-sm"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121(0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                      )}
                      <button className="p-3 bg-white text-slate-400 hover:text-rose-600 border border-slate-100 rounded-xl transition-all shadow-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'INTEGRATIONS' && (
          <div className="max-w-2xl space-y-12">
            <div>
              <h4 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Google Core Integration</h4>
              <p className="text-slate-500 text-sm mb-8 font-medium leading-relaxed">To enable real Google Calendar and Google Meet sync, you must provide your Google Cloud Console Client ID. This is required to authorize API requests for your workspace.</p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OAuth 2.0 Client ID</label>
                  <input
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all font-mono text-sm"
                    placeholder="e.g. xxxxxxxx-xxxxxxxx.apps.googleusercontent.com"
                    value={localUser.googleClientId || ''}
                    onChange={e => setLocalUser({ ...localUser, googleClientId: e.target.value })}
                  />
                  <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Get this from the Google Cloud Console &gt; Credentials</p>
                </div>

                <div className="flex items-center gap-4 p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-5 h-5" alt="GCal" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-blue-700 uppercase tracking-widest">Calendar Permissions</p>
                    <p className="text-[10px] font-bold text-blue-600/70">Nexus will request access to manage events and create Meet links.</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleUserSave}
              className="bg-slate-900 text-white px-10 py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Update Integrations
            </button>
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div className="max-w-2xl space-y-12">
            <div>
              <h4 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Access Node Safety</h4>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Global Admin Lock</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Restrict edits to master profile</p>
                  </div>
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-slate-900">API Key Rotation</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current: Verified GenAI Link</p>
                  </div>
                  <button className="text-[10px] font-black text-slate-600 uppercase tracking-widest border border-slate-200 px-4 py-2 rounded-lg bg-white shadow-sm">Configured</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
