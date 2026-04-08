import React, { useState, useEffect } from 'react';
import { ShoppingList, ShoppingItem, ShoppingCategory, ShoppingItemStatus } from '../types';
import { ArrowLeft, Plus, Trash2, Edit2, Check, DollarSign, Tag, Link as LinkIcon, Layers } from 'lucide-react';
import { DEFAULT_SHOPPING_GROUP_ID } from '../constants';

interface ShoppingListEditorProps {
  list: ShoppingList;
  categories: ShoppingCategory[];
  onSave: (list: ShoppingList) => void;
  onBack: () => void;
}

export const ShoppingListEditor: React.FC<ShoppingListEditorProps> = ({ list, categories, onSave, onBack }) => {
  const [localList, setLocalList] = useState<ShoppingList>(list);
  const [editingName, setEditingName] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);

  useEffect(() => {
    setLocalList(list);
  }, [list]);

  const handleUpdateList = (updated: ShoppingList) => {
    setLocalList(updated);
    onSave(updated);
  };

  const handleAddItem = (groupId: string) => {
    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: '新物品',
      price: 0,
      qty: 1,
      status: 'to_buy',
      categoryId: categories[0]?.id || '',
      groupId: groupId
    };
    handleUpdateList({ ...localList, items: [...localList.items, newItem] });
  };

  const handleUpdateItem = (itemId: string, updates: Partial<ShoppingItem>) => {
    const updatedItems = localList.items.map(i => i.id === itemId ? { ...i, ...updates } : i);
    handleUpdateList({ ...localList, items: updatedItems });
  };

  const handleDeleteItem = (itemId: string) => {
    if(window.confirm('確定要刪除此物品嗎？')) {
      const updatedItems = localList.items.filter(i => i.id !== itemId);
      handleUpdateList({ ...localList, items: updatedItems });
    }
  };

  const toggleStatus = (currentStatus: ShoppingItemStatus): ShoppingItemStatus => {
    if (currentStatus === 'to_buy') return 'bought';
    if (currentStatus === 'bought') return 'dropped';
    return 'to_buy';
  };

  const getStatusBadge = (status: ShoppingItemStatus) => {
    switch(status) {
      case 'to_buy': return <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-bold cursor-pointer hover:opacity-80">待購</span>;
      case 'bought': return <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-bold cursor-pointer hover:opacity-80">已購</span>;
      case 'dropped': return <span className="px-2 py-1 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded text-xs font-bold cursor-pointer hover:opacity-80 line-through">放棄</span>;
    }
  };

  const handleAddGroup = () => {
    const newGroup = { id: Math.random().toString(36).substring(2, 9), name: '新群組' };
    handleUpdateList({ ...localList, groups: [...localList.groups, newGroup] });
  };

  const handleUpdateGroup = (groupId: string, newName: string) => {
    const updatedGroups = localList.groups.map(g => g.id === groupId ? { ...g, name: newName } : g);
    handleUpdateList({ ...localList, groups: updatedGroups });
  };

  const handleDeleteGroup = (groupId: string) => {
    if(window.confirm('確定要刪除此群組及其所有物品嗎？')) {
      const updatedGroups = localList.groups.filter(g => g.id !== groupId);
      const updatedItems = localList.items.filter(i => i.groupId !== groupId);
      handleUpdateList({ ...localList, groups: updatedGroups, items: updatedItems });
    }
  };

  const totalSpent = localList.items.filter(i => i.status === 'bought').reduce((sum, i) => sum + (i.price * i.qty), 0);
  const totalEstimated = localList.items.filter(i => i.status !== 'dropped').reduce((sum, i) => sum + (i.price * i.qty), 0);
  const budget = localList.budget || 0;
  const percent = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0;
  const isOverBudget = budget > 0 && totalSpent > budget;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <button onClick={onBack} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white mb-4">
          <ArrowLeft size={20} className="mr-1" /> 回到列表
        </button>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div className="flex-1">
            {editingName ? (
              <input 
                autoFocus
                className="text-3xl font-bold bg-white dark:bg-slate-800 border border-blue-500 rounded px-2 py-1 w-full text-slate-900 dark:text-white"
                value={localList.name}
                onChange={e => setLocalList({...localList, name: e.target.value})}
                onBlur={() => { setEditingName(false); handleUpdateList(localList); }}
                onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              />
            ) : (
              <h1 
                className="text-3xl font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2"
                onClick={() => setEditingName(true)}
              >
                {localList.name} <Edit2 size={16} className="text-slate-300" />
              </h1>
            )}
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 min-w-[250px]">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-bold">預算上限</span>
              {editingBudget ? (
                <input 
                  autoFocus
                  type="number"
                  className="w-24 text-right border border-blue-500 rounded px-1 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  value={localList.budget || ''}
                  onChange={e => setLocalList({...localList, budget: Number(e.target.value)})}
                  onBlur={() => { setEditingBudget(false); handleUpdateList(localList); }}
                  onKeyDown={e => e.key === 'Enter' && setEditingBudget(false)}
                />
              ) : (
                <span 
                  className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:text-blue-500 flex items-center gap-1"
                  onClick={() => setEditingBudget(true)}
                >
                  ${budget.toLocaleString()} <Edit2 size={12} className="text-slate-300" />
                </span>
              )}
            </div>
            {budget > 0 && (
              <div className="space-y-1">
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">已花費: ${totalSpent.toLocaleString()}</span>
                  <span className={isOverBudget ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}>剩餘: ${(budget - totalSpent).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={handleAddGroup} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-medium transition-colors">
          <Plus size={16} /> 新增群組
        </button>
      </div>

      {/* Groups */}
      {localList.groups.map(group => {
        const groupItems = localList.items.filter(i => i.groupId === group.id);
        return (
          <div key={group.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-2 flex-1">
                <Layers size={18} className="text-emerald-500"/>
                <input 
                  className="font-bold text-slate-700 dark:text-slate-300 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1 py-0.5 w-1/2"
                  value={group.name}
                  onChange={e => handleUpdateGroup(group.id, e.target.value)}
                  placeholder="群組名稱"
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleAddItem(group.id)} className="text-sm flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  <Plus size={16} /> 新增物品
                </button>
                {localList.groups.length > 1 && (
                  <button onClick={() => handleDeleteGroup(group.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {groupItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">此群組尚無物品</div>
              ) : (
                groupItems.map(item => (
                  <div key={item.id} className={`p-4 flex flex-col md:flex-row gap-4 items-start md:items-center transition-colors ${item.status === 'dropped' ? 'opacity-50 bg-slate-50 dark:bg-slate-900/20' : ''}`}>
                    {/* Status Badge */}
                    <div onClick={() => handleUpdateItem(item.id, { status: toggleStatus(item.status) })} className="shrink-0 mt-1 md:mt-0">
                      {getStatusBadge(item.status)}
                    </div>
                    
                    {/* Main Info */}
                    <div className="flex-1 min-w-0 space-y-2 w-full">
                      <input 
                        className={`w-full font-bold text-lg bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 ${item.status === 'dropped' ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}
                        value={item.name}
                        onChange={e => handleUpdateItem(item.id, { name: e.target.value })}
                        placeholder="物品名稱..."
                      />
                      <div className="flex flex-wrap gap-2 items-center px-1">
                        <select 
                          className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none rounded px-2 py-1 focus:ring-0 cursor-pointer"
                          value={item.categoryId}
                          onChange={e => handleUpdateItem(item.id, { categoryId: e.target.value })}
                        >
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                          <LinkIcon size={12} />
                          <input 
                            className="bg-transparent border-none focus:outline-none w-24 md:w-32 placeholder-slate-400"
                            placeholder="來源 (如: Amazon)"
                            value={item.source || ''}
                            onChange={e => handleUpdateItem(item.id, { source: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Price & Qty */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-sm">$</span>
                        <input 
                          type="number"
                          className="w-20 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                          value={item.price || ''}
                          onChange={e => handleUpdateItem(item.id, { price: Number(e.target.value) })}
                          placeholder="單價"
                        />
                      </div>
                      <span className="text-slate-300 dark:text-slate-600">x</span>
                      <input 
                        type="number"
                        className="w-16 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                        value={item.qty || ''}
                        onChange={e => handleUpdateItem(item.id, { qty: Number(e.target.value) })}
                        placeholder="數量"
                      />
                      <div className="w-20 text-right font-bold text-slate-700 dark:text-slate-300">
                        ${(item.price * item.qty).toLocaleString()}
                      </div>
                      <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors ml-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};