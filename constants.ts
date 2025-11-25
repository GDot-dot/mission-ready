
import { InventoryItem, InventoryFolder, InventoryGroup, InventoryCategory } from './types';

// Helper to generate IDs
const uid = () => Math.random().toString(36).substring(2, 9);

export const DEFAULT_FOLDER_ID = 'folder_default';
export const DEFAULT_GROUP_ID = 'group_default';
export const DEFAULT_TRIP_GROUP_ID = 'trip_group_default';

// New: Color Palette for User Selection
export const CATEGORY_PALETTE = [
  { name: 'Amber', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Blue', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Purple', class: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Emerald', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Slate', class: 'bg-slate-50 text-slate-700 border-slate-200' },
  { name: 'Red', class: 'bg-red-50 text-red-700 border-red-200' },
  { name: 'Orange', class: 'bg-orange-50 text-orange-700 border-orange-200' },
  { name: 'Teal', class: 'bg-teal-50 text-teal-700 border-teal-200' },
  { name: 'Pink', class: 'bg-pink-50 text-pink-700 border-pink-200' },
  { name: 'Indigo', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
];

// Initial Categories (Using IDs that match old logic loosely for easier migration if needed)
export const INITIAL_CATEGORIES: InventoryCategory[] = [
  { id: 'cat_tools', name: '燒錄/工具', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'cat_hardware', name: '硬體/PCBA', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'cat_cables', name: '線材/電源', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'cat_software', name: '軟體/韌體', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'cat_docs', name: '文件/雜項', color: 'bg-slate-50 text-slate-700 border-slate-200' }
];

export const INITIAL_FOLDERS: InventoryFolder[] = [
  { id: DEFAULT_FOLDER_ID, name: '出差用品 (Business)', isSystem: true },
  { id: 'folder_travel', name: '個人出遊 (Travel)', isSystem: false }
];

export const INITIAL_GROUPS: InventoryGroup[] = [
  { id: DEFAULT_GROUP_ID, folderId: DEFAULT_FOLDER_ID, name: '通用清單', isSystem: true },
  { id: 'group_travel_default', folderId: 'folder_travel', name: '通用清單', isSystem: true }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  // --- 燒錄用 Tools ---
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_tools', name: 'ST-Link (U2-04)', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_tools', name: 'U-4P-10', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_tools', name: '3.3v PWR-5', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_tools', name: 'U-TTL-4 (WIFI燒錄)', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_tools', name: '紅電錶', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_tools', name: '放大鏡-2', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_tools', name: 'USB-3p -1', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_tools', name: 'USB-3p -2', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_tools', name: '聶子', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_tools', name: 'ROS治具3 (UR8、UR10)', defaultVersion: '' },

  // --- 硬體 Hardware ---
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_hardware', name: 'OSG PCBA +燈管+風扇', defaultVersion: 'V1.6' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_hardware', name: 'ROS PVBA +Ozon板', defaultVersion: 'V1.73' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_hardware', name: 'ROSV', defaultVersion: '1.7' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_hardware', name: 'Ozone', defaultVersion: '122' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_hardware', name: 'ROS電池', defaultVersion: '9顆' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_hardware', name: 'Alpha Sensor', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_hardware', name: 'PCB板子 (硬體/軟體)', defaultVersion: '' },

  // --- 線材 Cables ---
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_cables', name: '充電器 (1、3、16)', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_cables', name: '雙紫頭 USB A to C (傳輸)', defaultVersion: 'C1' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_cables', name: '短雙白 USB A to C (傳輸)', defaultVersion: 'C2' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_cables', name: '編織線 USB A to C (傳輸)', defaultVersion: 'C1' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_cables', name: '貼輝冠 USB A to C (傳輸)', defaultVersion: 'C1' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_cables', name: 'USB PORT Hub', defaultVersion: '*1' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_cables', name: '豆腐頭', defaultVersion: '需要八孔' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_cables', name: '充電線', defaultVersion: '8條' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_cables', name: '延長線 (孔數CL+S1+豆腐頭)', defaultVersion: '2條' },

  // --- 軟體 Software ---
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_software', name: 'S1_DFU', defaultVersion: '0624' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_software', name: 'S1_AP', defaultVersion: '0804' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_software', name: 'ROS_DFU', defaultVersion: '0624' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_software', name: 'ROS_AP', defaultVersion: '0730' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_software', name: 'OSG_DFU', defaultVersion: '0624' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, groupId: DEFAULT_GROUP_ID, category: 'cat_software', name: 'OSG_AP', defaultVersion: '0723' },
];
