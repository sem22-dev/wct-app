'use client';

import { useState, useEffect } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useConnectionState, useParticipants } from '@livekit/components-react';
import '@livekit/components-styles';
import { ConnectionState } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/ui/layout';
import { StatusCard } from '@/components/ui/status-card';
import { ParticipantList } from '@/components/ui/participant-list';
import { ActionCard } from '@/components/ui/action-card';
import { AutoCloseOverlay } from '@/components/AutoCloseOverlay';
import { ContextModal } from '@/components/ui/context-modal';
import { CopyLink } from '@/components/ui/copy-link';
import { useAgentAutoClose } from '@/hooks/useAgentAutoClose';
import { getToken, initiateTransfer, holdCaller, transferToPhone } from '@/lib/livekit';
import { initializeTwilioDevice, joinConferenceFromWeb, disconnectFromConference, refreshTwilioToken } from '@/lib/twilio-client';
import { UserCheck, ArrowRightLeft, ExternalLink, Phone, Users } from 'lucide-react';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000';

export default function AgentAPage() {
  const [token, setToken] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [agentIdentity, setAgentIdentity] = useState<string>('');
  const [roomName] = useState('room-a');
  const [transferring, setTransferring] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [consultationRoom, setConsultationRoom] = useState<string>('');
  const [transferStep, setTransferStep] = useState<'idle' | 'initiated' | 'consulting' | 'phone-conference'>('idle');
  
  // Twilio-specific state
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [transferMode, setTransferMode] = useState<'agent' | 'phone'>('agent');
  const [twilioDevice, setTwilioDevice] = useState<any>(null);
  const [inWebConference, setInWebConference] = useState(false);
  
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
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          transferMode={transferMode}
          setTransferMode={setTransferMode}
          twilioDevice={twilioDevice}
          setTwilioDevice={setTwilioDevice}
          inWebConference={inWebConference}
          setInWebConference={setInWebConference}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
      
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
  setShowContextModal,
  phoneNumber,
  setPhoneNumber,
  transferMode,
  setTransferMode,
  twilioDevice,
  setTwilioDevice,
  inWebConference,
  setInWebConference
}: {
  agentIdentity: string;
  roomName: string;
  transferring: boolean;
  setTransferring: (value: boolean) => void;
  summary: string;
  setSummary: (value: string) => void;
  consultationRoom: string;
  setConsultationRoom: (value: string) => void;
  transferStep: 'idle' | 'initiated' | 'consulting' | 'phone-conference';
  setTransferStep: (value: 'idle' | 'initiated' | 'consulting' | 'phone-conference') => void;
  showContextModal: boolean;
  setShowContextModal: (value: boolean) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  transferMode: 'agent' | 'phone';
  setTransferMode: (value: 'agent' | 'phone') => void;
  twilioDevice: any;
  setTwilioDevice: (value: any) => void;
  inWebConference: boolean;
  setInWebConference: (value: boolean) => void;
}) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const [tokenRefreshInterval, setTokenRefreshInterval] = useState<NodeJS.Timeout | null>(null);


  // Handle transfer initiation
  const handleTransfer = async () => {
    const caller = participants.find(p => p.identity.startsWith('caller-'));
    if (!caller) {
      alert('No caller found to transfer');
      return;
    }

    if (transferMode === 'phone' && !phoneNumber.trim()) {
      alert('Please enter a phone number for phone transfer');
      return;
    }

    setShowContextModal(true);
  };

  // Handle context submission from modal
  const handleContextSubmit = async (context: string) => {
    setTransferring(true);
    
    try {
      const caller = participants.find(p => p.identity.startsWith('caller-'));

        if (!caller) {
          alert('No caller found to transfer');
          setTransferring(false);
          return;
        }
      
      if (transferMode === 'agent') {
        // Existing Agent B transfer logic
        const transferData = await initiateTransfer(roomName, caller.identity, agentIdentity, context);
        setSummary(transferData.summary);
        setConsultationRoom(transferData.consultation_room);
        setTransferStep('initiated');
        
        await holdCaller(caller.identity, roomName, true);
        
        alert(`Agent transfer initiated!\n\nConsultation Room: ${transferData.consultation_room}\n\nContext provided: "${context}"\n\nYou will now join the consultation room to brief Agent B.`);
        
      } else if (transferMode === 'phone') {
        // Phone transfer logic
        const transferData = await transferToPhone(
          roomName, 
          caller.identity, 
          agentIdentity, 
          phoneNumber, 
          context
        );
        
        setTransferStep('phone-conference');
        setSummary(transferData.summary);
        setConsultationRoom(transferData.conference_name);
        
        alert(`Phone transfer initiated!\n\nCalling: ${phoneNumber}\nConference: ${transferData.conference_name}\n\nAI Summary: "${transferData.summary}"\n\nThe phone agent will join the conference automatically.`);
      }
      
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Failed to initiate transfer. Please try again.');
    } finally {
      setTransferring(false);
    }
  };

  // Join consultation for agent transfers
  const joinConsultation = async () => {
    if (!consultationRoom) return;
    
    try {
      const consultUrl = `/agent-consultation?room=${consultationRoom}&summary=${encodeURIComponent(summary)}&identity=${agentIdentity}`;
      window.open(consultUrl, '_blank');
      setTransferStep('consulting');
    } catch (error) {
      console.error('Failed to join consultation:', error);
      alert('Failed to join consultation room');
    }
  };



