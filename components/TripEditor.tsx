
import React, { useState } from 'react';
import { InventoryItem, Trip, TripItem, Category, InventoryFolder, InventoryGroup } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { Search, Plus, Trash2, ArrowLeft, Save, Briefcase, Filter } from 'lucide-react';

interface TripEditorProps {
  inventory: InventoryItem[];
  folders: InventoryFolder[];
  groups: InventoryGroup[];
  currentTrip: Trip | null;
  onSave: (trip: Trip) => void;
  onCancel: () => void;
}

export const TripEditor: React.FC<TripEditorProps> = ({ inventory, folders, groups, currentTrip, onSave, onCancel }) => {
  const [tripName, setTripName] = useState(currentTrip?.name || `出差行程 ${new Date().toLocaleDateString()}`);
  const [tripDate, setTripDate] = useState(currentTrip?.date || new Date().toISOString().split('T')[0]);
  const [tripItems, setTripItems] = useState<TripItem[]>(currentTrip?.items || []);
  
  // Inventory Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterFolder, setFilterFolder] = useState<string>('ALL');
  const [filterGroup, setFilterGroup] = useState<string>('ALL');

  const handleAddItem = (invItem: InventoryItem) => {
    const newItem: TripItem = {
      id: Math.random().toString(36).substring(2, 9),
      inventoryId: invItem.id,
      name: invItem.name,
      category: invItem.category,
      qty: 1,
      version: invItem.defaultVersion || '',
      checked: false
    };
    setTripItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (itemId: string) => {
    setTripItems(prev => prev.filter(i => i.id !== itemId));
  };

  const updateItem = (itemId: string, field: keyof TripItem, value: any) => {
    setTripItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = () => {
    if (!tripName.trim()) {
      alert("請輸入行程名稱");
      return;
    }
    if (tripItems.length === 0) {
      if(!window.confirm("目前清單是空的，確定要儲存嗎？")) return;
    }

    const updatedTrip: Trip = {
      id: currentTrip?.id || Math.random().toString(36).substring(2, 9),
      userId: currentTrip?.userId || 'unknown', // Handled by App.tsx
      name: tripName,
      date: tripDate,
      status: currentTrip?.status || 'planning',
      items: tripItems
    };
    onSave(updatedTrip);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
    const matchesFolder = filterFolder === 'ALL' || item.folderId === filterFolder;
    const matchesGroup = filterGroup === 'ALL' || item.groupId === filterGroup;
    return matchesSearch && matchesCategory && matchesFolder && matchesGroup;
  });

  // Get available groups based on selected folder
  const availableGroups = filterFolder === 'ALL' 
    ? groups 
    : groups.filter(g => g.folderId === filterFolder);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider">行程名稱</label>
            <input 
              type="text" 
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="text-xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none w-full"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input 
            type="date"
            value={tripDate}
            onChange={(e) => setTripDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-transform active:scale-95"
          >
            <Save size={18} />
            <span>儲存行程</span>
          </button>
        </div>
      </div>

      {/* Main Content: Split View */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        
        {/* Left: Inventory Source */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="text-slate-500" size={20} />
                <h3 className="font-bold text-slate-700">物品庫 (點擊加入)</h3>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="搜尋..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <select 
                value={filterFolder}
                onChange={(e) => {
                    setFilterFolder(e.target.value);
                    setFilterGroup('ALL'); // Reset group when folder changes
                }}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-sm text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">📁 所有資料夾</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>

              <select 
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-sm text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none max-w-[150px]"
              >
                <option value="ALL">🗃️ 所有群組</option>
                {availableGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button 
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCategory === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                全部
              </button>
              {Object.values(Category).map(cat => (
                <button 
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCategory === cat ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  {cat.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-3 content-start">
            {filteredInventory.map(item => (
              <button
                key={item.id}
                onClick={() => handleAddItem(item)}
                className="group flex flex-col items-start p-3 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all text-left bg-white shadow-sm"
              >
                <div className="flex justify-between w-full mb-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[item.category]}`}>
                    {item.category.split(' ')[0]}
                  </span>
                  <Plus size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="font-medium text-slate-800 text-sm">{item.name}</span>
                {item.defaultVersion && <span className="text-xs text-slate-400 mt-1">預設: {item.defaultVersion}</span>}
              </button>
            ))}
            {filteredInventory.length === 0 && (
              <div className="col-span-full text-center text-slate-400 text-sm py-8">
                找不到物品，請檢查搜尋條件
              </div>
            )}
          </div>
        </div>

        {/* Right: Trip Items */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{tripItems.length}</div>
              <h3 className="font-bold text-slate-700">本次攜帶清單</h3>
            </div>
            <button 
              onClick={() => setTripItems([])}
              className="text-xs text-red-500 hover:text-red-700 hover:underline"
            >
              全部清空
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tripItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <Briefcase size={48} className="mb-4 opacity-50" />
                <p>左側點擊物品加入清單</p>
              </div>
            ) : (
              tripItems.map((item) => (
                <div key={item.id} className="flex gap-3 items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[item.category]} whitespace-nowrap`}>
                        {item.category.split(' ')[0]}
                      </span>
                      <span className="font-bold text-slate-800 truncate">{item.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.version}
                          onChange={(e) => updateItem(item.id, 'version', e.target.value)}
                          placeholder="版本/備註..."
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                       <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                        className="w-12 text-center bg-white border-x border-slate-200 py-1 text-slate-900 font-bold outline-none"
                      />
                      <span className="text-xs text-slate-400 px-1">Qty</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-300 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
