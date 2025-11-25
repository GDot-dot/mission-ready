import React, { useState } from 'react';
import { InventoryItem, InventoryFolder, Category } from '../types';
import { CATEGORY_COLORS, DEFAULT_FOLDER_ID } from '../constants';
import { Plus, Trash2, Search, X, Folder, FolderPlus, Settings } from 'lucide-react';

interface InventoryProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  folders: InventoryFolder[];
  setFolders: React.Dispatch<React.SetStateAction<InventoryFolder[]>>;
}

export const Inventory: React.FC<InventoryProps> = ({ items, setItems, folders, setFolders }) => {
  const [activeFolderId, setActiveFolderId] = useState<string>(folders[0]?.id || DEFAULT_FOLDER_ID);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  
  // New Item State
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<Category>(Category.Tools);
  const [newItemDefault, setNewItemDefault] = useState('');

  // New Folder State
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleDeleteItem = (id: string) => {
    if (window.confirm('確定要從物品庫永久刪除此項目嗎？')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      folderId: activeFolderId,
      name: newItemName,
      category: newItemCategory,
      defaultVersion: newItemDefault
    };
    setItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemDefault('');
    setIsAdding(false);
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: InventoryFolder = {
      id: Math.random().toString(36).substring(2, 9),
      name: newFolderName,
      isSystem: false
    };
    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
    setIsAddingFolder(false);
    setActiveFolderId(newFolder.id);
  };

  const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    if (window.confirm('確定要刪除此資料夾嗎？裡面的物品也會被標記為預設資料夾。')) {
      setItems(prev => prev.map(item => item.folderId === folderId ? { ...item, folderId: DEFAULT_FOLDER_ID } : item));
      setFolders(prev => prev.filter(f => f.id !== folderId));
      if (activeFolderId === folderId) setActiveFolderId(DEFAULT_FOLDER_ID);
    }
  };

  const filteredItems = items.filter(item => {
    // Only show items in current folder
    if (item.folderId !== activeFolderId) return false;
    
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const activeFolderName = folders.find(f => f.id === activeFolderId)?.name || '未知資料夾';

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
      
      {/* Sidebar - Folders */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <Folder size={18} />
              物品分類庫
            </h2>
            <button 
              onClick={() => setIsAddingFolder(true)}
              className="p-1 hover:bg-slate-100 rounded text-blue-600"
              title="新增資料夾"
            >
              <FolderPlus size={18} />
            </button>
          </div>

          {isAddingFolder && (
            <div className="mb-4 bg-blue-50 p-2 rounded-lg border border-blue-100">
              <input 
                autoFocus
                type="text"
                placeholder="輸入資料夾名稱..."
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFolder()}
                className="w-full text-sm p-1.5 border border-blue-200 rounded mb-2 outline-none"
              />
              <div className="flex gap-2">
                <button onClick={handleAddFolder} className="flex-1 bg-blue-600 text-white text-xs py-1 rounded">建立</button>
                <button onClick={() => setIsAddingFolder(false)} className="flex-1 bg-white text-slate-500 text-xs py-1 rounded border">取消</button>
              </div>
            </div>
          )}

          <div className="space-y-1 max-h-[300px] lg:max-h-none overflow-y-auto">
            {folders.map(folder => (
              <div 
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${activeFolderId === folder.id ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'hover:bg-slate-50 border-transparent text-slate-600'}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder size={16} className={activeFolderId === folder.id ? 'fill-blue-200' : ''} />
                  <span className="text-sm font-medium truncate">{folder.name}</span>
                </div>
                {!folder.isSystem && (
                  <button 
                    onClick={(e) => handleDeleteFolder(e, folder.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Items */}
      <div className="flex-1 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{activeFolderName}</h2>
            <p className="text-slate-500 text-sm">{filteredItems.length} 個物品</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-md text-sm"
          >
            <Plus size={16} />
            <span>新增此類物品</span>
          </button>
        </div>

        {/* Add New Item Panel */}
        {isAdding && (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl shadow-inner animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-blue-900 flex items-center gap-2">
                <Plus size={18} />
                新增物品至「{activeFolderName}」
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-blue-500 hover:text-blue-700">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-blue-900 mb-1">物品名稱</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="例如: ST-Link"
                  className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-blue-900 mb-1">技術分類</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as Category)}
                  className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat.split(' ')[0]}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-blue-900 mb-1">預設備註/版本</label>
                <input
                  type="text"
                  value={newItemDefault}
                  onChange={(e) => setNewItemDefault(e.target.value)}
                  placeholder="例如: V1.6"
                  className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <button
                  onClick={handleAddItem}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                >
                  儲存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="搜尋此資料夾內的物品..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 outline-none shadow-sm"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-slate-400 outline-none shadow-sm cursor-pointer"
          >
            <option value="ALL">所有技術分類</option>
            {Object.values(Category).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs px-2 py-1 rounded-full border ${CATEGORY_COLORS[item.category]}`}>
                  {item.category.split(' ')[0]}
                </span>
                <button 
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
              {item.defaultVersion && (
                <p className="text-sm text-slate-500 mt-1">
                  預設: <span className="bg-slate-100 px-1 rounded text-slate-700">{item.defaultVersion}</span>
                </p>
              )}
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              {searchTerm || filterCategory !== 'ALL' ? '沒有找到符合搜尋的物品' : '此資料夾是空的，請新增物品'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};