import firebase from "firebase/compat/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

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

export const cloudAuth = {
  register: async (username: string, password: string) => {
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
  login: async (username: string, password: string) => {
    try {
      const accountRef = doc(db, "user_accounts", username);
      const accountSnap = await getDoc(accountRef);
      if (!accountSnap.exists()) return { success: false, error: "帳號不存在" };
      
      const data = accountSnap.data();
      if (data.password !== password) return { success: false, error: "密碼錯誤" };
      return { success: true, userId: data.userId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  findUserByUsername: async (username: string) => {
      try {
          const accountRef = doc(db, "user_accounts", username);
          const snap = await getDoc(accountRef);
          if (snap.exists()) return { success: true, userId: snap.data().userId };
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
          return { success: false, error: "Unknown" };
      } catch (error) {
          return { success: false, error: "Error" };
      }
  }
};

export const cloudSync = {
  upload: async (userId: string, data: any) => {
    try {
      const { trips, ...settingsData } = data;
      
      // Safety check: Prevent uploading empty inventory over existing data
      if (!settingsData.inventory || settingsData.inventory.length === 0) {
          const docRef = doc(db, "users", userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              const cloudData = JSON.parse(docSnap.data().data);
              if (cloudData.inventory && cloudData.inventory.length > 0) {
                  return { success: false, error: "本地物品庫為空，為防止誤刪，已取消上傳。請先執行下載。" };
              }
          }
      }

      // 1. Save user settings (inventory, folders, etc.)
      await setDoc(doc(db, "users", userId), {
        lastUpdated: new Date().toISOString(),
        data: JSON.stringify(settingsData)
      });

      // 2. Sync Trips to 'trips' collection
      // KEY UPDATE: Upload BOTH owned trips AND shared trips that this user has modified
      for (const trip of trips) {
          // If I am the owner OR I am in the sharedWith list
          if (trip.userId === userId || (trip.sharedWith && trip.sharedWith.includes(userId))) {
              await setDoc(doc(db, "trips", trip.id), trip);
          }
      }
      return { success: true };
    } catch (error) {
      console.error("Upload failed:", error);
      return { success: false, error };
    }
  },

  download: async (userId: string, currentLocalTrips: any[] = []) => {
    try {
      // 1. Get personal settings
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      let userData: any = {};
      
      if (docSnap.exists()) {
        userData = JSON.parse(docSnap.data().data);
      }

      // 2. Fetch Cloud Trips (Owned + Shared)
      const tripsRef = collection(db, "trips");
      const ownedQuery = query(tripsRef, where("userId", "==", userId));
      const sharedQuery = query(tripsRef, where("sharedWith", "array-contains", userId));
      
      const [ownedDocs, sharedDocs] = await Promise.all([
          getDocs(ownedQuery),
          getDocs(sharedQuery)
      ]);

      const cloudTrips = [
          ...ownedDocs.docs.map(d => d.data()),
          ...sharedDocs.docs.map(d => d.data())
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
  }
};
