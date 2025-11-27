export interface InventoryCategory {
  id: string;
  name: string;
  color: string; // Tailwind classes string
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

export interface InventoryGroup {
  id: string;
  folderId: string; // Links group to a folder
  name: string;
  isSystem?: boolean; // For 'Default' group
}

export interface InventoryItem {
  id: string;
  folderId: string; // Links item to a folder
  groupId: string;  // Links item to a user-defined group
  name: string;
  category: string; // Now stores the Category ID string
  defaultVersion?: string; // Pre-fill value for version/note
}

// --- New: Bundles Interface ---
export interface BundleItem {
    inventoryId: string;
    qty: number;
}

export interface InventoryBundle {
    id: string;
    name: string;
    items: BundleItem[];
}
// ------------------------------

export interface TripGroup {
  id: string;
  name: string;
}

export interface TripItem {
  id: string; // Unique ID for this specific item in the trip
  inventoryId: string;
  tripGroupId: string; // Belongs to a specific group within the trip (e.g., "Bag 1")
  name: string;
  category: string; // Stores Category ID
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
  groups: TripGroup[]; // List of groups defined for this trip
  items: TripItem[];
}

export type ViewState = 'DASHBOARD' | 'INVENTORY' | 'TRIP_EDIT' | 'TRIP_RUN';