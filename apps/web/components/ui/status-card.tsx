import { ConnectionState } from 'livekit-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface StatusCardProps {
  connectionState: ConnectionState;
  room: string;
  identity: string;
  participantCount: number;
  phase?: string;
}

export function StatusCard({ connectionState, room, identity, participantCount, phase }: StatusCardProps) {
  const isConnected = connectionState === ConnectionState.Connected;
  const isConnecting = connectionState === ConnectionState.Connecting;

  const getStatusIcon = () => {
    if (isConnected) return <Wifi className="h-4 w-4" />;
    if (isConnecting) return <Loader2 className="h-4 w-4 animate-spin" />;
    return <WifiOff className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (isConnected) return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
    if (isConnecting) return 'bg-amber-500/10 text-amber-700 border-amber-200';
    return 'bg-red-500/10 text-red-700 border-red-200';
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800">Connection Status</CardTitle>
          <Badge className={`flex items-center space-x-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="font-medium">
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Room</p>
            <p className="text-sm font-mono text-slate-800 bg-slate-100 rounded px-2 py-1">
              {room}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Participants</p>
            <p className="text-sm font-semibold text-slate-800">
              {participantCount}
            </p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Your Identity</p>
          <p className="text-sm font-mono text-slate-800 bg-slate-100 rounded px-2 py-1 break-all">
            {identity}
          </p>
        </div>
        
        {phase && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phase</p>
              <Badge variant="outline" className="capitalize">
                {phase.replace('_', ' ')}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
