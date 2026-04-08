import React, { useState, useEffect } from 'react';
import { ShoppingList, ShoppingItem, ShoppingCategory, ShoppingItemStatus } from '../types';
import { ArrowLeft, Plus, Trash2, Edit2, Check, DollarSign, Tag, Link as LinkIcon, Layers, PieChart, Users, X } from 'lucide-react';
import { DEFAULT_SHOPPING_GROUP_ID } from '../constants';
import { cloudSync, cloudAuth } from '../firebaseConfig';

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
  
  const [showSummary, setShowSummary] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUsername, setShareUsername] = useState('');
  const [sharedUsersList, setSharedUsersList] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    setLocalList(list);
  }, [list]);

  // Load shared users names when sharing modal opens
  useEffect(() => {
      if (isSharing && localList.sharedWith && localList.sharedWith.length > 0) {
          const loadNames = async () => {
              const list = [];
              for (const uid of localList.sharedWith!) {
                  const res = await cloudAuth.findUsernameById(uid);
                  list.push({ id: uid, name: res.success ? res.username : 'Unknown' });
              }
              setSharedUsersList(list);
          };
          loadNames();
      } else {
          setSharedUsersList([]);
      }
  }, [isSharing, localList.sharedWith]);

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

  const handleShareList = async () => {
      if (!shareUsername.trim()) return;
      if (window.confirm(`確定要將清單分享給「${shareUsername}」嗎？\n(若此清單尚未上傳，系統將會先進行自動上傳)`)) {
          
          let result = await cloudSync.shareShoppingList(localList.id, shareUsername);
          
          if (!result.success && result.error?.includes("No document to update")) {
              alert("⚠️ 此清單尚未同步到雲端。\n請先點擊右上角的「雲端上傳」按鈕備份後，再嘗試分享。");
              return;
          }

          if (result.success && result.userId) {
              alert('✅ 分享成功！');
              const updatedList = { ...localList, sharedWith: [...(localList.sharedWith || []), result.userId] };
              handleUpdateList(updatedList);
              setShareUsername('');
          } else {
              alert('❌ 分享失敗：' + result.error);
          }
      }
  };

  const handleUnshareList = async (userId: string, username: string) => {
      if(window.confirm(`確定要取消對「${username}」的分享嗎？`)) {
          const result = await cloudSync.unshareShoppingList(localList.id, userId);
          if(result.success) {
              alert('✅ 已取消分享');
              const updatedList = { ...localList, sharedWith: localList.sharedWith?.filter(id => id !== userId) };
              handleUpdateList(updatedList);
          } else {
              alert('❌ 取消失敗');
          }
      }
  };

  const generateSummary = () => {
      const summary: { categoryId: string, spent: number, estimated: number, items: ShoppingItem[] }[] = [];
      const itemsByCategory: Record<string, ShoppingItem[]> = {};
      localList.items.forEach(item => { if(!itemsByCategory[item.categoryId]) itemsByCategory[item.categoryId] = []; itemsByCategory[item.categoryId].push(item); });
      
      Object.keys(itemsByCategory).forEach(catId => {
          const items = itemsByCategory[catId];
          const spent = items.filter(i => i.status === 'bought').reduce((sum, i) => sum + (i.price * i.qty), 0);
          const estimated = items.filter(i => i.status !== 'dropped').reduce((sum, i) => sum + (i.price * i.qty), 0);
          summary.push({ categoryId: catId, spent, estimated, items });
      });
      return summary;
  };

  const totalSpent = localList.items.filter(i => i.status === 'bought').reduce((sum, i) => sum + (i.price * i.qty), 0);
  const totalEstimated = localList.items.filter(i => i.status !== 'dropped').reduce((sum, i) => sum + (i.price * i.qty), 0);
  const budget = localList.budget || 0;
  const percent = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0;
  const isOverBudget = budget > 0 && totalSpent > budget;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Summary Modal */}
      {showSummary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700">
                  <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
                      <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800 dark:text-white"><PieChart className="text-emerald-600" /> 採購統計總表</h3>
                      <button onClick={() => setShowSummary(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={24} className="text-slate-500" /></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">總花費</div>
                              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${totalSpent.toLocaleString()}</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">總預估</div>
                              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">${totalEstimated.toLocaleString()}</div>
                          </div>
                      </div>
                      
                      {generateSummary().map(catGroup => {
                          const catInfo = categories.find(c => c.id === catGroup.categoryId) || { name: '未知分類', color: 'bg-slate-50 text-slate-700 border-slate-200' };
                          return (
                              <div key={catGroup.categoryId} className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                  {(() => {
                                      const isCustom = catInfo.color.startsWith('#');
                                      const headerClass = isCustom 
                                          ? "px-4 py-2 font-bold text-sm flex justify-between items-center border-b dark:border-slate-700" 
                                          : `px-4 py-2 font-bold text-sm flex justify-between items-center border-b dark:border-slate-700 ${catInfo.color.replace('text-', 'bg-opacity-10 bg-').split(' ')[0]} ${catInfo.color.split(' ')[1]}`;
                                      const headerStyle = isCustom 
                                          ? { backgroundColor: `${catInfo.color}20`, color: catInfo.color, borderColor: `${catInfo.color}40` } 
                                          : {};
                                      return (
                                          <div className={headerClass} style={headerStyle}>
                                              <span>{catInfo.name}</span>
                                              <span>${catGroup.spent.toLocaleString()} / ${catGroup.estimated.toLocaleString()}</span>
                                          </div>
                                      );
                                  })()}
                                  <div className="divide-y divide-slate-50 dark:divide-slate-700">
                                      {catGroup.items.map((item, idx) => (
                                          <div key={idx} className="p-3 bg-white dark:bg-slate-800 flex justify-between items-center">
                                              <div className="flex items-center gap-2">
                                                  {getStatusBadge(item.status)}
                                                  <span className={`font-medium ${item.status === 'dropped' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{item.name}</span>
                                              </div>
                                              <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                                  ${(item.price * item.qty).toLocaleString()}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          );
                      })}
                      {localList.items.length === 0 && <p className="text-center text-slate-400 py-8">目前沒有物品可供統計</p>}
                  </div>
                  <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center rounded-b-xl">
                      <button onClick={() => setShowSummary(false)} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm">關閉</button>
                  </div>
              </div>
          </div>
      )}

      {/* Share Modal */}
      {isSharing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700">
                  <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white"><Users className="text-emerald-600" /> 分享設定</h3>
                      <button onClick={() => setIsSharing(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase">新增分享對象</label>
                          <div className="flex gap-2">
                              <input autoFocus className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="輸入對方帳號..." value={shareUsername} onChange={e => setShareUsername(e.target.value)} />
                              <button onClick={handleShareList} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm whitespace-nowrap">加入</button>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase">已分享給</label>
                          {sharedUsersList.length === 0 ? (
                              <p className="text-sm text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-center">目前沒有分享給任何人</p>
                          ) : (
                              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                                  {sharedUsersList.map(u => (
                                      <div key={u.id} className="flex items-center justify-between p-3">
                                          <div className="flex items-center gap-2">
                                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">{u.name.substring(0,2).toUpperCase()}</div>
                                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{u.name}</span>
                                          </div>
                                          <button onClick={() => handleUnshareList(u.id, u.name)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="取消分享">
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
            <ArrowLeft size={20} className="mr-1" /> 回到列表
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSharing(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium shadow-sm transition-all" title="分享設定"><Users size={16} /><span className="hidden sm:inline">分享</span></button>
            <button onClick={() => setShowSummary(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-medium shadow-sm transition-all" title="查看統計總表"><PieChart size={16} /><span className="hidden sm:inline">統計</span></button>
          </div>
        </div>
        
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
                {localList.name} 
                {localList.sharedWith && localList.sharedWith.length > 0 && <Users size={20} className="text-purple-500" title="此為共用清單"/>}
                <Edit2 size={16} className="text-slate-300" />
              </h1>
            )}
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 min-w-[250px]">
            <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="text-slate-500 dark:text-slate-400 font-bold">目前總金額</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                ${totalEstimated.toLocaleString()}
              </span>
            </div>
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
                        {(() => {
                          const catInfo = categories.find(c => c.id === item.categoryId) || categories[0];
                          const isCustom = catInfo?.color?.startsWith('#');
                          const selectClass = isCustom ? "text-xs rounded px-2 py-1 border border-slate-200 dark:border-slate-700 focus:ring-0 cursor-pointer" : `text-xs rounded px-2 py-1 border-none focus:ring-0 cursor-pointer ${catInfo?.color || 'bg-slate-100 text-slate-600'}`;
                          const selectStyle = isCustom ? { backgroundColor: `${catInfo.color}20`, color: catInfo.color } : {};
                          
                          return (
                            <select 
                              className={selectClass}
                              style={selectStyle}
                              value={item.categoryId}
                              onChange={e => handleUpdateItem(item.id, { categoryId: e.target.value })}
                            >
                              {categories.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">{c.name}</option>)}
                            </select>
                          );
                        })()}
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
