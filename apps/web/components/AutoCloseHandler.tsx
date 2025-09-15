'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AutoCloseHandlerProps {
  shouldClose: boolean;
  message?: string;
  delay?: number;
}

export function AutoCloseHandler({ shouldClose, message = "Transfer complete", delay = 3000 }: AutoCloseHandlerProps) {
  const router = useRouter();

  useEffect(() => {
    if (!shouldClose) return;

    const timer = setTimeout(() => {
      // Try to close tab (works if opened via window.open)
      try {
        window.close();
      } catch (error) {
        // Fallback: redirect to thank you page
        router.push('/transfer-complete?message=' + encodeURIComponent(message));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [shouldClose, message, delay, router]);

  if (!shouldClose) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md mx-4">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Transfer Complete</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          <p className="text-sm text-gray-500">This tab will close automatically...</p>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{width: '100%'}} />
          </div>
        </div>
      </div>
    </div>
  );
}
