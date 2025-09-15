'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, User, Clock } from 'lucide-react';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (context: string) => void;
  callerName?: string;
}

export function ContextModal({ isOpen, onClose, onSubmit, callerName = "Customer" }: ContextModalProps) {
  const [context, setContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!context.trim()) {
      return; // Don't submit empty context
    }

    setIsSubmitting(true);
    try {
      await onSubmit(context.trim());
      setContext(''); // Clear form after successful submission
      onClose();
    } catch (error) {
      console.error('Failed to submit context:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContext(''); // Clear form on cancel
    onClose();
  };

  // Quick suggestion buttons
  const suggestions = [
    "Customer needs account assistance",
    "Password reset required",
    "Billing inquiry - urgent",
    "Technical support needed",
    "Account verification issue"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setContext(suggestion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span>Quick Context for Agent B</span>
          </DialogTitle>
          <p className="text-sm text-slate-600 mt-2">
            Provide essential context to help Agent B assist the customer effectively
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <User className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Customer: {callerName}</span>
            <Clock className="h-4 w-4 text-blue-600 ml-auto" />
            <span className="text-sm text-blue-600">{new Date().toLocaleTimeString()}</span>
          </div>

          {/* Context Input */}
          <div className="space-y-2">
            <Label htmlFor="context" className="text-sm font-medium">
              Context Message *
            </Label>
            <Textarea
              id="context"
              placeholder="Describe the customer's issue, what has been tried, current status, and any specific requirements..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              {context.length}/500 characters • Be concise but informative
            </p>
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Suggestions:</Label>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full border border-slate-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="space-x-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!context.trim() || isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              'Continue Transfer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
