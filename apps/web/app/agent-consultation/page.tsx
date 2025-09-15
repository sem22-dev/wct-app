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
import { useAgentAutoClose } from '@/hooks/useAgentAutoClose';
import { TTSManager } from '@/lib/tts';
import { getToken } from '@/lib/livekit';
import { MessageSquare, Users, Volume2, VolumeX, Bot } from 'lucide-react';

export default function AgentConsultationPage() {
  const [token, setToken] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [identity, setIdentity] = useState<string>('');
  const [ttsManager, setTtsManager] = useState<TTSManager | null>(null);

  // Initialize TTS manager only on client-side
  useEffect(() => {
    setTtsManager(new TTSManager());
  }, []);

  // Auto-close hook for Agent A
  const { shouldClose, closeMessage } = useAgentAutoClose(
    identity, 
    identity.startsWith('agent-a') ? 'agent-a' : 'agent-b'
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const summaryParam = params.get('summary');
    const identityParam = params.get('identity');
    const tokenParam = params.get('token');

    if (roomParam) setRoom(roomParam);
    if (summaryParam) setSummary(decodeURIComponent(summaryParam));
    if (identityParam) setIdentity(identityParam);
    if (tokenParam) setToken(tokenParam);
  }, []);

  const handleConnect = async () => {
    if (!room || !identity) return;
    
    try {
      const tokenData = await getToken(room, identity, 'agent');
      setToken(tokenData.token);
    } catch (error) {
      console.error('Failed to connect to consultation room:', error);
    }
  };

  if (!token && room && identity) {
    return (
      <Layout 
        title="Agent Consultation Room" 
        subtitle="Private Briefing Session"
        variant="consultation"
      >
        <div className="max-w-2xl mx-auto">
          <ActionCard
            title="Join Consultation"
            description="Connect to private room for agent-to-agent briefing"
            icon={<MessageSquare className="h-5 w-5 text-emerald-600" />}
            variant="success"
          >
            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-emerald-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-600">Room:</span>
                    <p className="font-mono text-slate-800">{room}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Identity:</span>
                    <p className="font-mono text-slate-800">{identity}</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleConnect}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Join Consultation
              </Button>
            </div>
          </ActionCard>
        </div>
        
        {/* Auto-close overlay */}
        <AutoCloseOverlay shouldClose={shouldClose} message={closeMessage} />
      </Layout>
    );
  }

  if (!token) {
    return (
      <Layout 
        title="Agent Consultation Room" 
        subtitle="Loading consultation parameters..."
        variant="consultation"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading consultation room...</p>
        </div>
        
        {/* Auto-close overlay */}
        <AutoCloseOverlay shouldClose={shouldClose} message={closeMessage} />
      </Layout>
    );
  }

  return (
    <Layout 
      title="Agent Consultation Room" 
      subtitle="Private Agent-to-Agent Briefing"
      variant="consultation"
    >
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        className="h-0"
      >
        <ConsultationInterface 
          room={room} 
          summary={summary} 
          identity={identity} 
          ttsManager={ttsManager} 
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
      
      {/* Auto-close overlay */}
      <AutoCloseOverlay shouldClose={shouldClose} message={closeMessage} />
    </Layout>
  );
}

