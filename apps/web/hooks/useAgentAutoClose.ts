import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CloseSignal {
  action: string;
  agentId: string;
  timestamp: number;
  message: string;
}

export function useAgentAutoClose(agentIdentity: string, role: 'agent-a' | 'agent-b' = 'agent-a') {
  const [shouldClose, setShouldClose] = useState(false);
  const [closeMessage, setCloseMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (role !== 'agent-a') return; // Only Agent A should listen for close signals

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'agent_transfer_signal' && event.newValue) {
        try {
          const data: CloseSignal = JSON.parse(event.newValue);
          
          // Check if signal is for this agent and is recent (within 30 seconds)
          const isRecentSignal = Date.now() - data.timestamp < 30000;
          const isForThisAgent = data.action === 'close_agent_a_tabs';
          
          if (isRecentSignal && isForThisAgent) {
            console.log('🔄 Received close signal from Agent B');
            setCloseMessage(data.message);
            setShouldClose(true);
            
            // Clean up the signal
            localStorage.removeItem('agent_transfer_signal');
            
            // Auto-close after 3 seconds
            setTimeout(() => {
              try {
                window.close(); // Try to close tab
              } catch (error) {
                console.log('Cannot close tab automatically, redirecting...');
                router.push('/transfer-complete?message=' + encodeURIComponent(data.message));
              }
            }, 3000);
          }
        } catch (error) {
          console.error('Error parsing close signal:', error);
        }
      }
    };

    // Listen for localStorage changes from other tabs
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [agentIdentity, role, router]);

  return { shouldClose, closeMessage };
}
