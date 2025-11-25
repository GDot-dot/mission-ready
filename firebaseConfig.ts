import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // 暫時移除以避免錯誤
const db = getFirestore(app);

// 雲端同步功能
export const cloudSync = {
  // 上傳資料
  upload: async (userId: string, data: any) => {
    try {
      await setDoc(doc(db, "users", userId), {
        lastUpdated: new Date().toISOString(),
        data: JSON.stringify(data)
      });
      return { success: true };
    } catch (error) {
      console.error("Upload failed:", error);
      return { success: false, error };
    }
  },

  // 下載資料
  download: async (userId: string) => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const rawData = docSnap.data().data;
        return { success: true, data: JSON.parse(rawData) };
      } else {
        return { success: false, error: "No data found" };
      }
    } catch (error) {
      console.error("Download failed:", error);
      return { success: false, error };
    }
  }
};