// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// TODO: 請將您的 Firebase Config 貼在這裡 (覆蓋下方內容)
const firebaseConfig = {
  apiKey: "AIzaSyD...", // 把您網頁上複製的那一整段貼過來
  authDomain: "mission-ready-xxx.firebaseapp.com",
  projectId: "mission-ready-xxx",
  storageBucket: "mission-ready-xxx.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
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