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
import { AutoCloseOverlay } from '@/components/AutoCloseOverlay';
import { ContextModal } from '@/components/ui/context-modal';
import { CopyLink } from '@/components/ui/copy-link';
import { useAgentAutoClose } from '@/hooks/useAgentAutoClose';
import { getToken, initiateTransfer, holdCaller } from '@/lib/livekit';
import { UserCheck, ArrowRightLeft, ExternalLink } from 'lucide-react';

export default function AgentAPage() {
  const [token, setToken] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [agentIdentity, setAgentIdentity] = useState<string>('');
  const [roomName] = useState('room-a');
  const [transferring, setTransferring] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [consultationRoom, setConsultationRoom] = useState<string>('');
  const [transferStep, setTransferStep] = useState<'idle' | 'initiated' | 'consulting'>('idle');
  
  // Context modal state
  const [showContextModal, setShowContextModal] = useState(false);

  // Generate identity only on client-side to prevent hydration mismatch
  useEffect(() => {
    setAgentIdentity(`agent-a-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // Auto-close hook
  const { shouldClose, closeMessage } = useAgentAutoClose(agentIdentity, 'agent-a');

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const tokenData = await getToken(roomName, agentIdentity, 'agent');
      setToken(tokenData.token);
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect to room');
    } finally {
      setConnecting(false);
    }
  };

  // Show loading state until identity is generated
  if (!agentIdentity) {
    return (
      <Layout 
        title="Agent A Interface" 
        subtitle="Loading..."
        variant="agent-a"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
          <span className="ml-3 text-slate-600">Initializing Agent A...</span>
        </div>
        
        {/* Auto-close overlay */}
        <AutoCloseOverlay shouldClose={shouldClose} message={closeMessage} countdown={5} />
      </Layout>
    );
  }

  if (!token) {
    return (
      <Layout 
        title="Agent A Interface" 
        subtitle="Primary Support Agent - Customer Service"
        variant="agent-a"
      >
        <div className="max-w-2xl mx-auto">
          <ActionCard
            title="Join Support Room"
            description="Connect to assist customers with their inquiries"
            icon={<UserCheck className="h-5 w-5 text-orange-600" />}
            variant="warning"
          >
            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-orange-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-600">Room:</span>
                    <p className="font-mono text-slate-800">{roomName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Agent ID:</span>
                    <p className="font-mono text-slate-800 truncate" suppressHydrationWarning>
                      {agentIdentity}
                    </p>
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
                    <UserCheck className="h-5 w-5 mr-2" />
                    Join as Agent A
                  </>
                )}
              </Button>
            </div>
          </ActionCard>
        </div>
        
        {/* Auto-close overlay */}
        <AutoCloseOverlay shouldClose={shouldClose} message={closeMessage} countdown={5} />
      </Layout>
    );
  }

  return (
    <Layout 
      title="Agent A Interface" 
      subtitle="Handling Customer Support - Ready for Transfer"
      variant="agent-a"
    >
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        className="h-0"
      >
        <AgentAInterface 
          agentIdentity={agentIdentity} 
          roomName={roomName}
          transferring={transferring}
          setTransferring={setTransferring}
          summary={summary}
          setSummary={setSummary}
          consultationRoom={consultationRoom}
          setConsultationRoom={setConsultationRoom}
          transferStep={transferStep}
          setTransferStep={setTransferStep}
          showContextModal={showContextModal}
          setShowContextModal={setShowContextModal}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
      
      {/* Auto-close overlay */}
      <AutoCloseOverlay shouldClose={shouldClose} message={closeMessage} countdown={5} />
    </Layout>
  );
}

function AgentAInterface({ 
  agentIdentity, 
  roomName,
  transferring,
  setTransferring,
  summary,
  setSummary,
  consultationRoom,
  setConsultationRoom,
  transferStep,
  setTransferStep,
  showContextModal,
  setShowContextModal
}: {
  agentIdentity: string;
  roomName: string;
  transferring: boolean;
  setTransferring: (value: boolean) => void;
  summary: string;
  setSummary: (value: string) => void;
  consultationRoom: string;
  setConsultationRoom: (value: string) => void;
  transferStep: 'idle' | 'initiated' | 'consulting';
  setTransferStep: (value: 'idle' | 'initiated' | 'consulting') => void;
  showContextModal: boolean;
  setShowContextModal: (value: boolean) => void;
}) {
  const connectionState = useConnectionState();
  const participants = useParticipants();

  // Handle transfer initiation - now opens modal instead of prompt
  const handleTransfer = async () => {
    // Find caller participant
    const caller = participants.find(p => p.identity.startsWith('caller-'));
    if (!caller) {
      alert('No caller found to transfer');
      return;
    }

    // Show context modal instead of browser prompt
    setShowContextModal(true);
  };

  // Handle context submission from modal
  const handleContextSubmit = async (context: string) => {
    setTransferring(true);
    
    try {
      const caller = participants.find(p => p.identity.startsWith('caller-'));
      
      // Step 1: Initiate transfer with context from modal
      const transferData = await initiateTransfer(roomName, caller.identity, agentIdentity, context);
      setSummary(transferData.summary);
      setConsultationRoom(transferData.consultation_room);
      setTransferStep('initiated');
      
      // Step 2: Place caller on hold
      await holdCaller(caller.identity, roomName, true);
      
      // Success message with context
      alert(`✅ Transfer initiated successfully!\n\nConsultation Room: ${transferData.consultation_room}\n\nContext provided: "${context}"\n\nYou will now join the consultation room to brief Agent B with the AI-generated summary.`);
      
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('❌ Failed to initiate transfer. Please try again.');
    } finally {
      setTransferring(false);
    }
  };

  const joinConsultation = async () => {
    if (!consultationRoom) return;
    
    try {
      // Agent A joins consultation room
      const consultUrl = `/agent-consultation?room=${consultationRoom}&summary=${encodeURIComponent(summary)}&identity=${agentIdentity}`;
      window.open(consultUrl, '_blank');
      setTransferStep('consulting');
    } catch (error) {
      console.error('Failed to join consultation:', error);
      alert('Failed to join consultation room');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Status & Participants */}
      <div className="xl:col-span-1 space-y-6">
        <StatusCard
          connectionState={connectionState}
          room={roomName}
          identity={agentIdentity}
          participantCount={participants.length}
          phase={transferStep}
        />
        
        <ParticipantList 
          participants={participants} 
          currentIdentity={agentIdentity}
          phase={transferStep}
        />
      </div>

      {/* Main Content */}
      <div className="xl:col-span-2 space-y-6">
        {/* Transfer Actions */}
        {transferStep === 'idle' && (
          <ActionCard
            title="Warm Transfer Options"
            description="Need to escalate this call? Transfer the caller to a specialist agent with full context."
            icon={<ArrowRightLeft className="h-5 w-5 text-red-600" />}
            variant="warning"
          >
            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-amber-100">
                <h4 className="font-medium text-slate-800 mb-2">Transfer Requirements:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• At least one caller must be present</li>
                  <li>• Agent B must be available for consultation</li>
                  <li>• Call context will be provided via professional modal</li>
                  <li>• AI summary will be generated automatically</li>
                  <li>• Consultation room will be created for briefing</li>
                </ul>
              </div>
              
              <Button
                onClick={handleTransfer} // Opens modal instead of prompt
                disabled={transferring || participants.length < 2}
                className="w-full h-11"
                variant="destructive"
              >
                {transferring ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Initiating Transfer...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Initiate Warm Transfer
                  </>
                )}
              </Button>
            </div>
          </ActionCard>
        )}

        {/* Transfer in Progress */}
        {transferStep === 'initiated' && consultationRoom && (
          <ActionCard
            title="Transfer in Progress"
            description="Caller is on hold. Join consultation room to brief Agent B with AI-generated summary."
            icon={<ExternalLink className="h-5 w-5 text-blue-600" />}
            variant="info"
          >
            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-600">Consultation Room:</span>
                    <p className="font-mono text-slate-800">{consultationRoom}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Status:</span>
                    <p className="text-amber-600 font-medium">Caller on Hold</p>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={joinConsultation}
                className="w-full h-11"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Join Consultation Room
              </Button>
              
              {/* Enhanced copy link section */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="mb-3">
                  <h4 className="font-semibold text-slate-800 mb-1">Share with Agent B:</h4>
                  <p className="text-xs text-slate-500">Agent B should join this consultation room</p>
                </div>
                
                <CopyLink room={consultationRoom} />
              </div>
            </div>
          </ActionCard>
        )}

        {/* Consultation Active */}
        {transferStep === 'consulting' && (
          <ActionCard
            title="Consultation Active"
            description="You are now in consultation with Agent B. Use TTS to brief them about the caller's situation."
            icon={<ExternalLink className="h-5 w-5 text-emerald-600" />}
            variant="success"
          >
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-2">Consultation Instructions:</h4>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>• Use "Brief Agent B" button to speak the AI summary with Daniel's voice</li>
                  <li>• Provide additional context about the customer's situation</li>
                  <li>• Wait for Agent B to acknowledge understanding with female voice</li>
                  <li>• Your tabs will close automatically after Agent B takes over</li>
                </ul>
              </div>
            </div>
          </ActionCard>
        )}

        {/* AI Summary Display */}
        {summary && (
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border-blue-200/50 shadow-xl rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <span className="text-blue-600">🤖</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">AI-Generated Call Summary</h3>
                <p className="text-xs text-slate-500">Ready for Agent B briefing via TTS</p>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
            </div>
            
            <div className="mt-4 text-xs text-slate-500">
              💡 This summary will be spoken to Agent B in the consultation room using Daniel's voice
            </div>
          </div>
        )}
      </div>

      {/* Context Modal - Professional replacement for prompt() */}
      <ContextModal 
        isOpen={showContextModal}
        onClose={() => setShowContextModal(false)}
        onSubmit={handleContextSubmit}
        callerName={participants.find(p => p.identity.startsWith('caller-'))?.identity || 'Customer'}
      />
    </div>
  );
}
