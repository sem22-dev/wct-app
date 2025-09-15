'use client';

import { useState, useEffect } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useConnectionState, useParticipants } from '@livekit/components-react';
import '@livekit/components-styles';
import { ConnectionState } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/ui/layout';
import { StatusCard } from '@/components/ui/status-card';
import { ParticipantList } from '@/components/ui/participant-list';
import { ActionCard } from '@/components/ui/action-card';
import { getToken } from '@/lib/livekit';
import { Phone, PhoneCall } from 'lucide-react';

export default function CallerPage() {
  const [token, setToken] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [callerIdentity, setCallerIdentity] = useState<string>('');
  const [roomName] = useState('room-a');

   useEffect(() => {
    setCallerIdentity(`caller-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const tokenData = await getToken(roomName, callerIdentity, 'caller');
      setToken(tokenData.token);
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect to room');
    } finally {
      setConnecting(false);
    }
  };

  if (!token) {
    return (
      <Layout 
        title="Caller Interface" 
        subtitle="LiveKit Warm Transfer Demo - Customer Support"
        variant="caller"
      >
        <div className="max-w-2xl mx-auto">
          <ActionCard
            title="Join Support Call"
            description="Connect with our support team for assistance with your inquiry"
            icon={<Phone className="h-5 w-5 text-blue-600" />}
            variant="info"
          >
            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-600">Room:</span>
                    <p className="font-mono text-slate-800">{roomName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Your ID:</span>
                    <p className="font-mono text-slate-800 truncate">{callerIdentity}</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleConnect}
                disabled={connecting}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                {connecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <PhoneCall className="h-5 w-5 mr-2" />
                    Join Support Call
                  </>
                )}
              </Button>
            </div>
          </ActionCard>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="Caller Interface" 
      subtitle="Connected to Support - Please wait for assistance"
      variant="caller"
    >
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        className="h-0" // Hide default UI
      >
        <CallerInterface callerIdentity={callerIdentity} roomName={roomName} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </Layout>
  );
}

function CallerInterface({ callerIdentity, roomName }: { callerIdentity: string, roomName: string }) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const hasAgent = participants.some(p => p.identity.startsWith('agent-'));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white">
      {/* Status Column */}
      <div className="lg:col-span-1 space-y-6">
        <StatusCard
          connectionState={connectionState}
          room={roomName}
          identity={callerIdentity}
          participantCount={participants.length}
        />
        
        <ParticipantList 
          participants={participants} 
          currentIdentity={callerIdentity}
        />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-2">
        <ActionCard
          title={hasAgent ? "Connected to Support Agent" : "Waiting for Support Agent"}
          description={hasAgent ? "An agent is now assisting you" : "Please hold while we connect you"}
          icon={hasAgent ? <PhoneCall className="h-6 w-6 text-emerald-600" /> : <Phone className="h-6 w-6 text-blue-600" />}
          variant={hasAgent ? "success" : "info"}
        >
          <div className="text-center py-8">
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
              hasAgent ? 'bg-emerald-100' : 'bg-blue-100'
            }`}>
              <span className="text-4xl">
                {hasAgent ? '🎧' : '📞'}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              {hasAgent ? 'Support Agent Connected!' : 'Connecting to Support...'}
            </h2>
            
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {hasAgent 
                ? 'Your support agent is ready to help. Please describe your issue.'
                : 'Our next available agent will be with you shortly. Thank you for your patience.'
              }
            </p>

            {!hasAgent && (
              <div className="flex justify-center items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                <span className="text-sm font-medium">Waiting in queue...</span>
              </div>
            )}
          </div>
        </ActionCard>
      </div>
    </div>
  );
}


