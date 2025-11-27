import React, { useState, useEffect } from 'react';
import { InventoryItem, InventoryFolder, InventoryGroup, InventoryCategory, InventoryBundle, BundleItem } from '../types';
import { CATEGORY_PALETTE, DEFAULT_FOLDER_ID, DEFAULT_GROUP_ID } from '../constants';
import { Plus, Trash2, Search, X, Folder, FolderPlus, LayoutGrid, Tag, Edit2, Package, PackagePlus, CheckSquare, Square, Save, Archive } from 'lucide-react';

interface InventoryProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  folders: InventoryFolder[];
  setFolders: React.Dispatch<React.SetStateAction<InventoryFolder[]>>;
  groups: InventoryGroup[];
  setGroups: React.Dispatch<React.SetStateAction<InventoryGroup[]>>;
  categories: InventoryCategory[];
  setCategories: React.Dispatch<React.SetStateAction<InventoryCategory[]>>;
  bundles: InventoryBundle[];
  setBundles: React.Dispatch<React.SetStateAction<InventoryBundle[]>>;
}

export const Inventory: React.FC<InventoryProps> = ({ items, setItems, folders, setFolders, groups, setGroups, categories, setCategories, bundles, setBundles }) => {
  const [viewMode, setViewMode] = useState<'ITEMS' | 'BUNDLES'>('ITEMS');
  const [activeFolderId, setActiveFolderId] = useState<string>(folders[0]?.id || DEFAULT_FOLDER_ID);
  const [activeGroupId, setActiveGroupId] = useState<string>('ALL');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>(categories[0]?.id || '');
  const [newItemDefault, setNewItemDefault] = useState('');

  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryFormName, setCategoryFormName] = useState('');
  const [categoryFormColor, setCategoryFormColor] = useState(CATEGORY_PALETTE[0].class);

  // Bundle State - Now inline
  const [activeBundleId, setActiveBundleId] = useState<string | null>(null); // null = creating new or none selected
  const [isEditingBundleMode, setIsEditingBundleMode] = useState(false); // True if right panel is showing bundle editor
  const [bundleFormName, setBundleFormName] = useState('');
  const [bundleFormItems, setBundleFormItems] = useState<BundleItem[]>([]);

  useEffect(() => { setActiveGroupId('ALL'); }, [activeFolderId]);
  useEffect(() => { if (!newItemCategory && categories.length > 0) { setNewItemCategory(categories[0].id); } }, [categories, newItemCategory]);

  const activeFolderName = folders.find(f => f.id === activeFolderId)?.name || '未知資料夾';
  const folderGroups = groups.filter(g => g.folderId === activeFolderId);
  const defaultGroupForFolder = folderGroups.find(g => g.isSystem)?.id || (folderGroups.length > 0 ? folderGroups[0].id : DEFAULT_GROUP_ID);

  // Handlers
  const handleDeleteItem = (id: string) => { if (window.confirm('確定要從物品庫永久刪除此項目嗎？')) setItems(prev => prev.filter(item => item.id !== id)); };
  const handleAddItem = () => { if (!newItemName.trim()) return; setItems(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), folderId: activeFolderId, groupId: activeGroupId === 'ALL' ? defaultGroupForFolder : activeGroupId, name: newItemName, category: newItemCategory, defaultVersion: newItemDefault }]); setNewItemName(''); setNewItemDefault(''); setIsAdding(false); };
  const handleAddFolder = () => { if (!newFolderName.trim()) return; const newId = Math.random().toString(36).substring(2, 9); setFolders(prev => [...prev, { id: newId, name: newFolderName, isSystem: false }]); setGroups(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), folderId: newId, name: '通用清單', isSystem: true }]); setNewFolderName(''); setIsAddingFolder(false); setActiveFolderId(newId); };
  const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => { e.stopPropagation(); if (window.confirm('確定要刪除此資料夾嗎？')) { setItems(prev => prev.map(item => item.folderId === folderId ? { ...item, folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID } : item)); setGroups(prev => prev.filter(g => g.folderId !== folderId)); setFolders(prev => prev.filter(f => f.id !== folderId)); if (activeFolderId === folderId) setActiveFolderId(DEFAULT_FOLDER_ID); } };
  const handleAddGroup = () => { if(!newGroupName.trim()) return; const newGroup = { id: Math.random().toString(36).substring(2, 9), folderId: activeFolderId, name: newGroupName, isSystem: false }; setGroups(prev => [...prev, newGroup]); setNewGroupName(''); setIsAddingGroup(false); setActiveGroupId(newGroup.id); };
  const handleDeleteGroup = (e: React.MouseEvent, groupId: string) => { e.stopPropagation(); if(window.confirm('確定要刪除此群組嗎？')) { setItems(prev => prev.map(item => item.groupId === groupId ? { ...item, groupId: defaultGroupForFolder } : item)); setGroups(prev => prev.filter(g => g.id !== groupId)); if(activeGroupId === groupId) setActiveGroupId('ALL'); } };
  const handleAddCategory = () => { if (!categoryFormName.trim()) return; setCategories(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), name: categoryFormName, color: categoryFormColor }]); setCategoryFormName(''); setIsAddingCategory(false); };
  const handleUpdateCategory = () => { if (!categoryFormName.trim() || !editingCategoryId) return; setCategories(prev => prev.map(c => c.id === editingCategoryId ? { ...c, name: categoryFormName, color: categoryFormColor } : c)); setEditingCategoryId(null); setCategoryFormName(''); };
  const handleDeleteCategory = (id: string) => { if (window.confirm("刪除此分類後，原本屬於此分類的物品將會顯示為未知。確定嗎？")) setCategories(prev => prev.filter(c => c.id !== id)); };

  // Bundle Logic
  const initNewBundle = () => {
      setIsEditingBundleMode(true);
      setActiveBundleId(null);
      setBundleFormName('');
      setBundleFormItems([]);
  };

  const loadBundleForEdit = (bundle: InventoryBundle) => {
      setIsEditingBundleMode(true);
      setActiveBundleId(bundle.id);
      setBundleFormName(bundle.name);
      setBundleFormItems([...bundle.items]);
  };

  const handleSaveBundle = () => {
      if(!bundleFormName.trim()) { alert("請輸入組合包名稱"); return; }
      const newBundle: InventoryBundle = {
          id: activeBundleId || Math.random().toString(36).substring(2, 9),
          name: bundleFormName,
          items: bundleFormItems
      };
      if (activeBundleId) setBundles(prev => prev.map(b => b.id === activeBundleId ? newBundle : b));
      else setBundles(prev => [...prev, newBundle]);
      
      setIsEditingBundleMode(false);
      setActiveBundleId(null);
  };

  const handleDeleteBundle = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm("確定要刪除此組合包嗎？")) setBundles(prev => prev.filter(b => b.id !== id));
      if(activeBundleId === id) setIsEditingBundleMode(false);
  };

  const toggleItemInBundle = (itemId: string) => {
      setBundleFormItems(prev => {
          const exists = prev.find(i => i.inventoryId === itemId);
          if (exists) return prev.filter(i => i.inventoryId !== itemId);
          return [...prev, { inventoryId: itemId, qty: 1 }];
      });
  };

  const updateBundleItemQty = (itemId: string, qty: number) => {
      setBundleFormItems(prev => prev.map(i => i.inventoryId === itemId ? { ...i, qty } : i));
  };

  const filteredItems = items.filter(item => {
    // In bundle mode, show everything flat list style for easier selection, respecting search and category
    if (viewMode === 'BUNDLES' && isEditingBundleMode) {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    }
    // Normal Item View
    if (item.folderId !== activeFolderId) return false;
    if (activeGroupId !== 'ALL' && item.groupId !== activeGroupId) return false;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort Items by Category
  filteredItems.sort((a, b) => a.category.localeCompare(b.category));

  const getCategoryInfo = (catId: string) => categories.find(c => c.id === catId) || { name: '未知', color: 'bg-gray-100 text-gray-600 border-gray-200' };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
      {/* Modals (Category only now) */}
      {isManagingCategories && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white"><Tag size={20} /> 分類管理</h3>
                    <button onClick={() => setIsManagingCategories(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"><X size={20} /></button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {(isAddingCategory || editingCategoryId) && (
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400">{editingCategoryId ? '編輯分類' : '新增分類'}</h4>
                            <div className="flex gap-2"><input autoFocus className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded px-2 py-1 text-sm outline-none focus:border-blue-500" placeholder="分類名稱" value={categoryFormName} onChange={e => setCategoryFormName(e.target.value)} /></div>
                            <div><label className="text-xs text-slate-400 block mb-1">選擇顏色</label><div className="flex flex-wrap gap-2">{CATEGORY_PALETTE.map((color, idx) => (<button key={idx} onClick={() => setCategoryFormColor(color.class)} className={`w-6 h-6 rounded-full border ${color.class.replace('bg-', 'bg-').replace('text-', 'text-').split(' ')[0]} ${categoryFormColor === color.class ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`} title={color.name} />))}</div><div className={`mt-2 text-xs px-2 py-1 rounded border w-fit ${categoryFormColor}`}>預覽樣式</div></div>
                            <div className="flex gap-2 pt-2"><button onClick={editingCategoryId ? handleUpdateCategory : handleAddCategory} className="flex-1 bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700">{editingCategoryId ? '更新' : '建立'}</button><button onClick={() => { setIsAddingCategory(false); setEditingCategoryId(null); setCategoryFormName(''); }} className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 py-1 rounded text-sm hover:bg-slate-50 dark:hover:bg-slate-600">取消</button></div>
                        </div>
                    )}
                    {!isAddingCategory && !editingCategoryId && <button onClick={() => { setIsAddingCategory(true); setCategoryFormName(''); setCategoryFormColor(CATEGORY_PALETTE[0].class); }} className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center justify-center gap-1 text-sm"><Plus size={16} /> 新增分類</button>}
                    <div className="space-y-2">{categories.map(cat => (<div key={cat.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm group"><div className="flex items-center gap-3"><span className={`w-4 h-4 rounded-full ${cat.color.split(' ')[0].replace('text-', 'bg-').replace('border-', '')} border opacity-50`}></span><span className={`text-sm px-2 py-0.5 rounded border ${cat.color}`}>{cat.name}</span></div><div className="flex gap-1"><button onClick={() => { setEditingCategoryId(cat.id); setCategoryFormName(cat.name); setCategoryFormColor(cat.color); setIsAddingCategory(false); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded"><Edit2 size={16} /></button><button onClick={() => handleDeleteCategory(cat.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded"><Trash2 size={16} /></button></div></div>))}</div>
                </div>
            </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full min-h-[500px]">
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg mb-4 shrink-0">
                <button onClick={() => setViewMode('ITEMS')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'ITEMS' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>物品清單</button>
                <button onClick={() => { setViewMode('BUNDLES'); setIsEditingBundleMode(false); }} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'BUNDLES' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>📦 組合包</button>
            </div>

            {viewMode === 'ITEMS' ? (
                <>
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h2 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Folder size={18} />資料夾</h2>
                        <button onClick={() => setIsAddingFolder(true)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-blue-600 dark:text-blue-400" title="新增資料夾"><FolderPlus size={18} /></button>
                    </div>
                    {isAddingFolder && (
                        <div className="mb-4 bg-blue-50 dark:bg-slate-700 p-2 rounded-lg border border-blue-100 dark:border-slate-600 shrink-0">
                        <input autoFocus type="text" placeholder="資料夾名稱..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFolder()} className="w-full text-sm p-1.5 border border-blue-200 dark:border-slate-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded mb-2 outline-none" />
                        <div className="flex gap-2"><button onClick={handleAddFolder} className="flex-1 bg-blue-600 text-white text-xs py-1 rounded">建立</button><button onClick={() => setIsAddingFolder(false)} className="flex-1 bg-white dark:bg-slate-600 text-slate-500 dark:text-slate-200 text-xs py-1 rounded border dark:border-slate-500">取消</button></div>
                        </div>
                    )}
                    <div className="space-y-1 overflow-y-auto flex-1">
                        {folders.map(folder => (
                        <div key={folder.id} onClick={() => setActiveFolderId(folder.id)} className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${activeFolderId === folder.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-transparent text-slate-600 dark:text-slate-400'}`}>
                            <div className="flex items-center gap-2 truncate"><Folder size={16} className={activeFolderId === folder.id ? 'fill-blue-200 dark:fill-blue-900' : ''} /><span className="text-sm font-medium truncate">{folder.name}</span></div>
                            {!folder.isSystem && <button onClick={(e) => handleDeleteFolder(e, folder.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1"><Trash2 size={14} /></button>}
                        </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <button onClick={initNewBundle} className="w-full mb-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 shrink-0"><PackagePlus size={16} /> 新增組合包</button>
                    <p className="text-xs text-slate-400 mb-2 shrink-0">已建立的組合包：</p>
                    <div className="space-y-2 overflow-y-auto flex-1">
                        {bundles.map(bundle => (
                            <div key={bundle.id} onClick={() => loadBundleForEdit(bundle)} className={`group p-3 rounded-lg border cursor-pointer transition-all ${activeBundleId === bundle.id && isEditingBundleMode ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-300 dark:ring-blue-700' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className={`font-bold ${activeBundleId === bundle.id && isEditingBundleMode ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>{bundle.name}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{bundle.items.length} 個物品</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={(e) => handleDeleteBundle(e, bundle.id)} className="p-1 text-slate-400 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
        
        {/* 1. BUNDLE EDITOR MODE */}
        {viewMode === 'BUNDLES' ? (
            isEditingBundleMode ? (
                <div className="flex flex-col h-full animate-in fade-in">
                    {/* Editor Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-3 flex-1">
                            <Package size={24} className="text-blue-600 dark:text-blue-400" />
                            <div className="flex-1">
                                <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">組合包名稱</label>
                                <input className="w-full bg-transparent text-xl font-bold text-slate-800 dark:text-white border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none" placeholder="輸入名稱..." value={bundleFormName} onChange={e => setBundleFormName(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditingBundleMode(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg">取消</button>
                            <button onClick={handleSaveBundle} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm"><Save size={18} /> 儲存</button>
                        </div>
                    </div>

                    {/* Search & Filter Bar (Reused) */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-2 items-center bg-white dark:bg-slate-800">
                        <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="搜尋物品以加入..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" /></div>
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"><option value="ALL">所有分類</option>{categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select>
                    </div>

                    {/* Inventory Grid for Selection */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/20">
                        <p className="text-sm text-slate-500 mb-4 flex items-center gap-2"><CheckSquare size={16}/> 勾選物品即可加入組合包，並可直接修改數量。</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {filteredItems.map(item => {
                                const inBundle = bundleFormItems.find(bi => bi.inventoryId === item.id);
                                const cat = getCategoryInfo(item.category);
                                return (
                                    <div key={item.id} onClick={() => toggleItemInBundle(item.id)} className={`relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${inBundle ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500 ring-1 ring-blue-400 dark:ring-blue-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cat.color}`}>{cat.name}</span>
                                            {inBundle ? <CheckSquare className="text-blue-600 dark:text-blue-400" size={20} /> : <Square className="text-slate-300 dark:text-slate-600" size={20} />}
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{item.name}</h4>
                                        {inBundle && (
                                            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                                                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">數量:</span>
                                                <input type="number" min="1" value={inBundle.qty} onChange={e => updateBundleItemQty(item.id, parseInt(e.target.value)||1)} className="w-16 text-center text-sm font-bold bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-100 rounded py-1 outline-none focus:ring-2 focus:ring-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Archive size={64} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">管理您的常用組合包</p>
                    <p className="text-sm opacity-70 mb-6">請從左側選擇一個組合包進行編輯，或是建立新的。</p>
                    <button onClick={initNewBundle} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">建立新組合包</button>
                </div>
            )
        ) : (
            // 2. ITEM MANAGEMENT MODE (Original View)
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{activeFolderName}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{filteredItems.length} 個物品</p>
                        </div>
                        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-md text-sm"><Plus size={16} /><span>新增此類物品</span></button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                        <div className="flex items-center gap-2 mb-2"><LayoutGrid size={14} className="text-slate-400"/><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">群組分類</span></div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setActiveGroupId('ALL')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeGroupId === 'ALL' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}>全部顯示</button>
                            {folderGroups.map(group => (
                                <div key={group.id} className={`group flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-lg border transition-all ${activeGroupId === group.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-200 dark:hover:border-blue-700'}`} onClick={() => setActiveGroupId(group.id)}>
                                    <span className="text-sm font-medium cursor-pointer">{group.name}</span>
                                    {!group.isSystem && <button onClick={(e) => handleDeleteGroup(e, group.id)} className="ml-1 p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>}
                                </div>
                            ))}
                            {isAddingGroup ? (
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600 animate-in fade-in"><input autoFocus className="w-24 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 outline-none focus:border-blue-300" placeholder="群組名稱" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddGroup()} /><button onClick={handleAddGroup} className="bg-blue-500 text-white p-0.5 rounded hover:bg-blue-600"><Plus size={14}/></button><button onClick={() => setIsAddingGroup(false)} className="text-slate-400 hover:text-slate-600 p-0.5"><X size={14}/></button></div>
                            ) : (
                                <button onClick={() => setIsAddingGroup(true)} className="px-2 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1 text-sm"><Plus size={14} />新增群組</button>
                            )}
                        </div>
                    </div>
                </div>

                {isAdding && (
                <div className="bg-blue-50 dark:bg-slate-700/50 border-b border-blue-200 dark:border-slate-600 p-6 shadow-inner animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2"><Plus size={18} />新增物品至「{activeFolderName}」{activeGroupId !== 'ALL' && <span className="text-blue-600 dark:text-blue-300 text-sm bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full shadow-sm">{folderGroups.find(g => g.id === activeGroupId)?.name}</span>}</h3>
                    <button onClick={() => setIsAdding(false)} className="text-blue-500 hover:text-blue-700"><X size={20} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                        <label className="block text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">物品名稱</label>
                        <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="例如: ST-Link" className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">技術分類</label>
                        <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                        {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">預設備註/版本</label>
                        <input type="text" value={newItemDefault} onChange={(e) => setNewItemDefault(e.target.value)} placeholder="例如: V1.6" className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="md:col-span-2 flex items-end"><button onClick={handleAddItem} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm">儲存</button></div>
                    </div>
                </div>
                )}

                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="搜尋此資料夾內的物品..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-400 outline-none shadow-sm" /></div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-400 outline-none shadow-sm cursor-pointer flex-1 md:flex-none">
                            <option value="ALL">所有技術分類</option>{categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                        </select>
                        <button onClick={() => setIsManagingCategories(true)} className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap" title="管理分類"><Tag size={18} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredItems.map(item => {
                        const itemGroupName = folderGroups.find(g => g.id === item.groupId)?.name || '未知';
                        const category = categories.find(c => c.id === item.category);
                        const categoryColor = category?.color || 'bg-gray-100 text-gray-600 border-gray-200';
                        const categoryName = category?.name || '未知分類';
                        return (
                        <div key={item.id} className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full border ${categoryColor}`}>{categoryName}</span>
                                <span className="text-xs px-2 py-1 rounded-full border border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{itemGroupName}</span>
                            </div>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">{item.name}</h3>
                            {item.defaultVersion && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">預設: <span className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-slate-700 dark:text-slate-300">{item.defaultVersion}</span></p>}
                        </div>
                        );
                    })}
                    {filteredItems.length === 0 && <div className="col-span-full text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">{searchTerm || filterCategory !== 'ALL' || activeGroupId !== 'ALL' ? '沒有找到符合搜尋的物品' : '此位置是空的，請新增物品'}</div>}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};