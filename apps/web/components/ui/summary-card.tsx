import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface SummaryCardProps {
  summary: string;
  onSpeak?: (text: string) => void;
  onStopSpeaking?: () => void;
  showSpeakControls?: boolean;
  variant?: 'default' | 'consultation';
}

export function SummaryCard({ 
  summary, 
  onSpeak, 
  onStopSpeaking, 
  showSpeakControls = false,
  variant = 'default'
}: SummaryCardProps) {
  const handleSpeak = () => {
    if (onSpeak) {
      const briefingText = variant === 'consultation' 
        ? `Hello Agent B, here is the call summary: ${summary}. Are you ready to take over this call?`
        : summary;
      onSpeak(briefingText);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border-blue-200/50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <Bot className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
              <span>AI-Generated Call Summary</span>
              <Badge variant="outline" className="bg-white/50">
                <Sparkles className="h-3 w-3 mr-1" />
                Generated
              </Badge>
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
          <p className="text-sm text-slate-700 leading-relaxed">
            {summary}
          </p>
        </div>
        
        {showSpeakControls && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleSpeak}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Volume2 className="h-4 w-4" />
                <span>
                  {variant === 'consultation' ? 'Brief Agent B' : 'Speak Summary'}
                </span>
              </Button>
              
              {onStopSpeaking && (
                <Button 
                  onClick={onStopSpeaking}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <VolumeX className="h-4 w-4" />
                  <span>Stop Speaking</span>
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
