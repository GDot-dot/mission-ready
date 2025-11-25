import { Category, InventoryItem, InventoryFolder } from './types';

// Helper to generate IDs
const uid = () => Math.random().toString(36).substring(2, 9);

export const DEFAULT_FOLDER_ID = 'folder_default';

export const INITIAL_FOLDERS: InventoryFolder[] = [
  { id: DEFAULT_FOLDER_ID, name: '出差用品 (Business)', isSystem: true },
  { id: 'folder_travel', name: '個人出遊 (Travel)', isSystem: false }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  // --- 燒錄用 Tools ---
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Tools, name: 'ST-Link (U2-04)', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Tools, name: 'U-4P-10', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Tools, name: '3.3v PWR-5', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Tools, name: 'U-TTL-4 (WIFI燒錄)', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Tools, name: '紅電錶', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Tools, name: '放大鏡-2', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Tools, name: 'USB-3p -1', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Tools, name: 'USB-3p -2', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Tools, name: '聶子', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Tools, name: 'ROS治具3 (UR8、UR10)', defaultVersion: '' },

  // --- 硬體 Hardware ---
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Hardware, name: 'OSG PCBA +燈管+風扇', defaultVersion: 'V1.6' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Hardware, name: 'ROS PVBA +Ozon板', defaultVersion: 'V1.73' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Hardware, name: 'ROSV', defaultVersion: '1.7' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Hardware, name: 'Ozone', defaultVersion: '122' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Hardware, name: 'ROS電池', defaultVersion: '9顆' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Hardware, name: 'Alpha Sensor', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Hardware, name: 'PCB板子 (硬體/軟體)', defaultVersion: '' },

  // --- 線材 Cables ---
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Cables, name: '充電器 (1、3、16)', defaultVersion: '' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Cables, name: '雙紫頭 USB A to C (傳輸)', defaultVersion: 'C1' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Cables, name: '短雙白 USB A to C (傳輸)', defaultVersion: 'C2' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Cables, name: '編織線 USB A to C (傳輸)', defaultVersion: 'C1' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Cables, name: '貼輝冠 USB A to C (傳輸)', defaultVersion: 'C1' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Cables, name: 'USB PORT Hub', defaultVersion: '*1' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Cables, name: '豆腐頭', defaultVersion: '需要八孔' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Cables, name: '充電線', defaultVersion: '8條' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Cables, name: '延長線 (孔數CL+S1+豆腐頭)', defaultVersion: '2條' },

  // --- 軟體 Software ---
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Software, name: 'S1_DFU', defaultVersion: '0624' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Software, name: 'S1_AP', defaultVersion: '0804' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Software, name: 'ROS_DFU', defaultVersion: '0624' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Software, name: 'ROS_AP', defaultVersion: '0730' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Software, name: 'OSG_DFU', defaultVersion: '0624' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Software, name: 'OSG_AP', defaultVersion: '0723' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Software, name: 'OSG', defaultVersion: '085' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Software, name: 'ROS', defaultVersion: '109' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Software, name: 'Ozone_FW', defaultVersion: '079' },

  // --- 雜項 Docs ---
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Docs, name: 'QRcode (流水號)', defaultVersion: '126' },
  { id: uid(), folderId: DEFAULT_FOLDER_ID, category: Category.Docs, name: '流水號二', defaultVersion: '__' },
];

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.Tools]: 'bg-orange-100 text-orange-800 border-orange-200',
  [Category.Hardware]: 'bg-blue-100 text-blue-800 border-blue-200',
  [Category.Cables]: 'bg-purple-100 text-purple-800 border-purple-200',
  [Category.Software]: 'bg-green-100 text-green-800 border-green-200',
  [Category.Docs]: 'bg-gray-100 text-gray-800 border-gray-200',
};