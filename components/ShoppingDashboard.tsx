import React, { useState } from 'react';
import { ShoppingList, ShoppingCategory } from '../types';
import { Plus, ShoppingCart, Copy, X, ChevronRight, Settings, Tag } from 'lucide-react';
import { CATEGORY_PALETTE } from '../constants';

interface ShoppingDashboardProps {
  lists: ShoppingList[];
  categories: ShoppingCategory[];
  onCreateList: () => void;
  onOpenList: (id: string) => void;
  onDeleteList: (id: string) => void;
  onDuplicateList: (list: ShoppingList) => void;
  onUpdateCategories: (categories: ShoppingCategory[]) => void;
}

export const ShoppingDashboard: React.FC<ShoppingDashboardProps> = ({ lists, categories, onCreateList, onOpenList, onDeleteList, onDuplicateList, onUpdateCategories }) => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [localCategories, setLocalCategories] = useState<ShoppingCategory[]>(categories);

  const handleAddCategory = () => {
    setLocalCategories([...localCategories, { id: Math.random().toString(36).substring(2, 9), name: '新分類', color: CATEGORY_PALETTE[0].class }]);
  };

  const handleUpdateCategory = (id: string, updates: Partial<ShoppingCategory>) => {
    setLocalCategories(localCategories.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteCategory = (id: string) => {
    if(window.confirm('確定要刪除此分類嗎？')) {
      setLocalCategories(localCategories.filter(c => c.id !== id));
    }
  };

  const handleSaveCategories = () => {
    onUpdateCategories(localCategories);
    setShowCategoryModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 dark:from-emerald-900 dark:to-teal-900 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 border border-emerald-700">
          <div className="flex-1 w-full">
              <h1 className="text-3xl font-bold mb-2">採購與願望清單</h1>
              <p className="text-emerald-100">管理您的購物預算、追蹤購買狀態。</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setLocalCategories(categories); setShowCategoryModal(true); }} className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap">
                <Settings size={20} /> 分類管理
            </button>
            <button onClick={onCreateList} className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap">
                <Plus size={24} /> 新增採購清單
            </button>
          </div>
      </div>

      <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><ShoppingCart size={20} className="text-slate-500" />所有清單</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.length === 0 ? (
                  <div className="col-span-full bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center text-slate-400">
                      <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                      <p>尚無採購清單，點擊上方按鈕開始建立。</p>
                  </div>
              ) : (
                  lists.map(list => {
                      const totalSpent = list.items.filter(i => i.status === 'bought').reduce((sum, i) => sum + (i.price * i.qty), 0);
                      const totalEstimated = list.items.filter(i => i.status !== 'dropped').reduce((sum, i) => sum + (i.price * i.qty), 0);
                      const budget = list.budget || 0;
                      const percent = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0;
                      const isOverBudget = budget > 0 && totalSpent > budget;

                      return (
                          <div key={list.id} onClick={() => onOpenList(list.id)} className="group bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-all cursor-pointer relative">
                              <div className="flex justify-between items-start mb-3">
                                  <div className="min-w-0 pr-4">
                                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors truncate">{list.name}</h3>
                                      <p className="text-sm text-slate-500 dark:text-slate-400">{list.date}</p>
                                  </div>
                                  <div className="flex flex-col items-end shrink-0">
                                      <div className="flex gap-1 mt-1 z-10">
                                          <button onClick={(e) => { e.stopPropagation(); onDuplicateList(list); }} className="text-slate-300 hover:text-emerald-500 p-1" title="複製"><Copy size={14}/></button>
                                          <button onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }} className="text-slate-300 hover:text-red-500 p-1" title="刪除"><X size={16}/></button>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="space-y-2 mt-4">
                                  <div className="flex justify-between text-sm font-medium">
                                      <span className="text-slate-500 dark:text-slate-400">已花費 / 預估</span>
                                      <span className="text-slate-800 dark:text-slate-200">${totalSpent.toLocaleString()} / ${totalEstimated.toLocaleString()}</span>
                                  </div>
                                  {budget > 0 && (
                                    <>
                                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                                          <span>預算: ${budget.toLocaleString()}</span>
                                          <span className={isOverBudget ? 'text-red-500' : ''}>{percent}%</span>
                                      </div>
                                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                                      </div>
                                    </>
                                  )}
                              </div>
                              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                          </div>
                      )
                  })
              )}
          </div>
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700 max-h-[80vh]">
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white"><Tag className="text-emerald-600" /> 採購分類管理</h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {localCategories.map(cat => (
                <div key={cat.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input 
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                    value={cat.name}
                    onChange={e => handleUpdateCategory(cat.id, { name: e.target.value })}
                  />
                  <select 
                    className={`text-xs rounded px-2 py-1 border-none focus:ring-0 cursor-pointer ${cat.color}`}
                    value={cat.color}
                    onChange={e => handleUpdateCategory(cat.id, { color: e.target.value })}
                  >
                    {CATEGORY_PALETTE.map(p => <option key={p.class} value={p.class} className={p.class}>{p.name}</option>)}
                  </select>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button onClick={handleAddCategory} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:text-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm font-bold">
                <Plus size={16} /> 新增分類
              </button>
            </div>
            <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
              <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium">取消</button>
              <button onClick={handleSaveCategories} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm">儲存變更</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};