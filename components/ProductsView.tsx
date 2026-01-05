
import React, { useState } from 'react';
import { ICONS } from '../constants';

const PRODUCTS = [
  { id: 'p1', name: 'Nexus Enterprise License', category: 'Software', price: 24000, billing: 'Annually', status: 'Active' },
  { id: 'p2', name: 'Growth Suite Pro', category: 'Software', price: 12000, billing: 'Annually', status: 'Active' },
  { id: 'p3', name: 'Implementation Service', category: 'Service', price: 5000, billing: 'One-time', status: 'Active' },
  { id: 'p4', name: 'Premium Support 24/7', category: 'Support', price: 3500, billing: 'Monthly', status: 'Active' },
  { id: 'p5', name: 'AI Insights Extension', category: 'Software', price: 8500, billing: 'Annually', status: 'Active' },
  { id: 'p6', name: 'Custom CRM Integration', category: 'Service', price: 15000, billing: 'One-time', status: 'Legacy' },
];

const ProductsView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Software', 'Service', 'Support'];

  const filtered = activeCategory === 'All' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Products</h2>
          <p className="text-slate-500 font-medium mt-2">Manage your inventory and pricing models.</p>
        </div>
        <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Add Product</button>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(c => (
          <button 
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeCategory === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filtered.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all group">
            <div className="flex justify-between items-start mb-6">
               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>
               </div>
               <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                 {p.status}
               </span>
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">{p.name}</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{p.category}</p>
            
            <div className="flex justify-between items-end border-t pt-6 border-slate-50">
               <div>
                  <p className="text-[9px] font-black text-slate-300 uppercase">Pricing Plan</p>
                  <p className="text-2xl font-black text-slate-900">${p.price.toLocaleString()}</p>
               </div>
               <span className="text-[10px] font-bold text-slate-400">{p.billing}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsView;
