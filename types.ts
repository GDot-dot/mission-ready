export enum Category {
  Tools = "燒錄/工具 (Tools)",
  Hardware = "硬體/PCBA (Hardware)",
  Cables = "線材/電源 (Cables/Power)",
  Software = "軟體/韌體 (Software)",
  Docs = "文件/雜項 (Docs/Misc)"
}

export interface User {
  id: string;
  username: string;
}

export interface InventoryFolder {
  id: string;
  name: string;
  icon?: string;
  isSystem?: boolean; // For 'Default' folder that shouldn't be deleted
}

export interface InventoryItem {
  id: string;
  folderId: string; // Links item to a folder
  name: string;
  category: Category;
  defaultVersion?: string; // Pre-fill value for version/note
}

export interface TripItem {
  id: string; // Unique ID for this specific item in the trip
  inventoryId: string;
  name: string;
  category: Category;
  qty: number;
  version: string; // User editable version/note
  checked: boolean;
}

export interface Trip {
  id: string;
  userId: string; // Belongs to specific user
  name: string;
  date: string;
  status: 'planning' | 'active' | 'completed';
  items: TripItem[];
}

export type ViewState = 'DASHBOARD' | 'INVENTORY' | 'TRIP_EDIT' | 'TRIP_RUN';