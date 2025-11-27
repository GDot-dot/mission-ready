import firebase from "firebase/compat/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";

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
  // New: Find user ID by username for sharing
  findUserByUsername: async (username: string) => {
      try {
          const accountRef = doc(db, "user_accounts", username);
          const snap = await getDoc(accountRef);
          if (snap.exists()) return { success: true, userId: snap.data().userId };
          return { success: false, error: "找不到此使用者" };
      } catch (error) {
          return { success: false, error: "搜尋失敗" };
      }
  }
};

export const cloudSync = {
  // Upload: Save personal data AND sync individual trips to 'trips' collection
  upload: async (userId: string, data: any) => {
    try {
      // 1. Save personal inventory/settings
      const { trips, ...settingsData } = data;
      await setDoc(doc(db, "users", userId), {
        lastUpdated: new Date().toISOString(),
        data: JSON.stringify(settingsData) // Only save settings, inventory, categories here
      });

      // 2. Save Trips individually to 'trips' collection for sharing
      const tripsCollection = collection(db, "trips");
      for (const trip of trips) {
          // Only upload trips owned by this user
          if (trip.userId === userId) {
              await setDoc(doc(db, "trips", trip.id), trip);
          }
      }
      return { success: true };
    } catch (error) {
      console.error("Upload failed:", error);
      return { success: false, error };
    }
  },

  // Download: Get settings AND fetch all relevant trips (owned + shared)
  download: async (userId: string) => {
    try {
      // 1. Get personal settings
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      let userData: any = {};
      
      if (docSnap.exists()) {
        userData = JSON.parse(docSnap.data().data);
      }

      // 2. Get Owned Trips
      const tripsRef = collection(db, "trips");
      const ownedQuery = query(tripsRef, where("userId", "==", userId));
      const ownedDocs = await getDocs(ownedQuery);
      const ownedTrips = ownedDocs.docs.map(d => d.data());

      // 3. Get Shared Trips
      const sharedQuery = query(tripsRef, where("sharedWith", "array-contains", userId));
      const sharedDocs = await getDocs(sharedQuery);
      const sharedTrips = sharedDocs.docs.map(d => d.data());

      // Combine
      userData.trips = [...ownedTrips, ...sharedTrips];

      return { success: true, data: userData };
    } catch (error) {
      console.error("Download failed:", error);
      return { success: false, error };
    }
  },

  // Share a trip
  shareTrip: async (tripId: string, targetUsername: string) => {
      try {
          // 1. Find target user ID
          const userResult = await cloudAuth.findUserByUsername(targetUsername);
          if (!userResult.success || !userResult.userId) return { success: false, error: "找不到該使用者" };

          // 2. Update trip document
          const tripRef = doc(db, "trips", tripId);
          await updateDoc(tripRef, {
              sharedWith: arrayUnion(userResult.userId)
          });
          
          return { success: true };
      } catch (error) {
          return { success: false, error: "分享失敗" };
      }
  }
};