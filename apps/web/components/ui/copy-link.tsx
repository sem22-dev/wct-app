'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface CopyLinkProps {
  room: string;
  className?: string;
}

export function CopyLink({ room, className }: CopyLinkProps) {
  const [copied, setCopied] = useState(false);

  // Generate full URL with current origin
  const fullUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/agent-b?room=${room}`
    : `/agent-b?room=${room}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 bg-slate-100 rounded-lg p-3 border border-slate-200">
        <code className="text-sm font-mono text-slate-800 break-all select-all">
          {fullUrl}
        </code>
      </div>
      
      <Button
        onClick={handleCopy}
        size="sm"
        variant={copied ? "default" : "outline"}
        className={`flex items-center space-x-2 min-w-[80px] ${
          copied ? 'bg-green-600 hover:bg-green-700 text-white' : ''
        }`}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span>Copy</span>
          </>
        )}
      </Button>
    </div>
  );
}
