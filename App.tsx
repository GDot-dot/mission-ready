import React, { useState, useEffect } from 'react';
import { Inventory } from './components/Inventory';
import { TripEditor } from './components/TripEditor';
import { TripRunner } from './components/TripRunner';
import { Auth } from './components/Auth';
import { INITIAL_INVENTORY, INITIAL_FOLDERS, INITIAL_GROUPS, INITIAL_CATEGORIES, INITIAL_BUNDLES, DEFAULT_FOLDER_ID, DEFAULT_GROUP_ID, DEFAULT_TRIP_GROUP_ID } from './constants';
import { InventoryItem, Trip, ViewState, User, InventoryFolder, InventoryGroup, InventoryCategory, InventoryBundle } from './types';
import { ListChecks, Plus, Calendar, ChevronRight, Briefcase, LogOut, User as UserIcon, UploadCloud, DownloadCloud, Loader2, Moon, Sun, Search, Copy, X } from 'lucide-react';
import { cloudSync } from './firebaseConfig';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [folders, setFolders] = useState<InventoryFolder[]>([]);
  const [groups, setGroups] = useState<InventoryGroup[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [bundles, setBundles] = useState<InventoryBundle[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // --- Dark Mode ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('mission_ready_theme');
    if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('mission_ready_theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('mission_ready_theme', 'light');
      }
  };

  // --- Auth Check on Mount ---
  useEffect(() => {
    const savedUserId = localStorage.getItem('mission_ready_active_user_id');
    const users = JSON.parse(localStorage.getItem('mission_ready_users') || '[]');
    if (savedUserId && users.length > 0) {
      const activeUser = users.find((u: any) => u.id === savedUserId);
      if (activeUser) {
        handleLogin({ id: activeUser.id, username: activeUser.username });
      }
    }
  }, []);

  // --- Data Loading & Persistence ---
  const loadUserData = (userId: string) => {
    const savedCategories = localStorage.getItem(`mission_ready_categories_${userId}`);
    setCategories(savedCategories ? JSON.parse(savedCategories) : INITIAL_CATEGORIES);

    const savedBundles = localStorage.getItem(`mission_ready_bundles_${userId}`);
    setBundles(savedBundles ? JSON.parse(savedBundles) : INITIAL_BUNDLES);

    const savedInventory = localStorage.getItem(`mission_ready_inventory_${userId}`);
    let loadedInventory: InventoryItem[] = [];
    
    if (savedInventory) {
      loadedInventory = JSON.parse(savedInventory);
      loadedInventory = loadedInventory.map(i => {
        let catId = i.category;
        if (!catId.startsWith('cat_') && !INITIAL_CATEGORIES.some(c => c.id === catId)) {
             catId = 'cat_tools'; 
        }
        return {
          ...i,
          category: catId,
          folderId: i.folderId || DEFAULT_FOLDER_ID,
          groupId: i.groupId || DEFAULT_GROUP_ID
        };
      });
    } else {
      loadedInventory = INITIAL_INVENTORY;
    }
    setInventory(loadedInventory);

    const savedTrips = localStorage.getItem(`mission_ready_trips_${userId}`);
    let loadedTrips: Trip[] = savedTrips ? JSON.parse(savedTrips) : [];
    
    loadedTrips = loadedTrips.map(trip => ({
      ...trip,
      groups: trip.groups || [{ id: DEFAULT_TRIP_GROUP_ID, name: '主要清單' }],
      items: trip.items.map(item => ({
            ...item,
            category: (!item.category.startsWith('cat_') && !INITIAL_CATEGORIES.some(c => c.id === item.category)) ? 'cat_tools' : item.category,
            tripGroupId: item.tripGroupId || DEFAULT_TRIP_GROUP_ID
      }))
    }));
    setTrips(loadedTrips);

    const savedFolders = localStorage.getItem(`mission_ready_folders_${userId}`);
    setFolders(savedFolders ? JSON.parse(savedFolders) : INITIAL_FOLDERS);

    const savedGroups = localStorage.getItem(`mission_ready_groups_${userId}`);
    setGroups(savedGroups ? JSON.parse(savedGroups) : INITIAL_GROUPS);
  };

  useEffect(() => { if (user) localStorage.setItem(`mission_ready_inventory_${user.id}`, JSON.stringify(inventory)); }, [inventory, user]);
  useEffect(() => { if (user) localStorage.setItem(`mission_ready_trips_${user.id}`, JSON.stringify(trips)); }, [trips, user]);
  useEffect(() => { if (user) localStorage.setItem(`mission_ready_folders_${user.id}`, JSON.stringify(folders)); }, [folders, user]);
  useEffect(() => { if (user) localStorage.setItem(`mission_ready_groups_${user.id}`, JSON.stringify(groups)); }, [groups, user]);
  useEffect(() => { if (user) localStorage.setItem(`mission_ready_categories_${user.id}`, JSON.stringify(categories)); }, [categories, user]);
  useEffect(() => { if (user) localStorage.setItem(`mission_ready_bundles_${user.id}`, JSON.stringify(bundles)); }, [bundles, user]);

  // --- Handlers ---
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('mission_ready_active_user_id', loggedInUser.id);
    loadUserData(loggedInUser.id);
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mission_ready_active_user_id');
    setInventory([]);
    setTrips([]);
    setFolders([]);
    setGroups([]);
    setCategories([]);
    setBundles([]);
  };

  const handleSaveTrip = (updatedTrip: Trip) => {
    if (!user) return;
    const tripWithUser = { ...updatedTrip, userId: user.id };
    
    setTrips(prev => {
      const exists = prev.find(t => t.id === updatedTrip.id);
      if (exists) {
        return prev.map(t => t.id === updatedTrip.id ? tripWithUser : t);
      }
      return [tripWithUser, ...prev];
    });
    setActiveTripId(updatedTrip.id);
    setView('TRIP_RUN');
  };

  const handleDuplicateTrip = (e: React.MouseEvent, trip: Trip) => {
      e.stopPropagation();
      if (!user) return;
      if (window.confirm(`確定要複製行程「${trip.name}」嗎？`)) {
          const newTrip: Trip = {
              ...trip,
              id: Math.random().toString(36).substring(2, 9),
              name: `${trip.name} (Copy)`,
              date: new Date().toISOString().split('T')[0],
              status: 'planning',
              items: trip.items.map(i => ({ ...i, id: Math.random().toString(36).substring(2, 9), checked: false }))
          };
          setTrips(prev => [newTrip, ...prev]);
      }
  };

  const handleCreateTrip = () => {
    setActiveTripId(null);
    setView('TRIP_EDIT');
  };

  const handleOpenTrip = (tripId: string) => {
    setActiveTripId(tripId);
    setView('TRIP_RUN');
  };

  const handleDeleteTrip = (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if(window.confirm("確定要刪除這個行程紀錄嗎？")) {
      setTrips(prev => prev.filter(t => t.id !== tripId));
      if(activeTripId === tripId) {
        setActiveTripId(null);
        setView('DASHBOARD');
      }
    }
  };

  const handleCloudUpload = async () => {
    if (!user) return;
    setIsSyncing(true);
    const data = { inventory, trips, folders, groups, categories, bundles };
    try {
        const result = await cloudSync.upload(user.id, data);
        if (result.success) alert('✅ 雲端備份成功！');
        else alert('❌ 上傳失敗：' + JSON.stringify(result.error));
    } catch (e) { console.error(e); alert('❌ 上傳發生錯誤'); } 
    finally { setIsSyncing(false); }
  };

  // 在 App.tsx 內部

  const handleCloudDownload = async () => {
    if (!user) return;
    if (!window.confirm("確定要從雲端同步資料嗎？\n(您的物品庫設定將被雲端版本覆蓋，但您的行程資料會進行合併)")) return;
    
    setIsSyncing(true);
    try {
        // Pass current 'trips' to allow merging
        const result = await cloudSync.download(user.id, trips);
        
        if (result.success && result.data) {
            const { inventory: newInv, trips: newTrips, folders: newFolders, groups: newGroups, categories: newCats, bundles: newBundles } = result.data;
            if(newCats) setCategories(newCats);
            if(newBundles) setBundles(newBundles);
            if(newInv) setInventory(newInv);
            if(newTrips) setTrips(newTrips);
            if(newFolders) setFolders(newFolders);
            if(newGroups) setGroups(newGroups);
            alert('✅ 資料同步完成！(行程已合併)');
        } else { alert('❌ 下載失敗，找不到資料'); }
    } catch (e) { console.error(e); alert('❌ 下載發生錯誤'); } 
    finally { setIsSyncing(false); }
  };

  // --- Render ---
  if (!user) return <Auth onLogin={handleLogin} />;

  const activeTrip = trips.find(t => t.id === activeTripId) || null;

  // Global Search Logic
  const searchResultsItems = inventory.filter(i => i.name.toLowerCase().includes(globalSearch.toLowerCase()));
  const searchResultsTrips = trips.filter(t => t.name.toLowerCase().includes(globalSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div onClick={() => setView('DASHBOARD')} className="flex items-center gap-2 cursor-pointer">
                <div className="bg-slate-900 dark:bg-slate-700 text-white p-1.5 rounded-lg">
                    <ListChecks size={20} />
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white hidden md:block">Mission Ready</span>
            </div>

            <div className="flex items-center gap-1 md:gap-4">
                <div className="flex gap-1">
                    <button onClick={() => setView('DASHBOARD')} className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'DASHBOARD' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>儀表板</button>
                    <button onClick={() => setView('INVENTORY')} className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'INVENTORY' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>物品庫</button>
                </div>
                
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <div className="flex items-center gap-2">
                  <button onClick={toggleDarkMode} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                  {isSyncing ? (
                    <Loader2 size={18} className="animate-spin text-slate-400" />
                  ) : (
                    <>
                        <button onClick={handleCloudUpload} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors" title="上傳"><UploadCloud size={20} /></button>
                        <button onClick={handleCloudDownload} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-slate-800 rounded-lg transition-colors" title="下載"><DownloadCloud size={20} /></button>
                    </>
                  )}
                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                  <div className="hidden md:flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-medium px-2">
                    <UserIcon size={16} />
                    <span>{user.username}</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors"><LogOut size={20} /></button>
                </div>
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'DASHBOARD' && (
            <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 border border-slate-700">
                    <div className="flex-1 w-full">
                        <h1 className="text-3xl font-bold mb-2">準備好出勤了嗎？</h1>
                        <div className="relative mt-4 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="搜尋物品或行程..." 
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {globalSearch && <button onClick={() => setGlobalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><X size={16}/></button>}
                        </div>
                    </div>
                    <button onClick={handleCreateTrip} className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap">
                        <Plus size={24} /> 建立新行程
                    </button>
                </div>

                {/* Global Search Results */}
                {globalSearch && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">搜尋結果: "{globalSearch}"</h3>
                        <div className="space-y-6">
                            {searchResultsTrips.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-blue-600 mb-2 uppercase">相關行程</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {searchResultsTrips.map(t => (
                                            <div key={t.id} onClick={() => handleOpenTrip(t.id)} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:border-blue-400 transition-colors">
                                                <div className="font-bold text-slate-800 dark:text-white">{t.name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{t.date}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {searchResultsItems.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-green-600 mb-2 uppercase">物品庫</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {searchResultsItems.map(i => (
                                            <div key={i.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200">
                                                {i.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {searchResultsItems.length === 0 && searchResultsTrips.length === 0 && (
                                <p className="text-slate-400">沒有找到相關內容。</p>
                            )}
                        </div>
                    </div>
                )}

                {!globalSearch && (
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Calendar size={20} className="text-slate-500" />最近行程</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trips.length === 0 ? (
                                <div className="col-span-full bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center text-slate-400">
                                    <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>尚無行程紀錄，點擊上方按鈕開始建立。</p>
                                </div>
                            ) : (
                                trips.map(trip => {
                                    const completedCount = trip.items.filter(i => i.checked).length;
                                    const totalCount = trip.items.length;
                                    const percent = totalCount === 0 ? 0 : Math.round((completedCount/totalCount)*100);
                                    return (
                                        <div key={trip.id} onClick={() => handleOpenTrip(trip.id)} className="group bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/50 transition-all cursor-pointer relative">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="min-w-0 pr-4">
                                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors truncate">{trip.name}</h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{trip.date}</p>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${percent === 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{percent === 100 ? '已完成' : '進行中'}</span>
                                                    <div className="flex gap-1 mt-2 z-10">
                                                        <button onClick={(e) => handleDuplicateTrip(e, trip)} className="text-slate-300 hover:text-blue-500 p-1" title="複製"><Copy size={14}/></button>
                                                        <button onClick={(e) => handleDeleteTrip(e, trip.id)} className="text-slate-300 hover:text-red-500 p-1" title="刪除"><X size={16}/></button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium"><span>進度</span><span>{completedCount}/{totalCount} 項目</span></div>
                                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }}></div>
                                                </div>
                                            </div>
                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}

        {view === 'INVENTORY' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-300"><Inventory items={inventory} setItems={setInventory} folders={folders} setFolders={setFolders} groups={groups} setGroups={setGroups} categories={categories} setCategories={setCategories} bundles={bundles} setBundles={setBundles} /></div>}
        {view === 'TRIP_EDIT' && <div className="animate-in fade-in zoom-in-95 duration-200"><TripEditor inventory={inventory} folders={folders} groups={groups} categories={categories} bundles={bundles} currentTrip={activeTrip} onSave={handleSaveTrip} onCancel={() => setView(activeTripId ? 'TRIP_RUN' : 'DASHBOARD')} /></div>}
        {view === 'TRIP_RUN' && activeTrip && <div className="animate-in fade-in slide-in-from-right-4 duration-300"><TripRunner trip={activeTrip} categories={categories} onUpdateTrip={handleSaveTrip} onBack={() => setView('DASHBOARD')} onEdit={() => setView('TRIP_EDIT')} /></div>}
      </main>
    </div>
  );
}