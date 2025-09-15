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
import { getToken, completeTransfer } from '@/lib/livekit';
import { MessageSquare, PhoneCall, UserCheck } from 'lucide-react';

export default function AgentBPage() {
  const [token, setToken] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [agentIdentity, setAgentIdentity] = useState<string>('');
  const [consultationRoom, setConsultationRoom] = useState<string>('');
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [phase, setPhase] = useState<'waiting' | 'consultation' | 'main_call'>('waiting');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setConsultationRoom(room);
    }
  }, []);

  useEffect(() => {
    setAgentIdentity(`agent-b-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  const handleJoinConsultation = async () => {
    if (!consultationRoom) {
      const room = prompt('Enter consultation room name (from Agent A):');
      if (!room) return;
      setConsultationRoom(room);
    }

    setConnecting(true);
    try {
      const tokenData = await getToken(consultationRoom, agentIdentity, 'agent');
      setToken(tokenData.token);
      setCurrentRoom(consultationRoom);
      setPhase('consultation');
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect to consultation room');
    } finally {
      setConnecting(false);
    }
  };

 
const handleTakeOverCall = async () => {
  setConnecting(true);
  try {
    console.log('🔄 Agent B taking over main call...');
    
    // Clean disconnect from consultation room
    setToken('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get fresh token for main room
    const tokenData = await getToken('room-a', agentIdentity, 'agent');
    console.log('✅ Agent B got token for room-a');
    
    setToken(tokenData.token);
    setCurrentRoom('room-a');
    setPhase('main_call');
    
    // Send enhanced close signal to Agent A tabs
    const closeSignal = {
      action: 'close_agent_a_tabs',
      agentId: agentIdentity,
      timestamp: Date.now(),
      message: 'Transfer complete! Agent B has successfully taken over the call. Agent A tabs will close automatically.'
    };
    
    // Send signal via localStorage
    localStorage.setItem('agent_transfer_signal', JSON.stringify(closeSignal));
    
    // Also trigger storage event manually for same-tab detection
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'agent_transfer_signal',
      newValue: JSON.stringify(closeSignal),
      url: window.location.href
    }));
    
    // Clean up signal after 10 seconds
    setTimeout(() => {
      localStorage.removeItem('agent_transfer_signal');
    }, 10000);
    
    console.log('📡 Close signal sent to Agent A tabs');
    
    // Show user-friendly message
    alert('✅ Transfer complete!\n\n' + 
          'You have successfully taken over the call from Agent A.\n' + 
          'Agent A\'s tabs will close automatically.\n\n' + 
          'You can now assist the customer directly.');
    
  } catch (error) {
    console.error('Failed to complete transfer:', error);
    alert('⚠️ Transfer encountered an issue, but you may still be connected to the call.');
  } finally {
    setConnecting(false);
  }
};


  if (!token) {
    return (
      <Layout 
        title="Agent B Interface" 
        subtitle="Specialist Support Agent - Ready to Assist"
        variant="agent-b"
      >
        <div className="max-w-2xl mx-auto">
          <ActionCard
            title="Join Consultation"
            description="Connect to consultation room for warm transfer briefing"
            icon={<MessageSquare className="h-5 w-5 text-purple-600" />}
            variant="info"
          >
            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-600">Agent ID:</span>
                    <p className="font-mono text-slate-800 truncate">{agentIdentity}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Consultation Room:</span>
                    <p className="font-mono text-slate-800">{consultationRoom || 'Not set'}</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleJoinConsultation}
                disabled={connecting}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                {connecting ? 'Connecting...' : 'Join Consultation Room'}
              </Button>
              
              <p className="text-xs text-slate-500 text-center">
                Join consultation room first to get briefed by Agent A
              </p>
            </div>
          </ActionCard>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="Agent B Interface" 
      subtitle={`${phase === 'consultation' ? 'Getting Briefed by Agent A' : phase === 'main_call' ? 'Handling Customer Call' : 'Ready to Assist'}`}
      variant="agent-b"
    >
      {/* KEY: LiveKitRoom is DIRECT child of Layout - same as Caller page */}
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        className="h-0 "
      >
        <AgentBInterface 
          agentIdentity={agentIdentity} 
          currentRoom={currentRoom}
          phase={phase}
          onTakeOverCall={handleTakeOverCall}
          connecting={connecting}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </Layout>
  );
}

function AgentBInterface({ 
  agentIdentity, 
  currentRoom, 
  phase, 
  onTakeOverCall, 
  connecting 
}: { 
  agentIdentity: string;
  currentRoom: string;
  phase: string;
  onTakeOverCall: () => void;
  connecting: boolean;
}) {
  const connectionState = useConnectionState();
  const participants = useParticipants(); // This will now work correctly!

  const respondToSummary = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || voice.name.includes('Samantha')
      );
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 bg-white">
      {/* Status & Participants - Same as Caller */}
      <div className="xl:col-span-1 space-y-6">
        <StatusCard
          connectionState={connectionState}
          room={currentRoom}
          identity={agentIdentity}
          participantCount={participants.length}
          phase={phase}
        />
        
        <ParticipantList 
          participants={participants} 
          currentIdentity={agentIdentity}
          phase={phase}
        />
      </div>

      {/* Main Content - Same structure as Caller */}
      <div className="xl:col-span-2 space-y-6 ">
        {phase === 'consultation' && (
          <ActionCard
            title="Consultation Phase"
            description="Listen to Agent A's briefing about the caller's situation."
            icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
            variant="info"
          >
            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                <h4 className="font-medium text-slate-800 mb-2">Instructions:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Listen carefully to Agent A's briefing</li>
                  <li>• Ask clarifying questions if needed</li>
                  <li>• Acknowledge when you're ready to take over</li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => respondToSummary("Thank you Agent A, I understand the situation. I'm ready to take over the call.")}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <span>🔊</span>
                  <span>Acknowledge Briefing</span>
                </Button>
              </div>
              
              <Button
                onClick={onTakeOverCall}
                disabled={connecting}
                className="w-full h-11"
              >
                {connecting ? 'Taking Over...' : 'Take Over Main Call'}
              </Button>
            </div>
          </ActionCard>
        )}

        {phase === 'main_call' && (
          <ActionCard
            title="Customer Call Active"
            description="You are now handling the customer's request. Agent A has left the call."
            icon={<PhoneCall className="h-5 w-5 text-emerald-600" />}
            variant="success"
          >
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <PhoneCall className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Transfer Complete!</h3>
              <p className="text-slate-600">You are now the primary agent handling this customer call.</p>
            </div>
          </ActionCard>
        )}

        {phase === 'waiting' && (
          <ActionCard
            title="Waiting for Transfer"
            description="Ready to assist with warm transfer when needed."
            icon={<UserCheck className="h-5 w-5 text-purple-600" />}
            variant="default"
          >
            <div className="text-center py-8 text-slate-500">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <UserCheck className="h-8 w-8 text-slate-400" />
              </div>
              <p>Waiting for consultation request...</p>
            </div>
          </ActionCard>
        )}
      </div>
    </div>
  );
}
