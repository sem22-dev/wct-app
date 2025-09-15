import { Participant } from 'livekit-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

interface ParticipantListProps {
  participants: Participant[];
  currentIdentity: string;
  phase?: string;
}

export function ParticipantList({ participants, currentIdentity, phase }: ParticipantListProps) {
  const getParticipantConfig = (identity: string) => {
    if (identity.startsWith('caller-')) {
      return { role: 'Caller', icon: '📞', color: 'bg-blue-500', initial: 'C' };
    }
    if (identity.startsWith('agent-a')) {
      return { role: 'Agent A', icon: '👨‍💼', color: 'bg-orange-500', initial: 'A' };
    }
    if (identity.startsWith('agent-b')) {
      return { role: 'Agent B', icon: '👩‍💼', color: 'bg-purple-500', initial: 'B' };
    }
    return { role: 'Participant', icon: '👤', color: 'bg-slate-500', initial: 'P' };
  };

  const getStatusBadge = (identity: string) => {
    if (identity === currentIdentity) return { text: 'You', variant: 'default' as const };
    
    const { role } = getParticipantConfig(identity);
    if (phase === 'consultation') {
      if (role === 'Agent A') return { text: 'Briefing', variant: 'secondary' as const };
      if (role === 'Agent B') return { text: 'Listening', variant: 'outline' as const };
    }
    if (identity.startsWith('caller-') && phase === 'initiated') {
      return { text: 'On Hold', variant: 'destructive' as const };
    }
    return { text: 'Active', variant: 'outline' as const };
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-slate-800">
          <Users className="h-5 w-5" />
          <span>Participants ({participants.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {participants.map(participant => {
            const config = getParticipantConfig(participant.identity);
            const status = getStatusBadge(participant.identity);
            
            return (
              <div key={participant.identity} 
                   className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-200/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`${config.color} text-white font-semibold`}>
                      {config.initial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-800">{config.role}</p>
                    <p className="text-xs text-slate-500 font-mono max-w-32 truncate">
                      {participant.identity}
                    </p>
                  </div>
                </div>
                
                <Badge variant={status.variant} className="text-xs font-medium">
                  {status.text}
                </Badge>
              </div>
            );
          })}
          
          {participants.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No participants yet</p>
              <p className="text-sm text-slate-400">Waiting for connections...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
