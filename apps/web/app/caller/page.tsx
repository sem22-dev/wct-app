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
import { useAgentAutoClose } from '@/hooks/useAgentAutoClose';
import { getToken } from '@/lib/livekit';
import { initializeTwilioDevice, joinConferenceFromWeb, disconnectFromConference } from '@/lib/twilio-client';
import { UserCheck, Phone, Users } from 'lucide-react';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000';

export default function CallerPage() {
  const [token, setToken] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [callerIdentity, setCallerIdentity] = useState<string>('');
  const [roomName] = useState('room-a');
  
  // Twilio Conference State
  const [twilioDevice, setTwilioDevice] = useState<any>(null);
  const [inTwilioConference, setInTwilioConference] = useState(false);
  const [conferenceInfo, setConferenceInfo] = useState<any>(null);
  
  // Generate identity only on client-side to prevent hydration mismatch
  useEffect(() => {
    setCallerIdentity(`caller-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // Auto-close hook
  const { shouldClose, closeMessage } = useAgentAutoClose(callerIdentity, 'caller');

  const joinTwilioConference = async (conferenceName: string) => {
  try {
    console.log('🎧 Joining Twilio conference:', conferenceName);
    
    // Clean up any existing device first
    if (twilioDevice) {
      try {
        console.log('🧹 Cleaning up existing Twilio device...');
        twilioDevice.destroy();
        setTwilioDevice(null);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      } catch (cleanupError) {
        console.log('Cleanup error (normal):', cleanupError);
      }
    }
    
    // Get access token for caller with unique identity
    const response = await fetch(`${SERVER_URL}/twilio/web-join-conference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_identity: callerIdentity,
        conference_name: conferenceName
      })
    });
    
    const { access_token, identity } = await response.json();
    console.log('✅ Got Twilio access token for identity:', identity);
    
    // Initialize Twilio device for caller with unique identity
    const device = await initializeTwilioDevice(access_token);
    setTwilioDevice(device);
    
    // Wait a bit before joining conference to ensure device is ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Join the conference
    await joinConferenceFromWeb(conferenceName);
    setInTwilioConference(true);
    setConferenceInfo({ name: conferenceName });
    
    alert('🎧 You\'ve joined the phone conference!\n\nYou can now speak directly with the phone agent.');
    
  } catch (error) {
    console.error('❌ Failed to join Twilio conference:', error);
    alert('Failed to join phone conference. Please try again.');
    
    // Clean up on failure
    if (twilioDevice) {
      try {
        twilioDevice.destroy();
        setTwilioDevice(null);
      } catch (cleanupError) {
        console.log('Cleanup after error:', cleanupError);
      }
    }
  }
};

 
  // Polling for conference join signals from Agent A
  useEffect(() => {
    if (!roomName || inTwilioConference) return;
    
    console.log('🔍 Starting polling for conference signals...');
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${SERVER_URL}/twilio/check-caller-signal/${roomName}`);
        const signal = await response.json();
        
        console.log('📡 Polling result:', signal);
        
        if (signal.message === 'join_twilio_conference' && !inTwilioConference) {
          console.log('🎯 Received join conference signal!');
          
          // Agent A wants caller to join Twilio conference
          const shouldJoin = confirm(
            '🔄 Agent is transferring you to a phone specialist.\n\nWould you like to join the phone conference?'
          );
          
          if (shouldJoin) {
            await joinTwilioConference(signal.conference_name);
          }
        }
        
      } catch (error) {
        // Silent fail - polling errors shouldn't interrupt user experience
        console.log('Polling error (normal):', error);
      }
    }, 2000); // Poll every 2 seconds
    
    return () => {
      console.log('🛑 Stopping conference signal polling');
      clearInterval(pollInterval);
    };
  }, [roomName, inTwilioConference]);

  // Debug log
  useEffect(() => {
    console.log('🔍 Caller state:', { 
      roomName, 
      callerIdentity, 
      inTwilioConference,
      conferenceInfo 
    });
  }, [roomName, callerIdentity, inTwilioConference, conferenceInfo]);

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

  // Show loading state until identity is generated
  if (!callerIdentity) {
    return (
      <Layout 
        title="Customer Interface" 
        subtitle="Loading..."
        variant="caller"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-slate-600">Initializing Caller...</span>
        </div>
        
        <AutoCloseOverlay shouldClose={shouldClose} message={closeMessage} countdown={5} />
      </Layout>
    );
  }

  if (!token) {
    return (
      <Layout 
        title="Customer Interface" 
        subtitle="Connect to Customer Support"
        variant="caller"
      >
        <div className="max-w-2xl mx-auto">
          <ActionCard
            title="Join Support Room"
            description="Connect with customer support agents for assistance"
            icon={<UserCheck className="h-5 w-5 text-blue-600" />}
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
                    <span className="font-medium text-slate-600">Customer ID:</span>
                    <p className="font-mono text-slate-800 truncate" suppressHydrationWarning>
                      {callerIdentity}
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
                    Join Customer Support
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
      title="Customer Interface" 
      subtitle="Connected to Customer Support"
      variant="caller"
    >
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        className="h-0"
      >
        <CallerInterface 
          callerIdentity={callerIdentity} 
          roomName={roomName}
          twilioDevice={twilioDevice}
          setTwilioDevice={setTwilioDevice}
          inTwilioConference={inTwilioConference}
          setInTwilioConference={setInTwilioConference}
          conferenceInfo={conferenceInfo}
          setConferenceInfo={setConferenceInfo}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
      
      <AutoCloseOverlay shouldClose={shouldClose} message={closeMessage} countdown={5} />
    </Layout>
  );
}

function CallerInterface({ 
  callerIdentity, 
  roomName,
  twilioDevice,
  setTwilioDevice,
  inTwilioConference,
  setInTwilioConference,
  conferenceInfo,
  setConferenceInfo
}: {
  callerIdentity: string;
  roomName: string;
  twilioDevice: any;
  setTwilioDevice: (device: any) => void;
  inTwilioConference: boolean;
  setInTwilioConference: (value: boolean) => void;
  conferenceInfo: any;
  setConferenceInfo: (info: any) => void;
}) {
  const connectionState = useConnectionState();
  const participants = useParticipants();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 bg-white">
      {/* Status & Participants */}
      <div className="xl:col-span-1 space-y-6">
        <StatusCard
          connectionState={connectionState}
          room={roomName}
          identity={callerIdentity}
          participantCount={participants.length}
          phase="active"
        />
        
        <ParticipantList 
          participants={participants} 
          currentIdentity={callerIdentity}
          phase="active"
        />
      </div>

      {/* Main Content */}
      <div className="xl:col-span-2 space-y-6">
        {/* Conference Status Display */}
        {inTwilioConference && (
          <ActionCard
            title="📞 Phone Conference Active"
            description={`Connected to phone agent in conference: ${conferenceInfo?.name}`}
            icon={<Phone className="h-5 w-5 text-green-600" />}
            variant="success"
          >
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Conference Status:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 🎧 **Connected via browser** - You can speak directly</li>
                  <li>• 📞 **Phone agent available** - They can hear you</li>
                  <li>• 🔊 **Audio active** - Conference is live</li>
                  <li>• ⏳ **Conference:** {conferenceInfo?.name}</li>
                </ul>
              </div>
              
              <Button 
                onClick={() => {
                  disconnectFromConference();
                  setInTwilioConference(false);
                  setConferenceInfo(null);
                  alert('You have left the phone conference.');
                }}
                variant="outline"
                className="w-full"
              >
                📞 Leave Phone Conference
              </Button>
            </div>
          </ActionCard>
        )}

        {/* Waiting for Agent */}
        {!inTwilioConference && (
          <ActionCard
            title="Customer Support Active"
            description="You are connected with a support agent"
            icon={<Users className="h-5 w-5 text-blue-600" />}
            variant="info"
          >
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Support Status:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 🎧 **Audio connected** - You can speak with the agent</li>
                  <li>• 👨‍💼 **Agent available** - They are ready to help</li>
                  <li>• 📞 **Transfer available** - Agent can connect you to specialists</li>
                  <li>• ⏳ **Room:** {roomName}</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Note:</strong> If the agent transfers you to a phone specialist, 
                  you'll receive a popup asking if you want to join the phone conference.
                </p>
              </div>
            </div>
          </ActionCard>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-br from-slate-50/80 to-blue-50/80 backdrop-blur-sm border-slate-200/50 shadow-xl rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <span className="text-blue-600">💬</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Customer Support Instructions</h3>
              <p className="text-xs text-slate-500">How to get the best help</p>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <ul className="text-sm text-slate-700 space-y-2">
              <li>• 🎤 **Speak clearly** - Your microphone is active</li>
              <li>• 🕐 **Be patient** - Agent is here to help you</li>
              <li>• 📋 **Explain your issue** - Provide details about your problem</li>
              <li>• 📞 **Phone transfer** - Agent may connect you to specialists</li>
              <li>• ✅ **Stay connected** - Don't refresh the page during support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
