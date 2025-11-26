import React, { useState, useEffect } from 'react';
import { Trip, TripItem, InventoryCategory } from '../types';
import { ArrowLeft, CheckCircle2, Circle, Edit3, PieChart, Layers, X } from 'lucide-react';

interface TripRunnerProps {
  trip: Trip;
  categories: InventoryCategory[];
  onUpdateTrip: (trip: Trip) => void;
  onBack: () => void;
  onEdit: () => void;
}

interface SummaryItem {
    name: string;
    totalQty: number;
    details: { version: string, qty: number }[];
}

interface SummaryCategory {
    categoryId: string;
    items: SummaryItem[];
}

export const TripRunner: React.FC<TripRunnerProps> = ({ trip, categories, onUpdateTrip, onBack, onEdit }) => {
  const [localTrip, setLocalTrip] = useState<Trip>(trip);
  const [showSummary, setShowSummary] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setLocalTrip(trip);
  }, [trip]);

  const toggleCheck = (itemId: string) => {
    const updatedItems = localTrip.items.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    const updatedTrip = { ...localTrip, items: updatedItems };
    
    // Check if all complete to update status
    const allChecked = updatedItems.every(i => i.checked);
    updatedTrip.status = allChecked ? 'completed' : 'active';
    
    setLocalTrip(updatedTrip);
    onUpdateTrip(updatedTrip);
  };

  const progress = Math.round((localTrip.items.filter(i => i.checked).length / localTrip.items.length) * 100) || 0;

  const getCategoryInfo = (catId: string) => {
      const cat = categories.find(c => c.id === catId);
      return {
          name: cat?.name || '未知',
          color: cat?.color || 'bg-gray-100 text-gray-600 border-gray-200'
      };
  };

  // Generate Summary Report Logic
  const generateSummary = () => {
      const summary: SummaryCategory[] = [];
      
      // Group all items by Category first
      const itemsByCategory: Record<string, TripItem[]> = {};
      localTrip.items.forEach(item => {
          if(!itemsByCategory[item.category]) itemsByCategory[item.category] = [];
          itemsByCategory[item.category].push(item);
      });

      // For each category, group by Item Name
      Object.keys(itemsByCategory).forEach(catId => {
          const items = itemsByCategory[catId];
          const itemsByName: Record<string, TripItem[]> = {};
          
          items.forEach(item => {
              if(!itemsByName[item.name]) itemsByName[item.name] = [];
              itemsByName[item.name].push(item);
          });

          const summaryItems: SummaryItem[] = Object.keys(itemsByName).map(name => {
              const variants = itemsByName[name];
              const totalQty = variants.reduce((sum, i) => sum + i.qty, 0);
              
              // Group by version/note to show details
              const detailsMap: Record<string, number> = {};
              variants.forEach(v => {
                  const key = v.version || '(無備註)';
                  detailsMap[key] = (detailsMap[key] || 0) + v.qty;
              });

              const details = Object.keys(detailsMap).map(ver => ({
                  version: ver,
                  qty: detailsMap[ver]
              }));

              return { name, totalQty, details };
          });

          summary.push({ categoryId: catId, items: summaryItems });
      });

      return summary;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Summary Modal */}
      {showSummary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800">
                          <PieChart className="text-blue-600" /> 行程統計總表
                      </h3>
                      <button onClick={() => setShowSummary(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                          <X size={24} className="text-slate-500" />
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                      {generateSummary().map(catGroup => {
                          const catInfo = getCategoryInfo(catGroup.categoryId);
                          return (
                              <div key={catGroup.categoryId} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                  <div className={`px-4 py-2 font-bold text-sm uppercase tracking-wider border-b ${catInfo.color.replace('text-', 'bg-opacity-10 bg-').split(' ')[0]} ${catInfo.color.split(' ')[1]}`}>
                                      {catInfo.name}
                                  </div>
                                  <div className="divide-y divide-slate-50">
                                      {catGroup.items.map((item, idx) => (
                                          <div key={idx} className="p-4 bg-white flex flex-col sm:flex-row sm:justify-between gap-2">
                                              <div className="flex items-baseline gap-2">
                                                  <span className="font-bold text-slate-800 text-lg">{item.name}</span>
                                                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">總計: {item.totalQty}</span>
                                              </div>
                                              <div className="flex flex-col gap-1 sm:items-end">
                                                  {item.details.map((detail, dIdx) => (
                                                      <div key={dIdx} className="text-sm text-slate-600 flex items-center gap-2">
                                                          <span className={`px-2 py-0.5 rounded text-xs border ${detail.version === '(無備註)' ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                                                              {detail.version}
                                                          </span>
                                                          <span className="font-mono">x{detail.qty}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          );
                      })}
                      {localTrip.items.length === 0 && <p className="text-center text-slate-400 py-8">目前沒有物品可供統計</p>}
                  </div>
                  <div className="p-4 border-t bg-slate-50 text-center rounded-b-xl">
                      <button onClick={() => setShowSummary(false)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                          關閉
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm pt-4 pb-2 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800">
            <ArrowLeft size={20} className="mr-1" />
            回到列表
          </button>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowSummary(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 font-medium shadow-sm transition-all"
                title="查看統計總表"
            >
                <PieChart size={16} />
                <span className="hidden sm:inline">統計總表</span>
            </button>
            <div className="h-4 w-px bg-slate-300 mx-1"></div>
            <button 
                onClick={onEdit}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
            >
                <Edit3 size={16} />
                編輯
            </button>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${localTrip.status === 'completed' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                {localTrip.status === 'completed' ? '已完成' : '進行中'}
            </span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{localTrip.name}</h1>
        
        {/* Progress Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="font-bold text-slate-700 min-w-[3rem] text-right">{progress}%</span>
        </div>
      </div>

      {/* Checklist Groups (By Packing Group) */}
      {localTrip.groups.map(group => {
        const groupItems = localTrip.items.filter(i => i.tripGroupId === group.id);
        if (groupItems.length === 0) return null;

        return (
            <div key={group.id} className="space-y-3">
            <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                <Layers size={18} className="text-blue-500"/>
                {group.name}
            </h3>
            <div className="grid grid-cols-1 gap-3">
                {groupItems.map(item => {
                    const info = getCategoryInfo(item.category);
                    return (
                    <div 
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className={`
                        relative cursor-pointer transition-all duration-200 
                        p-4 rounded-xl border-2 shadow-sm flex items-start gap-4
                        ${item.checked 
                            ? 'bg-green-50 border-green-200 opacity-70' 
                            : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                        }
                        `}
                    >
                        <div className={`
                        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors mt-1
                        ${item.checked ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-300'}
                        `}>
                        <CheckCircle2 size={20} className={item.checked ? 'opacity-100' : 'opacity-0'} />
                        {!item.checked && <Circle size={20} className="absolute" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex flex-col">
                                    <span className={`text-lg font-bold break-words ${item.checked ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                    {item.name}
                                    </span>
                                    <span className={`text-[10px] w-fit px-1.5 py-0.5 rounded border ${info.color} mt-1`}>
                                        {info.name}
                                    </span>
                                </div>
                                <span className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded text-sm whitespace-nowrap ml-2">
                                x{item.qty}
                                </span>
                            </div>
                            {item.version && (
                                <div className={`text-sm mt-2 font-medium px-3 py-2 rounded w-full whitespace-pre-wrap break-words leading-relaxed ${item.checked ? 'bg-slate-100 text-slate-400' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'}`}>
                                {item.version}
                                </div>
                            )}
                        </div>
                    </div>
                )})}
            </div>
            </div>
        );
      })}
      
      {localTrip.items.length === 0 && (
         <div className="text-center py-20 text-slate-400">
            <Layers size={48} className="mx-auto mb-4 opacity-50" />
            <p>此行程沒有物品，請點擊編輯加入物品。</p>
         </div>
      )}
    </div>
  );
};