function ConsultationInterface({ 
  room, 
  summary, 
  identity, 
  ttsManager 
}: { 
  room: string; 
  summary: string; 
  identity: string;
  ttsManager: TTSManager | null;
}) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  
  const isAgentA = identity.startsWith('agent-a');
  const isAgentB = identity.startsWith('agent-b');
  const bothAgentsPresent = participants.some(p => p.identity.startsWith('agent-a')) && 
                           participants.some(p => p.identity.startsWith('agent-b'));

  const handleSpeakSummary = () => {
    if (!ttsManager) return;
    const briefingText = `Hello Agent B, here is the call summary: ${summary}. Are you ready to take over this call?`;
    ttsManager.speakAsAgentA(briefingText);
  };

  const handleSpeakAcknowledge = () => {
    if (!ttsManager) return;
    const acknowledgmentText = "Thank you Agent A, I understand the situation completely. I'm ready to take over the call now.";
    ttsManager.speakAsAgentB(acknowledgmentText);
  };

  const handleStopSpeaking = () => {
    if (!ttsManager) return;
    ttsManager.stop();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Status & Participants */}
      <div className="xl:col-span-1 space-y-6">
        <StatusCard
          connectionState={connectionState}
          room={room}
          identity={identity}
          participantCount={participants.length}
          phase="consultation"
        />
        
        <ParticipantList 
          participants={participants} 
          currentIdentity={identity}
          phase="consultation"
        />
      </div>

      {/* Main Content */}
      <div className="xl:col-span-2 space-y-6">
        {/* Waiting for both agents */}
        {!bothAgentsPresent && (
          <ActionCard
            title="Waiting for Both Agents"
            description="Consultation will begin when both Agent A and Agent B are present"
            icon={<Users className="h-5 w-5 text-amber-600" />}
            variant="warning"
          >
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-amber-600" />
              </div>
              <p className="text-slate-600">Waiting for {participants.length}/2 agents to join...</p>
            </div>
          </ActionCard>
        )}

        {/* AI Summary Card with Enhanced TTS */}
        {summary && bothAgentsPresent && (
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border-blue-200/50 shadow-xl rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">AI-Generated Call Summary</h3>
                <p className="text-xs text-slate-500">Generated for warm transfer briefing</p>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-100 mb-4">
              <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Agent A TTS Controls */}
              {isAgentA && ttsManager && (
                <>
                  <Button 
                    onClick={handleSpeakSummary}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>Brief Agent B (Daniel Voice)</span>
                  </Button>
                  
                  <Button 
                    onClick={handleStopSpeaking}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <VolumeX className="h-4 w-4" />
                    <span>Stop Speaking</span>
                  </Button>
                </>
              )}

              {/* Agent B TTS Controls */}
              {isAgentB && ttsManager && (
                <Button 
                  onClick={handleSpeakAcknowledge}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>Acknowledge (Female Voice)</span>
                </Button>
              )}

              {/* Show loading if TTS not ready */}
              {!ttsManager && (
                <div className="flex items-center space-x-2 text-slate-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400" />
                  <span className="text-sm">Loading voice controls...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agent Instructions */}
        {bothAgentsPresent && (
          <ActionCard
            title="Consultation Instructions"
            description="Guidelines for effective warm transfer briefing"
            icon={<MessageSquare className="h-5 w-5 text-emerald-600" />}
            variant="success"
          >
            <div className="space-y-4">
              {isAgentA && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2 flex items-center space-x-2">
                    <span>🎤</span>
                    <span>Your Role (Agent A):</span>
                  </h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Click "Brief Agent B" to speak the AI summary with Daniel's voice</li>
                    <li>• The TTS will use a professional male voice for clarity</li>
                    <li>• Provide additional context about the customer if needed</li>
                    <li>• Ensure Agent B fully understands before completing transfer</li>
                    <li>• Your tabs will close automatically after Agent B takes over</li>
                  </ul>
                </div>
              )}
              
              {isAgentB && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center space-x-2">
                    <span>🎧</span>
                    <span>Your Role (Agent B):</span>
                  </h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Listen carefully to Agent A's briefing via TTS</li>
                    <li>• Click "Acknowledge" to confirm with a female voice</li>
                    <li>• Ask clarifying questions in the audio chat if needed</li>
                    <li>• Return to Agent B page to take over the main call</li>
                  </ul>
                  
                  {ttsManager && (
                    <div className="mt-4">
                      <Button 
                        onClick={handleSpeakAcknowledge}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        size="lg"
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        Acknowledge & Confirm Understanding
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Voice Information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <span>🔊</span>
                  <span>Voice Information:</span>
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Agent A:</strong> Uses male voice (Daniel, David, Alex) for briefing</p>
                  <p><strong>Agent B:</strong> Uses female voice (Samantha, Zira, Victoria) for responses</p>
                  <p>Voice selection is automatic based on system availability</p>
                </div>
              </div>
            </div>
          </ActionCard>
        )}
      </div>
    </div>
  );
}
