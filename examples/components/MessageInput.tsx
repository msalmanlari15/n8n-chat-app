/**
 * MessageInput Component
 * Handles message input with auto-resize and keyboard shortcuts
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Loader2, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageInputProps, MessageInputState } from '../types';

export const MessageInput: React.FC<MessageInputProps> = ({
  onSubmit,
  disabled = false,
  placeholder = "Type your message..."
}) => {
  const [state, setState] = useState<MessageInputState>({
    value: '',
    isSubmitting: false,
    error: null
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [state.value]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const message = state.value.trim();
    if (!message || state.isSubmitting) return;

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await onSubmit(message);
      setState(prev => ({ ...prev, value: '', isSubmitting: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }));
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, value: e.target.value, error: null }));
  };

  const isDisabled = disabled || state.isSubmitting;
  const hasContent = state.value.trim().length > 0;

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Error message */}
          {state.error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {state.error}
            </div>
          )}

          {/* Input area */}
          <div className="flex items-end gap-2">
            {/* Textarea */}
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={state.value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isDisabled}
                className={cn(
                  "min-h-[44px] max-h-[200px] resize-none",
                  "focus-visible:ring-1 focus-visible:ring-ring",
                  "transition-colors duration-200"
                )}
                rows={1}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {/* Attachment button (future feature) */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                className="h-11 w-11 p-0"
                title="Attach file (coming soon)"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              {/* Send button */}
              <Button
                type="submit"
                disabled={isDisabled || !hasContent}
                className={cn(
                  "h-11 w-11 p-0",
                  "transition-all duration-200",
                  hasContent ? "bg-primary hover:bg-primary/90" : "bg-muted"
                )}
                title="Send message (Enter)"
              >
                {state.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Keyboard hint */}
          <div className="text-xs text-muted-foreground text-right">
            Press Enter to send, Shift+Enter for new line
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Enhanced version with additional features
export const MessageInputAdvanced: React.FC<MessageInputProps & {
  onTyping?: (isTyping: boolean) => void;
  maxLength?: number;
  showCharCount?: boolean;
}> = ({
  onSubmit,
  disabled = false,
  placeholder = "Type your message...",
  onTyping,
  maxLength = 2000,
  showCharCount = false
}) => {
  const [state, setState] = useState<MessageInputState>({
    value: '',
    isSubmitting: false,
    error: null
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle typing indicator
  useEffect(() => {
    if (onTyping) {
      if (state.value.length > 0) {
        onTyping(true);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
        }, 1000);
      } else {
        onTyping(false);
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [state.value, onTyping]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [state.value]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const message = state.value.trim();
    if (!message || state.isSubmitting) return;

    if (message.length > maxLength) {
      setState(prev => ({ 
        ...prev, 
        error: `Message too long (${message.length}/${maxLength} characters)`
      }));
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await onSubmit(message);
      setState(prev => ({ ...prev, value: '', isSubmitting: false }));
      if (onTyping) onTyping(false);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }));
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setState(prev => ({ ...prev, value, error: null }));
    }
  };

  const isDisabled = disabled || state.isSubmitting;
  const hasContent = state.value.trim().length > 0;
  const charCount = state.value.length;
  const isNearLimit = charCount > maxLength * 0.8;

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Error message */}
          {state.error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {state.error}
            </div>
          )}

          {/* Input area */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={state.value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isDisabled}
                className={cn(
                  "min-h-[44px] max-h-[200px] resize-none",
                  "focus-visible:ring-1 focus-visible:ring-ring",
                  "transition-colors duration-200"
                )}
                rows={1}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                className="h-11 w-11 p-0"
                title="Attach file (coming soon)"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <Button
                type="submit"
                disabled={isDisabled || !hasContent}
                className={cn(
                  "h-11 w-11 p-0",
                  "transition-all duration-200",
                  hasContent ? "bg-primary hover:bg-primary/90" : "bg-muted"
                )}
                title="Send message (Enter)"
              >
                {state.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
            
            {showCharCount && (
              <span className={cn(
                "transition-colors",
                isNearLimit && "text-warning",
                charCount >= maxLength && "text-destructive"
              )}>
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Example usage
export const MessageInputExample: React.FC = () => {
  const handleSubmit = async (message: string) => {
    console.log('Sending message:', message);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="space-y-8 p-4 max-w-2xl mx-auto">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Message Input</h3>
        <MessageInput onSubmit={handleSubmit} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Advanced Message Input</h3>
        <MessageInputAdvanced
          onSubmit={handleSubmit}
          onTyping={(isTyping) => console.log('Typing:', isTyping)}
          maxLength={500}
          showCharCount={true}
        />
      </div>
    </div>
  );
};