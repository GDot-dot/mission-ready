import firebase from "firebase/compat/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, writeBatch } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAInv4O5MVcOE3kb8ztIM9U2Q1OOmnjJk",
  authDomain: "mission-ready-30e27.firebaseapp.com",
  projectId: "mission-ready-30e27",
  storageBucket: "mission-ready-30e27.firebasestorage.app",
  messagingSenderId: "421602206314",
  appId: "1:421602206314:web:6f24797d13a78609532013",
  measurementId: "G-QQ21XL2Y9H"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = getFirestore(app as any);
const auth = getAuth(app as any);

const CLOUD_SCHEMA_VERSION = 2;
const FIRESTORE_BATCH_LIMIT = 450;

const safeParseCloudData = (rawData: unknown) => {
  if (!rawData || typeof rawData !== "string") return {};

  try {
    return JSON.parse(rawData);
  } catch (error) {
    console.warn("Unable to parse legacy cloud data:", error);
    return {};
  }
};

const getUserSettingsFromDoc = (snapshotData: any) => {
  if (!snapshotData) return {};

  if (snapshotData.settings && typeof snapshotData.settings === "object") {
    return snapshotData.settings;
  }

  return safeParseCloudData(snapshotData.data);
};

const hasNewerRemoteVersion = (localRecord: any, remoteRecord: any, clientId: string) => {
  if (!remoteRecord || remoteRecord.updatedByClientId === clientId) return false;

  const remoteTime = Date.parse(remoteRecord.updatedAt || "0");
  const localTime = Date.parse(localRecord.updatedAt || "0");
  return remoteTime > localTime;
};

const stripUndefined = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, stripUndefined(entryValue)])
    );
  }

  return value;
};

const commitBatches = async (writes: Array<(batch: ReturnType<typeof writeBatch>) => void>) => {
  for (let i = 0; i < writes.length; i += FIRESTORE_BATCH_LIMIT) {
    const batch = writeBatch(db);
    writes.slice(i, i + FIRESTORE_BATCH_LIMIT).forEach(write => write(batch));
    await batch.commit();
  }
};

