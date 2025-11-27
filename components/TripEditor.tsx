import React, { useState } from 'react';
import { InventoryItem, Trip, TripItem, InventoryFolder, InventoryGroup, TripGroup, InventoryCategory } from '../types';
import { DEFAULT_TRIP_GROUP_ID } from '../constants';
import { Search, Plus, Trash2, ArrowLeft, Save, Briefcase, X, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TripEditorProps {
  inventory: InventoryItem[];
  folders: InventoryFolder[];
  groups: InventoryGroup[];
  categories: InventoryCategory[];
  currentTrip: Trip | null;
  onSave: (trip: Trip) => void;
  onCancel: () => void;
}

const SortableTripItem = ({ item, info, updateItem, handleRemoveItem }: { item: TripItem, info: any, updateItem: any, handleRemoveItem: any }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.5 : 1, touchAction: 'none' };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-3 items-start bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div {...attributes} {...listeners} className="mt-1 text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing hover:text-slate-500 dark:hover:text-slate-400 p-1"><GripVertical size={20} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${info.color} whitespace-nowrap`}>{info.name}</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <textarea value={item.version} onChange={(e) => updateItem(item.id, 'version', e.target.value)} placeholder="輸入備註 (可換行)..." rows={2} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 outline-none resize-none" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900">
            <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)} className="w-12 text-center bg-white dark:bg-slate-800 border-x border-slate-200 dark:border-slate-700 py-1 text-slate-900 dark:text-white font-bold outline-none" />
          <span className="text-xs text-slate-400 px-1">Qty</span>
        </div>
        <button onClick={() => handleRemoveItem(item.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};

export const TripEditor: React.FC<TripEditorProps> = ({ inventory, folders, groups, categories, currentTrip, onSave, onCancel }) => {
  const [tripName, setTripName] = useState(currentTrip?.name || `出差行程 ${new Date().toLocaleDateString()}`);
  const [tripDate, setTripDate] = useState(currentTrip?.date || new Date().toISOString().split('T')[0]);
  const [tripItems, setTripItems] = useState<TripItem[]>(currentTrip?.items || []);
  const [tripGroups, setTripGroups] = useState<TripGroup[]>(currentTrip?.groups || [{ id: DEFAULT_TRIP_GROUP_ID, name: '主要清單' }]);
  const [activeTripGroupId, setActiveTripGroupId] = useState<string>(tripGroups[0].id);
  const [newTripGroupName, setNewTripGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterFolder, setFilterFolder] = useState<string>('ALL');
  const [filterGroup, setFilterGroup] = useState<string>('ALL');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setTripItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddItem = (invItem: InventoryItem) => {
    const newItem: TripItem = {
      id: Math.random().toString(36).substring(2, 9),
      inventoryId: invItem.id,
      tripGroupId: activeTripGroupId,
      name: invItem.name,
      category: invItem.category,
      qty: 1,
      version: invItem.defaultVersion || '',
      checked: false
    };
    setTripItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (itemId: string) => setTripItems(prev => prev.filter(i => i.id !== itemId));
  const updateItem = (itemId: string, field: keyof TripItem, value: any) => setTripItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));

  const handleAddTripGroup = () => {
    if(!newTripGroupName.trim()) return;
    const newId = Math.random().toString(36).substring(2, 9);
    setTripGroups(prev => [...prev, { id: newId, name: newTripGroupName }]);
    setActiveTripGroupId(newId);
    setNewTripGroupName('');
    setIsAddingGroup(false);
  };

  const handleDeleteTripGroup = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if(tripGroups.length <= 1) { alert("至少保留一個群組"); return; }
    if(window.confirm("刪除此群組會連同裡面的物品一起移除，確定嗎？")) {
        setTripGroups(prev => prev.filter(g => g.id !== groupId));
        setTripItems(prev => prev.filter(i => i.tripGroupId !== groupId));
        if(activeTripGroupId === groupId) setActiveTripGroupId(tripGroups[0].id);
    }
  };

  const handleSave = () => {
    if (!tripName.trim()) { alert("請輸入行程名稱"); return; }
    if (tripItems.length === 0 && !window.confirm("目前清單是空的，確定要儲存嗎？")) return;
    onSave({
      id: currentTrip?.id || Math.random().toString(36).substring(2, 9),
      userId: currentTrip?.userId || 'unknown',
      name: tripName,
      date: tripDate,
      status: currentTrip?.status || 'planning',
      groups: tripGroups,
      items: tripItems
    });
  };

  const filteredInventory = inventory.filter(item => {
    return item.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
           (filterCategory === 'ALL' || item.category === filterCategory) &&
           (filterFolder === 'ALL' || item.folderId === filterFolder) &&
           (filterGroup === 'ALL' || item.groupId === filterGroup);
  });

  const availableGroups = filterFolder === 'ALL' ? groups : groups.filter(g => g.folderId === filterFolder);
  const activeTripItems = tripItems.filter(item => item.tripGroupId === activeTripGroupId);
  const getCategoryInfo = (catId: string) => { const cat = categories.find(c => c.id === catId); return { name: cat?.name || '未知', color: cat?.color || 'bg-gray-100 text-gray-600 border-gray-200' }; };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"><ArrowLeft size={24} /></button>
          <div className="flex-1">
            <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider">行程名稱</label>
            <input type="text" value={tripName} onChange={(e) => setTripName(e.target.value)} className="text-xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none w-full" />
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input type="date" value={tripDate} onChange={(e) => setTripDate(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-transform active:scale-95"><Save size={18} /><span>儲存行程</span></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Briefcase className="text-slate-500" size={20} /><h3 className="font-bold text-slate-700 dark:text-slate-200">物品庫</h3></div>
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">點擊加入 → {tripGroups.find(g => g.id === activeTripGroupId)?.name}</span>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="搜尋..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" /></div>
              <select value={filterFolder} onChange={(e) => { setFilterFolder(e.target.value); setFilterGroup('ALL'); }} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"><option value="ALL">📁 所有資料夾</option>{folders.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}</select>
              <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none max-w-[150px]"><option value="ALL">🗃️ 所有群組</option>{availableGroups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}</select>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setFilterCategory('ALL')} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCategory === 'ALL' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}>全部</button>
              {categories.map(cat => (<button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCategory === cat.id ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}>{cat.name}</button>))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-3 content-start">
            {filteredInventory.map(item => {
                const info = getCategoryInfo(item.category);
                return (
                <button key={item.id} onClick={() => handleAddItem(item)} className="group flex flex-col items-start p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all text-left bg-white dark:bg-slate-800 shadow-sm">
                    <div className="flex justify-between w-full mb-1"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${info.color}`}>{info.name}</span><Plus size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{item.name}</span>
                    {item.defaultVersion && <span className="text-xs text-slate-400 mt-1">預設: {item.defaultVersion}</span>}
                </button>
                )
            })}
            {filteredInventory.length === 0 && <div className="col-span-full text-center text-slate-400 text-sm py-8">找不到物品，請檢查搜尋條件</div>}
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex overflow-x-auto gap-2 scrollbar-hide items-center">
             {tripGroups.map(group => (
                 <div key={group.id} onClick={() => setActiveTripGroupId(group.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all whitespace-nowrap border ${activeTripGroupId === group.id ? 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-500/50 text-blue-700 dark:text-blue-400 shadow-sm font-medium' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-white hover:border-slate-200'}`}>
                    <span>{group.name}</span><span className="text-xs bg-opacity-20 bg-slate-500 px-1.5 rounded-full">{tripItems.filter(i => i.tripGroupId === group.id).length}</span>
                    {activeTripGroupId === group.id && <button onClick={(e) => handleDeleteTripGroup(e, group.id)} className="ml-1 p-0.5 hover:text-red-500 rounded hover:bg-red-50"><X size={12} /></button>}
                 </div>
             ))}
             {isAddingGroup ? (
                 <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-blue-200 shadow-sm animate-in fade-in"><input autoFocus className="w-24 text-sm px-2 py-0.5 outline-none bg-transparent dark:text-white" placeholder="群組名稱" value={newTripGroupName} onChange={e => setNewTripGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTripGroup()} /><button onClick={handleAddTripGroup} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Plus size={14}/></button><button onClick={() => setIsAddingGroup(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={14}/></button></div>
             ) : (
                 <button onClick={() => setIsAddingGroup(true)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors" title="新增分組"><Plus size={18} /></button>
             )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
            {activeTripItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300"><Briefcase size={48} className="mb-4 opacity-50" /><p>此分組是空的，請從左側加入物品</p></div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={activeTripItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {activeTripItems.map((item) => (<SortableTripItem key={item.id} item={item} info={getCategoryInfo(item.category)} updateItem={updateItem} handleRemoveItem={handleRemoveItem} />))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};