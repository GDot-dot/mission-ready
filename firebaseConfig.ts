import firebase from "firebase/compat/app";
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
const app = firebase.initializeApp(firebaseConfig);
const db = getFirestore(app as any);

// 雲端帳號驗證功能
export const cloudAuth = {
  // 註冊/綁定使用者
  register: async (username: string, password: string): Promise<{success: boolean, userId?: string, error?: string}> => {
    try {
      // 檢查帳號是否已存在
      const accountRef = doc(db, "user_accounts", username);
      const accountSnap = await getDoc(accountRef);

      if (accountSnap.exists()) {
        return { success: false, error: "此帳號已被註冊" };
      }

      // 建立新帳號，綁定一個隨機的 User ID
      const newUserId = Math.random().toString(36).substring(2, 15);
      await setDoc(accountRef, {
        password: password, // 注意：實際產品應加密，此為簡易版
        userId: newUserId,
        createdAt: new Date().toISOString()
      });

      return { success: true, userId: newUserId };
    } catch (error: any) {
      console.error("Register failed:", error);
      return { success: false, error: error.message };
    }
  },

  // 登入驗證
  login: async (username: string, password: string): Promise<{success: boolean, userId?: string, error?: string}> => {
    try {
      const accountRef = doc(db, "user_accounts", username);
      const accountSnap = await getDoc(accountRef);

      if (!accountSnap.exists()) {
        return { success: false, error: "帳號不存在" };
      }

      const data = accountSnap.data();
      if (data.password !== password) {
        return { success: false, error: "密碼錯誤" };
      }

      return { success: true, userId: data.userId };
    } catch (error: any) {
      console.error("Login failed:", error);
      return { success: false, error: error.message };
    }
  }
};

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