export const cloudAuth = {
  register: async (email: string, password: string, username?: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const displayName = username?.trim() || cleanEmail.split("@")[0];
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const uid = credential.user.uid;
      const now = new Date().toISOString();

      await setDoc(doc(db, "profiles", uid), {
        uid,
        username: displayName,
        email: cleanEmail,
        createdAt: now,
        authProvider: "firebase"
      });

      return { success: true, userId: uid, username: displayName, email: cleanEmail, authProvider: "firebase" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  registerLegacy: async (username: string, password: string) => {
    try {
      const accountRef = doc(db, "user_accounts", username);
      const accountSnap = await getDoc(accountRef);
      if (accountSnap.exists()) return { success: false, error: "此帳號已被註冊" };

      const newUserId = Math.random().toString(36).substring(2, 15);
      await setDoc(accountRef, { password, userId: newUserId, createdAt: new Date().toISOString() });
      return { success: true, userId: newUserId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  login: async (identifier: string, password: string) => {
    const cleanIdentifier = identifier.trim();
    if (cleanIdentifier.includes("@")) {
      try {
        const credential = await signInWithEmailAndPassword(auth, cleanIdentifier.toLowerCase(), password);
        const uid = credential.user.uid;
        const profileSnap = await getDoc(doc(db, "profiles", uid));
        const profile = profileSnap.exists() ? profileSnap.data() : {};
        return {
          success: true,
          userId: uid,
          username: profile.username || credential.user.email || cleanIdentifier,
          email: credential.user.email || cleanIdentifier,
          authProvider: "firebase"
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    return cloudAuth.loginLegacy(cleanIdentifier, password);
  },
  loginLegacy: async (username: string, password: string) => {
    try {
      const accountRef = doc(db, "user_accounts", username);
      const accountSnap = await getDoc(accountRef);
      if (!accountSnap.exists()) return { success: false, error: "帳號不存在" };
      
      const data = accountSnap.data();
      if (data.disabled && data.migratedToUid) return { success: false, error: "此帳號已升級，請使用 Email 登入。" };
      if (data.password !== password) return { success: false, error: "密碼錯誤" };
      return { success: true, userId: data.userId, username, authProvider: "legacy" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  logout: async () => {
      try {
          await signOut(auth);
      } catch (error) {
          console.warn("Firebase sign out failed:", error);
      }
  },
  findUserByUsername: async (username: string) => {
      try {
          const accountRef = doc(db, "user_accounts", username);
          const snap = await getDoc(accountRef);
          if (snap.exists()) {
              const data = snap.data();
              return { success: true, userId: data.migratedToUid || data.userId };
          }

          const profilesRef = collection(db, "profiles");
          const usernameQuery = query(profilesRef, where("username", "==", username));
          const emailQuery = query(profilesRef, where("email", "==", username.trim().toLowerCase()));
          const [usernameSnap, emailSnap] = await Promise.all([getDocs(usernameQuery), getDocs(emailQuery)]);
          const profileDoc = !usernameSnap.empty ? usernameSnap.docs[0] : (!emailSnap.empty ? emailSnap.docs[0] : null);
          if (profileDoc) return { success: true, userId: profileDoc.id };

          return { success: false, error: "找不到此使用者" };
      } catch (error) {
          return { success: false, error: "搜尋失敗" };
      }
  },
  findUsernameById: async (userId: string) => {
      try {
          const q = query(collection(db, "user_accounts"), where("userId", "==", userId));
          const snap = await getDocs(q);
          if (!snap.empty) return { success: true, username: snap.docs[0].id };
          const profileSnap = await getDoc(doc(db, "profiles", userId));
          if (profileSnap.exists()) return { success: true, username: profileSnap.data().username || profileSnap.data().email };
          return { success: false, error: "Unknown" };
      } catch (error) {
          return { success: false, error: "Error" };
      }
  },
  migrateLegacyUser: async (oldUserId: string, legacyUsername: string, email: string, password: string) => {
      try {
          const cleanEmail = email.trim().toLowerCase();
          const now = new Date().toISOString();
          const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          const newUid = credential.user.uid;

          const oldUserRef = doc(db, "users", oldUserId);
          const oldUserSnap = await getDoc(oldUserRef);
          const oldUserData = oldUserSnap.exists() ? oldUserSnap.data() : null;

          const writes: Array<(batch: ReturnType<typeof writeBatch>) => void> = [
              batch => batch.set(doc(db, "profiles", newUid), {
                  uid: newUid,
                  username: legacyUsername,
                  email: cleanEmail,
                  createdAt: now,
                  migratedFromLegacyUserId: oldUserId,
                  migratedAt: now,
                  authProvider: "firebase"
              }),
              batch => batch.set(doc(db, "user_accounts", legacyUsername), {
                  migratedToUid: newUid,
                  migratedAt: now,
                  disabled: true
              }, { merge: true })
          ];

          if (oldUserData) {
              writes.push(batch => batch.set(doc(db, "users", newUid), stripUndefined({
                  ...oldUserData,
                  migratedFromLegacyUserId: oldUserId,
                  migratedAt: now,
                  lastUpdated: now
              })));
          }

          const tripsSnap = await getDocs(query(collection(db, "trips"), where("userId", "==", oldUserId)));
          tripsSnap.docs.forEach(tripDoc => {
              writes.push(batch => batch.set(doc(db, "trips", tripDoc.id), stripUndefined({
                  ...tripDoc.data(),
                  userId: newUid,
                  updatedAt: now
              })));
          });

          const sharedTripsSnap = await getDocs(query(collection(db, "trips"), where("sharedWith", "array-contains", oldUserId)));
          sharedTripsSnap.docs.forEach(tripDoc => {
              const data = tripDoc.data();
              writes.push(batch => batch.set(doc(db, "trips", tripDoc.id), stripUndefined({
                  ...data,
                  sharedWith: Array.from(new Set([...(data.sharedWith || []).filter((id: string) => id !== oldUserId), newUid])),
                  updatedAt: now
              })));
          });

          const shoppingSnap = await getDocs(query(collection(db, "shopping_lists"), where("userId", "==", oldUserId)));
          shoppingSnap.docs.forEach(listDoc => {
              writes.push(batch => batch.set(doc(db, "shopping_lists", listDoc.id), stripUndefined({
                  ...listDoc.data(),
                  userId: newUid,
                  updatedAt: now
              })));
          });

          const sharedShoppingSnap = await getDocs(query(collection(db, "shopping_lists"), where("sharedWith", "array-contains", oldUserId)));
          sharedShoppingSnap.docs.forEach(listDoc => {
              const data = listDoc.data();
              writes.push(batch => batch.set(doc(db, "shopping_lists", listDoc.id), stripUndefined({
                  ...data,
                  sharedWith: Array.from(new Set([...(data.sharedWith || []).filter((id: string) => id !== oldUserId), newUid])),
                  updatedAt: now
              })));
          });

          await commitBatches(writes);

          return { success: true, userId: newUid, username: legacyUsername, email: cleanEmail, authProvider: "firebase" };
      } catch (error: any) {
          return { success: false, error: error.message };
      }
  }
};

export const cloudSync = {
  upload: async (userId: string, data: any) => {
    try {
      const { trips = [], shoppingLists = [], clientId = "", dirtyTripIds = [], dirtyShoppingListIds = [], ...settingsData } = data;
      const cleanSettingsData = stripUndefined(settingsData);
      const now = new Date().toISOString();
      const ownedTripIds = trips.filter((trip: any) => trip.userId === userId).map((trip: any) => trip.id);
      const ownedShoppingListIds = shoppingLists.filter((list: any) => list.userId === userId).map((list: any) => list.id);
      const dirtyTripIdSet = new Set(dirtyTripIds);
      const dirtyShoppingListIdSet = new Set(dirtyShoppingListIds);
      
      // Safety check: Prevent uploading empty inventory over existing data
      if (!cleanSettingsData.inventory || cleanSettingsData.inventory.length === 0) {
          const docRef = doc(db, "users", userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              const cloudData = getUserSettingsFromDoc(docSnap.data());
              if (cloudData.inventory && cloudData.inventory.length > 0) {
                  return { success: false, error: "本地物品庫為空，為防止誤刪，已取消上傳。請先執行下載。" };
              }
          }
      }

      const conflictChecks = [
        ...trips
          .filter((trip: any) => dirtyTripIdSet.has(trip.id) && (trip.userId === userId || (trip.sharedWith && trip.sharedWith.includes(userId))))
          .map(async (trip: any) => {
            const remoteSnap = await getDoc(doc(db, "trips", trip.id));
            return remoteSnap.exists() && hasNewerRemoteVersion(trip, remoteSnap.data(), clientId)
              ? { type: "trip", id: trip.id, name: trip.name }
              : null;
          }),
        ...shoppingLists
          .filter((list: any) => dirtyShoppingListIdSet.has(list.id) && (list.userId === userId || (list.sharedWith && list.sharedWith.includes(userId))))
          .map(async (list: any) => {
            const remoteSnap = await getDoc(doc(db, "shopping_lists", list.id));
            return remoteSnap.exists() && hasNewerRemoteVersion(list, remoteSnap.data(), clientId)
              ? { type: "shoppingList", id: list.id, name: list.name }
              : null;
          })
      ];

      const conflicts = (await Promise.all(conflictChecks)).filter(Boolean);
      if (conflicts.length > 0) {
        return {
          success: false,
          conflict: true,
          error: `雲端有較新的資料，已暫停上傳：${conflicts.map((item: any) => item.name || item.id).join("、")}`
        };
      }

      const writes: Array<(batch: ReturnType<typeof writeBatch>) => void> = [
        batch => batch.set(doc(db, "users", userId), {
          schemaVersion: CLOUD_SCHEMA_VERSION,
          lastUpdated: now,
          settings: cleanSettingsData,
          ownedTripIds,
          ownedShoppingListIds,
          data: JSON.stringify(cleanSettingsData)
        })
      ];

      // 2. Sync Trips to 'trips' collection
      // KEY UPDATE: Upload BOTH owned trips AND shared trips that this user has modified
      for (const trip of trips) {
          // If I am the owner OR I am in the sharedWith list
          if (trip.userId === userId || (trip.sharedWith && trip.sharedWith.includes(userId))) {
              writes.push(batch => batch.set(doc(db, "trips", trip.id), stripUndefined({
                ...trip,
                updatedAt: now
              })));
          }
      }
      
      // 3. Sync Shopping Lists to 'shopping_lists' collection
      for (const list of shoppingLists) {
          if (list.userId === userId || (list.sharedWith && list.sharedWith.includes(userId))) {
              writes.push(batch => batch.set(doc(db, "shopping_lists", list.id), stripUndefined({
                ...list,
                updatedAt: now
              })));
          }
      }

      await commitBatches(writes);
      
      return { success: true };
    } catch (error) {
      console.error("Upload failed:", error);
      return { success: false, error };
    }
  },

  download: async (userId: string, currentLocalTrips: any[] = [], currentLocalShoppingLists: any[] = []) => {
    try {
      // 1. Get personal settings
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      let userData: any = {};
      let cloudManifest: any = {};
      
      if (docSnap.exists()) {
        const snapshotData = docSnap.data();
        userData = getUserSettingsFromDoc(snapshotData);
        cloudManifest = snapshotData;
      }

      // 2. Fetch Cloud Trips (Owned + Shared)
      const tripsRef = collection(db, "trips");
      const ownedQuery = query(tripsRef, where("userId", "==", userId));
      const sharedQuery = query(tripsRef, where("sharedWith", "array-contains", userId));
      
      // 3. Fetch Shopping Lists
      const shoppingRef = collection(db, "shopping_lists");
      const shoppingQuery = query(shoppingRef, where("userId", "==", userId));
      const sharedShoppingQuery = query(shoppingRef, where("sharedWith", "array-contains", userId));

      const [ownedDocs, sharedDocs, shoppingDocs, sharedShoppingDocs] = await Promise.all([
          getDocs(ownedQuery),
          getDocs(sharedQuery),
          getDocs(shoppingQuery),
          getDocs(sharedShoppingQuery)
      ]);

      const manifestTripIds = Array.isArray(cloudManifest.ownedTripIds) ? new Set(cloudManifest.ownedTripIds) : null;
      const manifestShoppingListIds = Array.isArray(cloudManifest.ownedShoppingListIds) ? new Set(cloudManifest.ownedShoppingListIds) : null;

      const ownedTrips = ownedDocs.docs
          .map(d => d.data())
          .filter((trip: any) => !manifestTripIds || manifestTripIds.has(trip.id));
      const ownedShoppingLists = shoppingDocs.docs
          .map(d => d.data())
          .filter((list: any) => !manifestShoppingListIds || manifestShoppingListIds.has(list.id));

      const cloudTrips = [
          ...ownedTrips,
          ...sharedDocs.docs.map(d => d.data())
      ];
      
      const cloudShoppingLists = [
          ...ownedShoppingLists,
          ...sharedShoppingDocs.docs.map(d => d.data())
      ];

      // 3. Smart Merge Logic
      const cloudTripMap = new Map(cloudTrips.map((t: any) => [t.id, t]));
      const mergedTrips = [...cloudTrips];

      // Keep local unsynced trips (that are ONLY local, not on cloud yet)
      currentLocalTrips.forEach(localTrip => {
          if (!cloudTripMap.has(localTrip.id) && localTrip.userId === userId) {
              mergedTrips.push(localTrip);
          }
      });

      userData.trips = mergedTrips;
      
      const cloudShoppingMap = new Map(cloudShoppingLists.map((l: any) => [l.id, l]));
      const mergedShoppingLists = [...cloudShoppingLists];
      
      currentLocalShoppingLists.forEach(localList => {
          if (!cloudShoppingMap.has(localList.id) && localList.userId === userId) {
              mergedShoppingLists.push(localList);
          }
      });
      
      userData.shoppingLists = mergedShoppingLists;

      return { success: true, data: userData };
    } catch (error) {
      console.error("Download failed:", error);
      return { success: false, error };
    }
  },

  shareTrip: async (tripId: string, targetUsername: string) => {
      try {
          const userResult = await cloudAuth.findUserByUsername(targetUsername);
          if (!userResult.success || !userResult.userId) return { success: false, error: "找不到該使用者" };

          const tripRef = doc(db, "trips", tripId);
          await updateDoc(tripRef, {
              sharedWith: arrayUnion(userResult.userId)
          });
          
          return { success: true, userId: userResult.userId };
      } catch (error) {
          console.error("Share failed:", error);
          return { success: false, error: "分享失敗，請確認網路或權限" };
      }
  },

  unshareTrip: async (tripId: string, targetUserId: string) => {
      try {
          const tripRef = doc(db, "trips", tripId);
          await updateDoc(tripRef, {
              sharedWith: arrayRemove(targetUserId)
          });
          return { success: true };
      } catch (error) {
          console.error("Unshare failed:", error);
          return { success: false, error: "取消分享失敗" };
      }
  },

  shareShoppingList: async (listId: string, targetUsername: string) => {
      try {
          const userResult = await cloudAuth.findUserByUsername(targetUsername);
          if (!userResult.success || !userResult.userId) return { success: false, error: "找不到該使用者" };

          const listRef = doc(db, "shopping_lists", listId);
          await updateDoc(listRef, {
              sharedWith: arrayUnion(userResult.userId)
          });
          
          return { success: true, userId: userResult.userId };
      } catch (error) {
          console.error("Share failed:", error);
          return { success: false, error: "分享失敗，請確認網路或權限" };
      }
  },

  unshareShoppingList: async (listId: string, targetUserId: string) => {
      try {
          const listRef = doc(db, "shopping_lists", listId);
          await updateDoc(listRef, {
              sharedWith: arrayRemove(targetUserId)
          });
          return { success: true };
      } catch (error) {
          console.error("Unshare failed:", error);
          return { success: false, error: "取消分享失敗" };
      }
  }
};
