'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AutoCloseOverlayProps {
  shouldClose: boolean;
  message: string;
  countdown?: number;
}

export function AutoCloseOverlay({ shouldClose, message, countdown = 5 }: AutoCloseOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(countdown);
  const [closeAttempted, setCloseAttempted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!shouldClose) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          attemptClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [shouldClose]);

  const attemptClose = () => {
    setCloseAttempted(true);
    
    // Method 1: Try standard window.close()
    try {
      window.close();
      
      // If close succeeds, this code won't run
      // If it fails, wait 2 seconds then try fallback
      setTimeout(() => {
        tryFallbackClose();
      }, 2000);
      
    } catch (error) {
      console.log('Standard close failed:', error);
      tryFallbackClose();
    }
  };

  const tryFallbackClose = () => {
    // Method 2: Try the self-replacement trick
    try {
      const newWindow = window.open('', '_self');
      if (newWindow) {
        newWindow.close();
        
        // If that also fails, redirect after short delay
        setTimeout(() => {
          router.push('/transfer-complete?message=' + encodeURIComponent(message));
        }, 2000);
      }
    } catch (error) {
      console.log('Fallback close failed:', error);
      // Final fallback: redirect
      router.push('/transfer-complete?message=' + encodeURIComponent(message));
    }
  };

  const handleManualClose = () => {
    attemptClose();
  };

  if (!shouldClose) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl border">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">✅</span>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Transfer Complete!</h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {message}
          </p>
          
          {!closeAttempted ? (
            <>
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-700 font-medium mb-2">
                  This tab will close automatically in {timeLeft} seconds...
                </p>
                <div className="bg-green-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all duration-1000 ease-linear"
                    style={{ 
                      width: `${(timeLeft / countdown) * 100}%`
                    }}
                  />
                </div>
              </div>
              
              <button
                onClick={handleManualClose}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Close Now
              </button>
            </>
          ) : (
            <>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700 font-medium mb-2">
                  🔄 Attempting to close tab automatically...
                </p>
                <p className="text-xs text-blue-600">
                  If the tab doesn't close in a few seconds, please close it manually or click below.
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/transfer-complete?message=' + encodeURIComponent(message))}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Continue to Thank You Page
                </button>
                
                <button
                  onClick={handleManualClose}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                >
                  Try Close Again
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                💡 Some browsers prevent automatic tab closure for security. Please close manually if needed.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