const handleJoinWebConference = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/twilio/web-join-conference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_identity: agentIdentity,
        conference_name: consultationRoom
      })
    });
    
    const { access_token } = await response.json();
    
    const device = await initializeTwilioDevice(access_token);
    setTwilioDevice(device);
    
    await joinConferenceFromWeb(consultationRoom);
    setInWebConference(true);
    
    // Set up token refresh every 3 hours (before 4-hour expiry)
    const refreshInterval = setInterval(async () => {
      try {
        await refreshTwilioToken(agentIdentity, consultationRoom);
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, 3 * 60 * 60 * 1000); // 3 hours
    
    setTokenRefreshInterval(refreshInterval);
    
    alert(`🎧 You've joined the conference!\nYou can now speak directly with Agent B.`);
    
  } catch (error) {
    console.error('Failed to join web conference:', error);
    alert('Failed to join conference via web');
  }
};


  const handleBridgeCaller = async () => {
  try {
    // Instead of prompting for phone number, signal the caller to join conference
    const response = await fetch(`${SERVER_URL}/twilio/signal-caller-join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_name: roomName,
        conference_name: consultationRoom,
        message: 'join_twilio_conference'
      })
    });
    
    if (response.ok) {
      alert('📞 Caller is being connected to the phone conference...\n\nAll parties will be connected shortly.');
    }
    
  } catch (error) {
    console.error('Failed to add caller to conference:', error);
    alert('Failed to add caller to conference');
  }
};

  // Complete transfer and exit
  const handleCompleteTransfer = () => {
    disconnectFromConference();
    setInWebConference(false);
    alert('Transfer complete!\n\nYou have left the conference.\nCaller and Agent B can continue their conversation.');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 bg-white">
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
            description="Transfer the caller to Agent B or a real phone number via Twilio"
            icon={<ArrowRightLeft className="h-5 w-5 text-red-600" />}
            variant="warning"
          >
            <div className="space-y-4">
              {/* Transfer Mode Selection */}
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-amber-100">
                <h4 className="font-medium text-slate-800 mb-3">Choose Transfer Method:</h4>
                <div className="flex gap-3">
                  <Button
                    variant={transferMode === 'agent' ? 'default' : 'outline'}
                    onClick={() => setTransferMode('agent')}
                    className="flex items-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Transfer to Agent B</span>
                  </Button>
                  <Button
                    variant={transferMode === 'phone' ? 'default' : 'outline'}
                    onClick={() => setTransferMode('phone')}
                    className="flex items-center space-x-2"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Transfer to Phone</span>
                  </Button>
                </div>
              </div>

              {/* Phone Number Input (only for phone transfers) */}
              {transferMode === 'phone' && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Agent B Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890 or 917005678990"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-slate-500">
                      Enter the phone number where Agent B can be reached
                    </p>
                  </div>
                </div>
              )}

              {/* Transfer Requirements */}
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-amber-100">
                <h4 className="font-medium text-slate-800 mb-2">Transfer Requirements:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• At least one caller must be present</li>
                  {transferMode === 'agent' ? (
                    <>
                      <li>• Agent B must be available for consultation</li>
                      <li>• AI summary will be generated automatically</li>
                      <li>• Consultation room will be created for briefing</li>
                    </>
                  ) : (
                    <>
                      <li>• Phone number must be valid and reachable</li>
                      <li>• Twilio will call the number automatically</li>
                      <li>• You can join the conference via web browser</li>
                      <li>• Agent B will join via phone call</li>
                    </>
                  )}
                </ul>
              </div>
              
              <Button
                onClick={handleTransfer}
                disabled={transferring || participants.length < 2 || (transferMode === 'phone' && !phoneNumber.trim())}
                className="w-full h-11"
                variant="destructive"
              >
                {transferring ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {transferMode === 'phone' ? 'Calling Phone...' : 'Initiating Transfer...'}
                  </>
                ) : (
                  <>
                    {transferMode === 'phone' ? <Phone className="h-4 w-4 mr-2" /> : <ArrowRightLeft className="h-4 w-4 mr-2" />}
                    {transferMode === 'phone' ? 'Call Phone & Transfer' : 'Initiate Warm Transfer'}
                  </>
                )}
              </Button>
            </div>
          </ActionCard>
        )}

        {/* Agent Transfer in Progress (only for agent transfers) */}
        {transferStep === 'initiated' && consultationRoom && transferMode === 'agent' && (
          <ActionCard
            title="Transfer in Progress"
            description="Caller is on hold. Join consultation room to brief Agent B."
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

        {/* Phone Conference Active */}
        {transferStep === 'phone-conference' && (
          <ActionCard
            title="Phone Conference Active"
            description={`Agent B has been called at ${phoneNumber}`}
            icon={<Phone className="h-5 w-5 text-emerald-600" />}
            variant="success"
          >
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-2">Conference Status:</h4>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>• 📞 **Calling {phoneNumber}** - Agent B should answer phone</li>
                  <li>• 🎵 **Hold music playing** until you join the conference</li>
                  <li>• 🤖 **AI Summary ready** to share with Agent B</li>
                  <li>• ⏳ **Conference:** {consultationRoom}</li>
                </ul>
              </div>

              {/* Conference Controls */}
              <div className="space-y-2">
                {!inWebConference ? (
                  <Button 
                    onClick={handleJoinWebConference}
                    className="w-full"
                    size="lg"
                  >
                    🎧 Join Conference via Web
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-sm text-blue-700">
                        ✅ **You're now in the conference!** Speak directly with Agent B to explain the situation.
                      </p>
                    </div>
                    
                    <Button onClick={handleBridgeCaller} className="w-full" variant="outline">
                      📞 Add Caller to Conference
                    </Button>
                    
                    <Button onClick={handleCompleteTransfer} className="w-full" variant="destructive">
                      ✅ Complete Transfer & Exit
                    </Button>
                  </div>
                )}
              </div>

              {/* AI Summary to read */}
              {summary && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h5 className="font-semibold text-yellow-800 mb-2">📋 Read this to Agent B:</h5>
                  <p className="text-sm text-yellow-700 italic">"{summary}"</p>
                </div>
              )}
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
                <p className="text-xs text-slate-500">Ready for Agent B briefing via {transferMode === 'phone' ? 'web conference' : 'TTS'}</p>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
            </div>
            
            <div className="mt-4 text-xs text-slate-500">
              💡 This summary will be {transferMode === 'phone' ? 'read by you to the phone agent via web conference' : 'spoken to Agent B in the consultation room using Daniel\'s voice'}
            </div>
          </div>
        )}
      </div>

      {/* Context Modal - Works for both agent and phone transfers */}
      <ContextModal 
        isOpen={showContextModal}
        onClose={() => setShowContextModal(false)}
        onSubmit={handleContextSubmit}
        callerName={participants.find(p => p.identity.startsWith('caller-'))?.identity || 'Customer'}
      />
    </div>
  );
}
