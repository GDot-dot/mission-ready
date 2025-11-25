import React, { useState } from 'react';
import { User } from '../types';
import { UserCheck, UserPlus, LogIn, Lock, Cloud } from 'lucide-react';
import { cloudAuth } from '../firebaseConfig';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('請輸入帳號與密碼');
      setIsLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        // 雲端註冊
        const result = await cloudAuth.register(username, password);
        if (result.success && result.userId) {
          // 註冊成功後自動登入
          localStorage.setItem('mission_ready_active_user_id', result.userId);
          // 同時保存一個本地使用者紀錄，以便離線時也能識別
          const storedUsers = JSON.parse(localStorage.getItem('mission_ready_users') || '[]');
          if (!storedUsers.some((u: any) => u.username === username)) {
             localStorage.setItem('mission_ready_users', JSON.stringify([...storedUsers, {
               id: result.userId, username, password
             }]));
          }
          onLogin({ id: result.userId, username: username });
        } else {
          setError(result.error || '註冊失敗');
        }
      } else {
        // 雲端登入
        const result = await cloudAuth.login(username, password);
        if (result.success && result.userId) {
          localStorage.setItem('mission_ready_active_user_id', result.userId);
          onLogin({ id: result.userId, username: username });
        } else {
          // 如果雲端失敗，嘗試本地登入 (作為備援)
          const storedUsers = JSON.parse(localStorage.getItem('mission_ready_users') || '[]');
          const localUser = storedUsers.find((u: any) => u.username === username && u.password === password);
          if (localUser) {
             console.log('Cloud login failed, using local credentials');
             onLogin({ id: localUser.id, username: localUser.username });
          } else {
             setError(result.error || '帳號或密碼錯誤');
          }
        }
      }
    } catch (err) {
      setError('連線發生錯誤，請檢查網路');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Mission Ready</h1>
          <p className="text-slate-500 flex items-center justify-center gap-1">
            出差裝備檢查清單
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Cloud size={10} /> Cloud Sync
            </span>
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => { setIsRegistering(false); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isRegistering ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            登入
          </button>
          <button
            onClick={() => { setIsRegistering(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isRegistering ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            註冊新帳號
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">帳號</label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-900"
                placeholder="輸入您的帳號"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密碼</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-900"
                placeholder="輸入您的密碼"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? '處理中...' : (isRegistering ? '建立雲端帳號' : '登入系統')}
          </button>
        </form>
      </div>
    </div>
  );
};