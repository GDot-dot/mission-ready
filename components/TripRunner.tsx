import React, { useState, useEffect } from 'react';
import { Trip, TripItem, InventoryCategory } from '../types';
import { ArrowLeft, CheckCircle2, Circle, Edit3, PieChart, Layers, X, Share, Users } from 'lucide-react';
import { cloudSync } from '../firebaseConfig';

interface TripRunnerProps {
  trip: Trip;
  categories: InventoryCategory[];
  onUpdateTrip: (trip: Trip) => void;
  onBack: () => void;
  onEdit: () => void;
}

interface SummaryItem {
    name: string;
    totalQty: number;
    details: { version: string, qty: number }[];
}

interface SummaryCategory {
    categoryId: string;
    items: SummaryItem[];
}

export const TripRunner: React.FC<TripRunnerProps> = ({ trip, categories, onUpdateTrip, onBack, onEdit }) => {
  const [localTrip, setLocalTrip] = useState<Trip>(trip);
  const [showSummary, setShowSummary] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUsername, setShareUsername] = useState('');

  useEffect(() => { setLocalTrip(trip); }, [trip]);

  const toggleCheck = (itemId: string) => {
    const updatedItems = localTrip.items.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    const updatedTrip = { ...localTrip, items: updatedItems };
    const allChecked = updatedItems.every(i => i.checked);
    updatedTrip.status = allChecked ? 'completed' : 'active';
    setLocalTrip(updatedTrip);
    onUpdateTrip(updatedTrip);
  };

  const progress = Math.round((localTrip.items.filter(i => i.checked).length / localTrip.items.length) * 100) || 0;

  const getCategoryInfo = (catId: string) => {
      const cat = categories.find(c => c.id === catId);
      return {
          name: cat?.name || '未知',
          color: cat?.color || 'bg-gray-100 text-gray-600 border-gray-200'
      };
  };

  const generateSummary = () => {
      const summary: SummaryCategory[] = [];
      const itemsByCategory: Record<string, TripItem[]> = {};
      localTrip.items.forEach(item => {
          if(!itemsByCategory[item.category]) itemsByCategory[item.category] = [];
          itemsByCategory[item.category].push(item);
      });

      Object.keys(itemsByCategory).forEach(catId => {
          const items = itemsByCategory[catId];
          const itemsByName: Record<string, TripItem[]> = {};
          items.forEach(item => {
              if(!itemsByName[item.name]) itemsByName[item.name] = [];
              itemsByName[item.name].push(item);
          });

          const summaryItems: SummaryItem[] = Object.keys(itemsByName).map(name => {
              const variants = itemsByName[name];
              const totalQty = variants.reduce((sum, i) => sum + i.qty, 0);
              const detailsMap: Record<string, number> = {};
              variants.forEach(v => {
                  const key = v.version || '(無備註)';
                  detailsMap[key] = (detailsMap[key] || 0) + v.qty;
              });
              const details = Object.keys(detailsMap).map(ver => ({ version: ver, qty: detailsMap[ver] }));
              return { name, totalQty, details };
          });
          summary.push({ categoryId: catId, items: summaryItems });
      });
      return summary;
  };

  const handleExportText = () => {
      let text = `# ${localTrip.name}\n📅 日期：${localTrip.date}\n\n`;
      localTrip.groups.forEach(g => {
          const items = localTrip.items.filter(i => i.tripGroupId === g.id);
          if (items.length > 0) {
              text += `## ${g.name}\n`;
              items.forEach(i => {
                  const check = i.checked ? '[x]' : '[ ]';
                  const note = i.version ? ` (${i.version.replace(/\n/g, ' ')})` : '';
                  text += `- ${check} ${i.name} x${i.qty}${note}\n`;
              });
              text += '\n';
          }
      });
      const totalItems = localTrip.items.length;
      const completedItems = localTrip.items.filter(i => i.checked).length;
      const currentProgress = Math.round((completedItems / totalItems) * 100) || 0;
      text += `---\n### 📊 統計總表\n`;
      const summaryData = generateSummary();
      summaryData.forEach(cat => { const catName = getCategoryInfo(cat.categoryId).name; text += `**${catName}**\n`; cat.items.forEach(item => { text += `- ${item.name}: ${item.totalQty}\n`; }); text += `\n`; });
      text += `---\n進度：${currentProgress}% (${completedItems}/${totalItems})`;
      navigator.clipboard.writeText(text).then(() => alert('已複製 Markdown 清單到剪貼簿！'));
  };

  const handleShareTrip = async () => {
      if (!shareUsername.trim()) return;
      if (window.confirm(`確定要將行程分享給「${shareUsername}」嗎？\n對方登入後按下「下載」即可看到此行程。`)) {
          const result = await cloudSync.shareTrip(localTrip.id, shareUsername);
          if (result.success) {
              alert('✅ 分享成功！');
              setIsSharing(false);
              setShareUsername('');
          } else {
              alert('❌ 分享失敗：' + result.error);
          }
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Summary Modal */}
      {showSummary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700">
                  <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
                      <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800 dark:text-white"><PieChart className="text-blue-600" /> 行程統計總表</h3>
                      <button onClick={() => setShowSummary(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={24} className="text-slate-500" /></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                      {generateSummary().map(catGroup => {
                          const catInfo = getCategoryInfo(catGroup.categoryId);
                          return (
                              <div key={catGroup.categoryId} className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                  <div className={`px-4 py-2 font-bold text-sm uppercase tracking-wider border-b dark:border-slate-700 ${catInfo.color.replace('text-', 'bg-opacity-10 bg-').split(' ')[0]} ${catInfo.color.split(' ')[1]}`}>{catInfo.name}</div>
                                  <div className="divide-y divide-slate-50 dark:divide-slate-700">
                                      {catGroup.items.map((item, idx) => (
                                          <div key={idx} className="p-4 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:justify-between gap-2">
                                              <div className="flex items-baseline gap-2"><span className="font-bold text-slate-800 dark:text-slate-200 text-lg">{item.name}</span><span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">總計: {item.totalQty}</span></div>
                                              <div className="flex flex-col gap-1 sm:items-end">{item.details.map((detail, dIdx) => (<div key={dIdx} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"><span className={`px-2 py-0.5 rounded text-xs border ${detail.version === '(無備註)' ? 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-500'}`}>{detail.version}</span><span className="font-mono">x{detail.qty}</span></div>))}</div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          );
                      })}
                      {localTrip.items.length === 0 && <p className="text-center text-slate-400 py-8">目前沒有物品可供統計</p>}
                  </div>
                  <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center rounded-b-xl">
                      <button onClick={() => setShowSummary(false)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">關閉</button>
                  </div>
              </div>
          </div>
      )}

      {/* Share Modal */}
      {isSharing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700">
                  <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white"><Users className="text-blue-600" /> 分享行程</h3>
                      <button onClick={() => setIsSharing(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">請輸入對方的帳號名稱。分享後，對方將能檢視並編輯此行程。</p>
                      <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">對方帳號</label>
                          <input autoFocus className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="例如: Frank" value={shareUsername} onChange={e => setShareUsername(e.target.value)} />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button onClick={() => setIsSharing(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg">取消</button>
                          <button onClick={handleShareTrip} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">確認分享</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
            <ArrowLeft size={20} className="mr-1" /> 回到列表
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSharing(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium shadow-sm transition-all" title="分享給同事"><Users size={16} /><span className="hidden sm:inline">分享</span></button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
            <button onClick={handleExportText} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all" title="匯出文字清單"><Share size={16} /><span className="hidden sm:inline">匯出</span></button>
            <button onClick={() => setShowSummary(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium shadow-sm transition-all" title="查看統計總表"><PieChart size={16} /><span className="hidden sm:inline">統計</span></button>
            <button onClick={onEdit} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"><Edit3 size={16} />編輯</button>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${localTrip.status === 'completed' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>{localTrip.status === 'completed' ? '已完成' : '進行中'}</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            {localTrip.name}
            {localTrip.sharedWith && localTrip.sharedWith.length > 0 && <Users size={20} className="text-purple-500" title="此為共用行程"/>}
        </h1>
        {/* Progress Bar logic ... same as before */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[3rem] text-right">{progress}%</span>
        </div>
      </div>

      {/* Groups Rendering logic ... same as before */}
      {localTrip.groups.map(group => {
        const groupItems = localTrip.items.filter(i => i.tripGroupId === group.id);
        if (groupItems.length === 0) return null;
        return (
            <div key={group.id} className="space-y-3">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-lg flex items-center gap-2 border-l-4 border-blue-500 pl-3"><Layers size={18} className="text-blue-500"/>{group.name}</h3>
            <div className="grid grid-cols-1 gap-3">
                {groupItems.map(item => {
                    const info = getCategoryInfo(item.category);
                    return (
                    <div key={item.id} onClick={() => toggleCheck(item.id)} className={`relative cursor-pointer transition-all duration-200 p-4 rounded-xl border-2 shadow-sm flex items-start gap-4 ${item.checked ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 opacity-70' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors mt-1 ${item.checked ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500'}`}>
                        <CheckCircle2 size={20} className={item.checked ? 'opacity-100' : 'opacity-0'} />
                        {!item.checked && <Circle size={20} className="absolute" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex flex-col">
                                    <span className={`text-lg font-bold break-words ${item.checked ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>{item.name}</span>
                                    <span className={`text-[10px] w-fit px-1.5 py-0.5 rounded border mt-1 ${info.color}`}>{info.name}</span>
                                </div>
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-2 py-1 rounded text-sm whitespace-nowrap ml-2">x{item.qty}</span>
                            </div>
                            {item.version && <div className={`text-sm mt-2 font-medium px-3 py-2 rounded w-full whitespace-pre-wrap break-words leading-relaxed ${item.checked ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500' : 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800'}`}>{item.version}</div>}
                        </div>
                    </div>
                )})}
            </div>
            </div>
        );
      })}
      {localTrip.items.length === 0 && <div className="text-center py-20 text-slate-400"><Layers size={48} className="mx-auto mb-4 opacity-50" /><p>此行程沒有物品，請點擊編輯加入物品。</p></div>}
    </div>
  );
};