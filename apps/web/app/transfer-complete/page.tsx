'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function TransferCompletePage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Transfer completed successfully';
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.close(); // Try to close
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl p-8 text-center">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">✅</span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Transfer Complete!</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-2">This tab will close automatically in:</p>
          <div className="text-3xl font-bold text-green-600">{countdown}</div>
        </div>
        
        <button
          onClick={() => window.close()}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Close Now
        </button>
        
        <p className="text-xs text-gray-400 mt-4">
          If the tab doesn't close automatically, please close it manually.
        </p>
      </div>
    </div>
  );
}
