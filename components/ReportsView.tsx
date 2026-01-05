
import React from 'react';
import { useCRM } from '../CRMContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const ReportsView: React.FC = () => {
  const { deals } = useCRM();

  const sourceData = [
    { name: 'Website', value: deals.filter(d => d.source === 'WEBSITE').length },
    { name: 'Referral', value: deals.filter(d => d.source === 'REFERRAL').length },
    { name: 'Partner', value: deals.filter(d => d.source === 'PARTNER').length },
    { name: 'Outreach', value: deals.filter(d => d.source === 'COLD_OUTREACH').length },
    { name: 'Marketing', value: deals.filter(d => d.source === 'MARKETING').length },
  ];

  const trendData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 68000 },
    { month: 'Jun', revenue: 75000 },
  ];

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-12 max-w-7xl mx-auto h-full overflow-y-auto">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Reports</h2>
          <p className="text-slate-500 font-medium mt-2">Deep-dive into conversion trends and channel ROI.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10">Opportunities by Source</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontStyle: 'bold', fill: '#94a3b8' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontStyle: 'bold', fill: '#94a3b8' }} width={80} />
                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10">Revenue Growth Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontStyle: 'bold', fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontStyle: 'bold', fill: '#94a3b8' }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Conversion Rate', value: '18.4%', trend: '+2.1%', color: 'text-emerald-500' },
           { label: 'Average Sales Cycle', value: '42 Days', trend: '-5 Days', color: 'text-emerald-500' },
           { label: 'Customer Acquisition Cost', value: '$840', trend: '+$24', color: 'text-rose-500' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
              <div className="flex items-end gap-3">
                 <h4 className="text-3xl font-black text-slate-900 leading-none">{stat.value}</h4>
                 <span className={`text-[10px] font-black ${stat.color} mb-1`}>{stat.trend}</span>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};

export default ReportsView;
