
import React, { useState, useEffect } from 'react';
import { Inventory } from './components/Inventory';
import { TripEditor } from './components/TripEditor';
import { TripRunner } from './components/TripRunner';
import { Auth } from './components/Auth';
import { INITIAL_INVENTORY, INITIAL_FOLDERS, INITIAL_GROUPS, DEFAULT_FOLDER_ID, DEFAULT_GROUP_ID } from './constants';
import { InventoryItem, Trip, ViewState, User, InventoryFolder, InventoryGroup } from './types';
import { ListChecks, Plus, Calendar, ChevronRight, Briefcase, LogOut, User as UserIcon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  
  // App state is only valid when user is logged in
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [folders, setFolders] = useState<InventoryFolder[]>([]);
  const [groups, setGroups] = useState<InventoryGroup[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

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
  
  // Load data when user changes
  const loadUserData = (userId: string) => {
    // Inventory
    const savedInventory = localStorage.getItem(`mission_ready_inventory_${userId}`);
    let loadedInventory: InventoryItem[] = [];
    
    if (savedInventory) {
      loadedInventory = JSON.parse(savedInventory);
      // Migration for old items without folderId or groupId
      loadedInventory = loadedInventory.map(i => {
        return {
          ...i,
          folderId: i.folderId || DEFAULT_FOLDER_ID,
          groupId: i.groupId || DEFAULT_GROUP_ID
        };
      });
    } else {
      loadedInventory = INITIAL_INVENTORY;
    }
    setInventory(loadedInventory);

    // Trips
    const savedTrips = localStorage.getItem(`mission_ready_trips_${userId}`);
    setTrips(savedTrips ? JSON.parse(savedTrips) : []);

    // Folders
    const savedFolders = localStorage.getItem(`mission_ready_folders_${userId}`);
    setFolders(savedFolders ? JSON.parse(savedFolders) : INITIAL_FOLDERS);

    // Groups
    const savedGroups = localStorage.getItem(`mission_ready_groups_${userId}`);
    setGroups(savedGroups ? JSON.parse(savedGroups) : INITIAL_GROUPS);
  };

  // Persist data when it changes (only if logged in)
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`mission_ready_inventory_${user.id}`, JSON.stringify(inventory));
  }, [inventory, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`mission_ready_trips_${user.id}`, JSON.stringify(trips));
  }, [trips, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`mission_ready_folders_${user.id}`, JSON.stringify(folders));
  }, [folders, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`mission_ready_groups_${user.id}`, JSON.stringify(groups));
  }, [groups, user]);

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

  // --- Render ---

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const activeTrip = trips.find(t => t.id === activeTripId) || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* --- Top Navigation --- */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
                onClick={() => setView('DASHBOARD')}
                className="flex items-center gap-2 cursor-pointer"
            >
                <div className="bg-slate-900 text-white p-1.5 rounded-lg">
                    <ListChecks size={20} />
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-800 hidden md:block">Mission Ready</span>
            </div>

            <div className="flex items-center gap-1 md:gap-4">
                <div className="flex gap-1">
                    <button 
                        onClick={() => setView('DASHBOARD')}
                        className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'DASHBOARD' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        儀表板
                    </button>
                    <button 
                        onClick={() => setView('INVENTORY')}
                        className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'INVENTORY' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        物品庫
                    </button>
                </div>
                
                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 text-slate-600 text-sm font-medium px-2">
                    <UserIcon size={16} />
                    <span>{user.username}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="登出"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
            </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* VIEW: DASHBOARD */}
        {view === 'DASHBOARD' && (
            <div className="space-y-8 animate-in fade-in duration-300">
                {/* Hero Action */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">準備好出勤了嗎？</h1>
                        <p className="text-slate-300">建立新的清單，確保硬體、線材與軟體版本無誤。</p>
                    </div>
                    <button 
                        onClick={handleCreateTrip}
                        className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={24} />
                        建立新行程
                    </button>
                </div>

                {/* Recent Trips */}
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-slate-500" />
                        最近行程
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trips.length === 0 ? (
                            <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400">
                                <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                                <p>尚無行程紀錄，點擊上方按鈕開始建立。</p>
                            </div>
                        ) : (
                            trips.map(trip => {
                                const completedCount = trip.items.filter(i => i.checked).length;
                                const totalCount = trip.items.length;
                                const percent = totalCount === 0 ? 0 : Math.round((completedCount/totalCount)*100);

                                return (
                                    <div 
                                        key={trip.id}
                                        onClick={() => handleOpenTrip(trip.id)}
                                        className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer relative"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="min-w-0 pr-4">
                                                <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors truncate">{trip.name}</h3>
                                                <p className="text-sm text-slate-500">{trip.date}</p>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${percent === 100 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {percent === 100 ? '已完成' : '進行中'}
                                                </span>
                                                <button 
                                                    onClick={(e) => handleDeleteTrip(e, trip.id)}
                                                    className="mt-2 text-xs text-slate-300 hover:text-red-500 p-1 z-10"
                                                >
                                                    刪除
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Mini Progress Bar */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                                                <span>進度</span>
                                                <span>{completedCount}/{totalCount} 項目</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }}></div>
                                            </div>
                                        </div>
                                        
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: INVENTORY */}
        {view === 'INVENTORY' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Inventory 
                    items={inventory} 
                    setItems={setInventory} 
                    folders={folders}
                    setFolders={setFolders}
                    groups={groups}
                    setGroups={setGroups}
                />
            </div>
        )}

        {/* VIEW: TRIP EDITOR */}
        {view === 'TRIP_EDIT' && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
                <TripEditor 
                    inventory={inventory} 
                    folders={folders}
                    groups={groups}
                    currentTrip={activeTrip}
                    onSave={handleSaveTrip}
                    onCancel={() => setView(activeTripId ? 'TRIP_RUN' : 'DASHBOARD')}
                />
            </div>
        )}

        {/* VIEW: TRIP RUNNER */}
        {view === 'TRIP_RUN' && activeTrip && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <TripRunner 
                    trip={activeTrip}
                    onUpdateTrip={handleSaveTrip}
                    onBack={() => setView('DASHBOARD')}
                    onEdit={() => setView('TRIP_EDIT')}
                />
            </div>
        )}
      </main>
    </div>
  );
}
