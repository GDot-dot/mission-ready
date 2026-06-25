import { ShoppingList, Trip } from './types';

const CLIENT_ID_KEY = 'mission_ready_client_id';

export const getClientId = () => {
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
};

export const stampSyncMeta = <T extends { revision?: number; updatedAt?: string; updatedByClientId?: string }>(record: T, clientId = getClientId()): T => ({
  ...record,
  revision: (record.revision || 0) + 1,
  updatedAt: new Date().toISOString(),
  updatedByClientId: clientId
});

export const isDeleted = (record: { deletedAt?: string | null }) => Boolean(record.deletedAt);

const mergeByIdKeepingLatest = <T extends { id: string; updatedAt?: string; deletedAt?: string | null }>(cloudItems: T[], localItems: T[]) => {
  const merged = new Map<string, T>();
  [...cloudItems, ...localItems].forEach(item => {
    const existing = merged.get(item.id);
    if (!existing || Date.parse(item.updatedAt || '0') >= Date.parse(existing.updatedAt || '0')) {
      merged.set(item.id, item);
    }
  });
  return [...merged.values()].filter(item => !isDeleted(item));
};

export const mergeTripsForDisplay = (cloudTrips: Trip[], localTrips: Trip[]) => mergeByIdKeepingLatest(cloudTrips, localTrips);
export const mergeShoppingListsForDisplay = (cloudLists: ShoppingList[], localLists: ShoppingList[]) => mergeByIdKeepingLatest(cloudLists, localLists);

export const hasNewerCloudRecord = <T extends { id: string; updatedAt?: string; updatedByClientId?: string }>(
  localRecord: T,
  cloudRecords: T[],
  clientId = getClientId()
) => {
  const cloudRecord = cloudRecords.find(record => record.id === localRecord.id);
  if (!cloudRecord || cloudRecord.updatedByClientId === clientId) return false;

  const cloudTime = Date.parse(cloudRecord.updatedAt || '0');
  const localTime = Date.parse(localRecord.updatedAt || '0');
  return cloudTime > localTime;
};
