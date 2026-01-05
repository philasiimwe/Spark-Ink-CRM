
import React, { useState } from 'react';
import { CRMProvider, useCRM } from './CRMContext';
import { ViewType } from './types';
import { ICONS } from './constants';
import Pipeline from './components/Pipeline';
import Dashboard from './components/Dashboard';
import ContactsView from './components/ContactsView';
import ActivitiesView from './components/ActivitiesView';
import SettingsView from './components/SettingsView';
import AddDealModal from './components/AddDealModal';
import DealModal from './components/DealModal';

const MainLayout: React.FC = () => {
  const { activeDealId, setActiveDealId, deals } = useCRM();
  const [currentView, setCurrentView] = useState<ViewType>('PIPELINE');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);

  const activeDeal = deals.find(d => d.id === activeDealId);

  const menuItems = [
    { id: 'PIPELINE', label: 'Opportunities', icon: <ICONS.Layout /> },
    { id: 'CONTACTS', label: 'Directory', icon: <ICONS.Users /> },
    { id: 'ACTIVITIES', label: 'Schedule', icon: <ICONS.Calendar /> },
    { id: 'INSIGHTS', label: 'Insights', icon: <ICONS.BarChart /> },
    { id: 'SETTINGS', label: 'Settings', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'PIPELINE': return <Pipeline searchQuery={searchQuery} />;
      case 'CONTACTS': return <ContactsView searchQuery={searchQuery} />;
      case 'ACTIVITIES': return <ActivitiesView />;
      case 'INSIGHTS': return <Dashboard />;
      case 'SETTINGS': return <SettingsView />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <aside className="w-20 lg:w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 shrink-0 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/50 shrink-0">
            N
          </div>
          <span className="hidden lg:block text-xl font-bold text-white tracking-tight">Nexus CRM</span>
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewType)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="hidden lg:block font-bold text-sm whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 p-2 lg:p-4 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold uppercase shrink-0">JD</div>
              <div className="hidden lg:block">
                <p className="text-xs font-bold text-white">John Doe</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Senior Partner</p>
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="relative w-1/3 max-w-md hidden md:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <ICONS.Search />
            </span>
            <input 
              type="text" 
              placeholder="Search people, deals, or reports..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <button 
              onClick={() => setIsAddDealOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-2"
            >
              <ICONS.Plus /> New Opportunity
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="h-full min-w-full inline-block align-top">
            {renderContent()}
          </div>
        </div>
      </main>

      {isAddDealOpen && <AddDealModal onClose={() => setIsAddDealOpen(false)} />}
      {activeDeal && <DealModal deal={activeDeal} onClose={() => setActiveDealId(null)} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <CRMProvider>
      <MainLayout />
    </CRMProvider>
  );
};

export default App;
