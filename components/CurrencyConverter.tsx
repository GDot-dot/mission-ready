import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';

interface CurrencyConverterProps {
  onBack: () => void;
}

const CURRENCIES = [
  { code: 'USD', name: '美金' },
  { code: 'JPY', name: '日圓' },
  { code: 'EUR', name: '歐元' },
  { code: 'KRW', name: '韓元' },
  { code: 'GBP', name: '英鎊' },
  { code: 'AUD', name: '澳幣' },
  { code: 'CAD', name: '加幣' },
  { code: 'SGD', name: '新加坡幣' },
  { code: 'HKD', name: '港幣' }
];

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ onBack }) => {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('100');
  const [baseCurrency, setBaseCurrency] = useState<string>('JPY');
  const [copied, setCopied] = useState(false);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    try {
      // Using ExchangeRate-API (free, no key required for basic usage)
      const response = await fetch('https://open.er-api.com/v6/latest/TWD');
      if (!response.ok) throw new Error('Failed to fetch rates');
      const data = await response.json();
      setRates(data.rates);
    } catch (err) {
      setError('無法取得最新匯率，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateTWD = () => {
    if (!rates[baseCurrency] || !amount || isNaN(Number(amount))) return 0;
    // rates[baseCurrency] is how much foreign currency for 1 TWD
    // So TWD = Foreign / rates[Foreign]
    return (Number(amount) / rates[baseCurrency]).toFixed(2);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
            <ArrowLeft size={20} className="mr-1" /> 回到儀表板
          </button>
          <button 
            onClick={fetchRates} 
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            更新匯率
          </button>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">匯率換算</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          參考匯率，實際金額以刷卡或兌換當下為準。
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">外幣金額</label>
            <div className="flex gap-2">
              <select 
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="w-1/3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} ({c.name})</option>
                ))}
              </select>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-2/3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                placeholder="輸入金額..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">約合台幣 (TWD)</label>
            <div className="relative">
              <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-blue-700 dark:text-blue-400 text-xl font-bold flex items-center justify-between">
                <span>NT$ {loading ? '...' : calculateTWD()}</span>
                <button 
                  onClick={() => handleCopy(calculateTWD())}
                  className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-lg transition-colors"
                  title="複製金額"
                >
                  {copied ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">常用匯率參考 (1 TWD =)</h3>
        {loading ? (
          <div className="text-center py-8 text-slate-400">載入中...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CURRENCIES.map(c => (
              <div key={c.code} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{c.code}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {rates[c.code] ? rates[c.code].toFixed(4) : '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
