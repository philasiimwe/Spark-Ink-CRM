
import React, { useMemo, useEffect, useState } from 'react';
import { useCRM } from '../CRMContext';
import { STAGES, ICONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getSalesForecast } from '../geminiService';

const Dashboard: React.FC = () => {
  const { deals } = useCRM();
  const [forecast, setForecast] = useState<string>('');
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Normalize values to USD for statistics consistency (mock conversion)
  const normalizedDeals = useMemo(() => {
    return deals.map(d => ({
      ...d,
      valueInUSD: d.currency === 'USD' ? d.value : d.value / 3700
    }));
  }, [deals]);

  const stageData = useMemo(() => {
    return STAGES.map(s => ({
      name: s.label,
      value: normalizedDeals.filter(d => d.stage === s.id).reduce((sum, d) => sum + d.valueInUSD, 0)
    }));
  }, [normalizedDeals]);

  const stats = useMemo(() => {
    const total = normalizedDeals.reduce((sum, d) => sum + d.valueInUSD, 0);
    const won = normalizedDeals.filter(d => d.stage === 'CLOSED_WON').reduce((sum, d) => sum + d.valueInUSD, 0);
    const count = normalizedDeals.length;
    const avg = count > 0 ? total / count : 0;
    return { total, won, count, avg };
  }, [normalizedDeals]);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoadingForecast(true);
      const res = await getSalesForecast(deals);
      setForecast(res);
      setLoadingForecast(false);
    };
    fetchForecast();
  }, [deals]);

  const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

  const formatCompact = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(val);
  };

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-12 max-w-7xl mx-auto h-full overflow-y-auto overflow-x-hidden">
      <header>
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Insights</h2>
        <p className="text-slate-500 font-medium mt-2">Real-time performance metrics derived from your pipeline.</p>
      </header>

      {/* Forecast Card */}
      <div className="bg-slate-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          <div className="flex-1 w-full">
             <div className="flex items-center gap-3 mb-4 md:mb-6">
                <ICONS.Sparkles />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Sales Forecaster</span>
             </div>
             <p className="text-lg md:text-xl font-medium leading-relaxed italic opacity-90">
               "{loadingForecast ? 'Processing pipeline intelligence...' : forecast}"
             </p>
          </div>
          <div className="bg-white/10 p-6 md:p-8 rounded-3xl border border-white/10 text-center w-full md:w-auto shrink-0">
             <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Quarterly Projection</div>
             <div className="text-3xl md:text-4xl font-black">{formatCompact(stats.total * 0.8)}</div>
          </div>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {[
          { label: 'Pipeline Value', value: stats.total, icon: <ICONS.DollarSign />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Deals', value: stats.count, icon: <ICONS.Layout />, color: 'text-indigo-600', bg: 'bg-indigo-50', noCurrency: true },
          { label: 'Revenue Won', value: stats.won, icon: <ICONS.BarChart />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg. Deal Size', value: stats.avg, icon: <ICONS.DollarSign />, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 md:gap-6 min-w-0">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
              <h4 className="text-xl md:text-2xl font-black text-slate-900 truncate">
                {stat.noCurrency ? stat.value : formatCompact(stat.value as number)}
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 md:mb-10">Value Distribution by Stage</h3>
          <div className="h-[300px] md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontStyle: 'bold', fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 md:mb-10">Revenue Allocation</h3>
          <div className="h-[300px] md:h-80 flex flex-col sm:flex-row items-center gap-4 md:gap-8 w-full">
            <div className="w-full sm:w-2/3 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stageData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                    {stageData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/3 space-y-2 overflow-y-auto pr-2 scrollbar-hide max-h-full">
              {stageData.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-slate-600 truncate">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
