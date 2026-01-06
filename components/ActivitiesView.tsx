
import React, { useState, useEffect } from 'react';
import { useCRM } from '../CRMContext';
import { ICONS } from '../constants';
import { googleService } from '../googleService';

const ActivitiesView: React.FC = () => {
  const { activities, deals, setActiveDealId, user } = useCRM();
  const [isSynced, setIsSynced] = useState(googleService.isConnected());
  const [loading, setLoading] = useState(false);

  // Auto-set the client ID if it exists in the user profile
  useEffect(() => {
    if (user.googleClientId) {
      googleService.setClientId(user.googleClientId);
    }
  }, [user.googleClientId]);

  const handleGoogleConnect = async () => {
    if (!user.googleClientId) {
      alert('Missing Google Client ID. Please configure it in Settings > Integrations first.');
      return;
    }

    setLoading(true);
    try {
      await googleService.connect(user.googleClientId);
      setIsSynced(true);
      alert('Google Calendar successfully linked!');
    } catch (err: any) {
      console.error('Connection Error:', err);
      const msg = err.message || (err.error && typeof err.error === 'string' ? err.error : 'Connection failed. Check your Client ID and network.');
      alert(`Failed to connect to Google: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-12 max-w-7xl mx-auto h-full overflow-y-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Schedule</h2>
          <p className="text-slate-500 font-medium mt-2">Manage your calls, meetings, and sales tasks.</p>
        </div>
        <div className="flex gap-4">
          <button
            disabled={loading}
            onClick={handleGoogleConnect}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isSynced ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /><path d="m9 12 2 2 4-4" /></svg>
            )}
            {isSynced ? 'Synced to Google' : 'Link Google Calendar'}
          </button>
          <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">New Task</button>
        </div>
      </header>

      {/* External Tools Sync Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`p-6 rounded-[2rem] border flex items-center gap-4 transition-all ${isSynced ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-5 h-5" alt="GCal" />
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Google Calendar</p>
            <p className="text-xs font-bold text-slate-600">{isSynced ? 'Successfully Linked' : 'Awaiting Connection'}</p>
          </div>
        </div>
        <div className={`p-6 rounded-[2rem] border flex items-center gap-4 transition-all ${isSynced ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg" className="w-5 h-5" alt="Meet" />
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Google Meet</p>
            <p className="text-xs font-bold text-slate-600">{isSynced ? 'Active Integration' : 'Awaiting connection'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activities.map(act => {
          const deal = deals.find(d => d.id === act.dealId);
          return (
            <div
              key={act.id}
              onClick={() => setActiveDealId(act.dealId)}
              className="group bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-500 transition-all cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-slate-50 group-hover:bg-blue-50 transition-colors text-2xl">
                  {act.type === 'CALL' ? '📞' : act.type === 'EMAIL' ? '✉️' : act.type === 'MEETING' ? '🤝' : '📝'}
                </div>
                <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${act.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {act.status}
                </span>
              </div>
              <h4 className="font-black text-slate-900 text-lg mb-2 group-hover:text-blue-700 transition-colors truncate">{act.subject}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 truncate">{deal?.title}</p>

              <div className="flex justify-between items-center border-t pt-6 border-slate-50">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
                  <ICONS.Calendar />
                  {act.dueDate}
                </div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Details →</span>
              </div>
            </div>
          );
        })}
      </div>

      {
        activities.length === 0 && (
          <div className="text-center py-40 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
              <ICONS.Calendar />
            </div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No scheduled activities found.</p>
          </div>
        )
      }
    </div>
  );
};

export default ActivitiesView;
