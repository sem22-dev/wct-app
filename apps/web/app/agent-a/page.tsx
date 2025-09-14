'use client';

import { useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useConnectionState, useParticipants } from '@livekit/components-react';
import '@livekit/components-styles';
import { getToken, initiateTransfer } from '@/lib/livekit';
import { ConnectionState } from 'livekit-client';

export default function AgentAPage() {
  const [token, setToken] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [agentIdentity] = useState(`agent-a-${Math.random().toString(36).substr(2, 9)}`);
  const [roomName] = useState('room-a');

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

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-8">👨‍💼 Agent A Interface</h1>
        <div className="bg-orange-50 p-6 rounded-lg mb-4">
          <p><strong>Room:</strong> {roomName}</p>
          <p><strong>Identity:</strong> {agentIdentity}</p>
        </div>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="bg-orange-500 text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {connecting ? 'Connecting...' : 'Join as Agent A'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        style={{ height: '100vh' }}
      >
        <AgentAInterface agentIdentity={agentIdentity} roomName={roomName} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function AgentAInterface({ agentIdentity, roomName }: { agentIdentity: string, roomName: string }) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const [transferring, setTransferring] = useState(false);
  const [summary, setSummary] = useState<string>('');

  const handleTransfer = async () => {
    setTransferring(true);
    try {
      // Find caller participant
      const caller = participants.find(p => p.identity.startsWith('caller-'));
      if (!caller) {
        alert('No caller found to transfer');
        return;
      }

      const transferData = await initiateTransfer(roomName, caller.identity);
      setSummary(transferData.summary);
      
      // Show transfer info
      alert(`Transfer initiated!\nConsultation Room: ${transferData.consultation_room}\n\nAgent B should join now.`);
      
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Failed to initiate transfer');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="p-6 bg-white text-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4">👨‍💼 Agent A - Handling Call</h1>
      
      <div className="bg-orange-50 p-4 rounded-lg mb-4">
        <p><strong>Status:</strong> {connectionState === ConnectionState.Connected ? '✅ Connected' : '🔄 Connecting...'}</p>
        <p><strong>Room:</strong> {roomName}</p>
        <p><strong>Participants:</strong> {participants.length}</p>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Participants:</h3>
        {participants.map(p => (
          <div key={p.identity} className="text-sm bg-gray-100 p-2 rounded mb-1">
            {p.identity} {p.identity === agentIdentity && '(You)'}
          </div>
        ))}
      </div>

      <button
        onClick={handleTransfer}
        disabled={transferring || participants.length < 2}
        className="bg-red-500 text-white px-6 py-3 rounded-lg disabled:opacity-50 mb-4"
      >
        {transferring ? 'Initiating Transfer...' : 'Warm Transfer to Agent B'}
      </button>

      {summary && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">📝 Call Summary (Read to Agent B):</h3>
          <p className="text-sm">{summary}</p>
        </div>
      )}
    </div>
  );
}
