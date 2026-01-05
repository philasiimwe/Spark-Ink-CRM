
import React from 'react';
import { useCRM } from '../CRMContext';
import { STAGES, ICONS, PRIORITIES } from '../constants';
import { Stage } from '../types';

interface PipelineProps {
  searchQuery: string;
}

const Pipeline: React.FC<PipelineProps> = ({ searchQuery }) => {
  const { deals, updateDealStage, contacts, setActiveDealId } = useCRM();

  const filteredDeals = deals.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDealsInStage = (stageId: string) => filteredDeals.filter(d => d.stage === stageId);

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    const dealId = e.dataTransfer.getData('dealId');
    updateDealStage(dealId, stageId as Stage);
  };

  const isRotten = (deal: any) => {
    const lastUpdate = new Date(deal.updatedAt).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return lastUpdate < sevenDaysAgo;
  };

  const formatCurrency = (val: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex h-full overflow-x-auto pb-4 gap-4 p-4 min-w-max">
      {STAGES.map(stage => {
        const stageDeals = getDealsInStage(stage.id);
        const totalValueUSD = stageDeals.reduce((sum, d) => sum + (d.currency === 'USD' ? d.value : d.value / 3700), 0); // Mock normalization for display

        return (
          <div 
            key={stage.id} 
            className="flex flex-col w-80 bg-slate-100/50 rounded-xl border border-slate-200"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className={`p-4 rounded-t-xl border-b ${stage.color} flex justify-between items-center`}>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">{stage.label}</h3>
                <p className="text-[10px] text-slate-500 font-black mt-1 uppercase">
                  {stageDeals.length} deals • Total ~{formatCurrency(totalValueUSD)}
                </p>
              </div>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {stageDeals.map(deal => {
                const contact = contacts.find(c => c.id === deal.contactId);
                const priority = PRIORITIES.find(p => p.id === deal.priority);
                const rotten = isRotten(deal);

                return (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onClick={() => setActiveDealId(deal.id)}
                    className="group bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1 w-full overflow-hidden">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900 group-hover:text-blue-600 truncate">{deal.title}</h4>
                          {deal.isFollowed && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Following" />}
                          {rotten && (
                            <span className="text-rose-500 shrink-0" title="Deal is rotting">
                               <ICONS.AlertCircle />
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${priority?.color}`}>
                              {priority?.label}
                           </span>
                           {deal.tags.map(tag => (
                             <span key={tag} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                               {tag}
                             </span>
                           ))}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-400">{deal.probability}%</span>
                    </div>

                    <div className="flex items-center text-xs text-slate-500 mb-3">
                      <span className="truncate font-medium">{contact?.company}</span>
                    </div>

                    <div className="flex justify-between items-center mt-auto border-t pt-2 border-slate-50">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{formatCurrency(deal.value, deal.currency)}</span>
                        {deal.expectedCloseDate && (
                          <span className="text-[10px] text-slate-400">Exp: {deal.expectedCloseDate}</span>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100 uppercase">
                        {contact?.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </div>
                );
              })}
              {stageDeals.length === 0 && (
                <div className="py-10 text-center text-slate-300 text-xs italic border-2 border-dashed border-slate-200 rounded-lg">
                  Drop deals here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Pipeline;
