
import React, { useState, useEffect } from 'react';
import { Trip, TripItem } from '../types';
import { ArrowLeft, CheckCircle2, Circle, Edit3, PieChart, Layers } from 'lucide-react';

interface TripRunnerProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
  onBack: () => void;
  onEdit: () => void;
}

export const TripRunner: React.FC<TripRunnerProps> = ({ trip, onUpdateTrip, onBack, onEdit }) => {
  const [localTrip, setLocalTrip] = useState<Trip>(trip);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm pt-4 pb-2 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800">
            <ArrowLeft size={20} className="mr-1" />
            回到列表
          </button>
          <div className="flex items-center gap-2">
            <button 
                onClick={onEdit}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
                <Edit3 size={16} />
                編輯清單
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
                {groupItems.map(item => (
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
                            <span className={`text-lg font-bold break-words ${item.checked ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                            {item.name}
                            </span>
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
                ))}
            </div>
            </div>
        );
      })}
      
      {localTrip.items.length === 0 && (
         <div className="text-center py-20 text-slate-400">
            <PieChart size={48} className="mx-auto mb-4 opacity-50" />
            <p>此行程沒有物品，請點擊編輯加入物品。</p>
         </div>
      )}
    </div>
  );
};
