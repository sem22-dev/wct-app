'use client';

import { useState, useEffect } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useConnectionState } from '@livekit/components-react';
import '@livekit/components-styles';
import { getToken } from '@/lib/livekit';
import { ConnectionState } from 'livekit-client';

export default function CallerPage() {
  const [token, setToken] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [callerIdentity] = useState(`caller-${Math.random().toString(36).substr(2, 9)}`);
  const [roomName] = useState('room-a');

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
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-8">📞 Caller Interface</h1>
        <div className="bg-blue-50 p-6 rounded-lg mb-4">
          <p><strong>Room:</strong> {roomName}</p>
          <p><strong>Identity:</strong> {callerIdentity}</p>
        </div>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {connecting ? 'Connecting...' : 'Join Call'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        style={{ height: '100vh' }}
      >
        <CallerInterface callerIdentity={callerIdentity} roomName={roomName} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function CallerInterface({ callerIdentity, roomName }: { callerIdentity: string, roomName: string }) {
  const connectionState = useConnectionState();
  
  return (
    <div className="p-6 bg-white min-h-screen text-black">
      <h1 className="text-2xl font-bold mb-4">📞 Caller - In Call</h1>
      <div className="bg-green-50 p-4 rounded-lg mb-4">
        <p><strong>Status:</strong> {connectionState === ConnectionState.Connected ? '✅ Connected' : '🔄 Connecting...'}</p>
        <p><strong>Room:</strong> {roomName}</p>
        <p><strong>You are:</strong> {callerIdentity}</p>
      </div>
      <p className="text-gray-600">Waiting for an agent to assist you...</p>
    </div>
  );
}
