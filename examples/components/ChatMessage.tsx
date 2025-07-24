/**
 * ChatMessage Component
 * Displays individual chat messages with dynamic content rendering
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, RefreshCw, User, Bot, Clock } from 'lucide-react';
import { ChatMessageProps, Message, ResponseData } from '../types';

// Response content renderer
const ResponseRenderer: React.FC<{ responseData: ResponseData }> = ({ responseData }) => {
  switch (responseData.type) {
    case 'text':
      return (
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{responseData.content}</p>
        </div>
      );

    case 'json':
      return (
        <Card className="bg-muted">
          <CardContent className="p-4">
            <pre className="text-sm overflow-x-auto">
              <code>{JSON.stringify(responseData.content, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      );

    case 'image':
      return (
        <div className="max-w-md">
          <img 
            src={responseData.content} 
            alt="Response image" 
            className="rounded-lg shadow-sm"
            loading="lazy"
          />
        </div>
      );

    case 'chart':
      // This would integrate with ShadCN Chart components
      return (
        <Card className="p-4">
          <div className="text-center text-muted-foreground">
            📊 Chart visualization would render here
          </div>
          <pre className="text-xs mt-2 text-muted-foreground">
            {JSON.stringify(responseData.content, null, 2)}
          </pre>
        </Card>
      );

    default:
      return (
        <div className="text-destructive">
          Unsupported response type: {responseData.type}
        </div>
      );
  }
};

// Message status indicator
const MessageStatus: React.FC<{ message: Message; isStreaming?: boolean }> = ({ 
  message, 
  isStreaming 
}) => {
  if (isStreaming) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <div className="animate-pulse">●</div>
        <span>Streaming...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
    </div>
  );
};

// Main ChatMessage component
export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isStreaming = false,
  onRetry 
}) => {
  const isUser = message.type === 'user';
  const isInterim = message.type === 'interim';

  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex max-w-[80%] gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message content */}
        <div className={cn(
          "flex flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}>
          {/* Message bubble */}
          <Card className={cn(
            "relative",
            isUser ? "bg-primary text-primary-foreground" : "bg-card",
            isInterim && "border-dashed border-2 border-yellow-500"
          )}>
            <CardContent className="p-3">
              {/* Interim message indicator */}
              {isInterim && (
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Workflow Progress
                  </Badge>
                </div>
              )}

              {/* Text content */}
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap m-0">{message.content}</p>
              </div>

              {/* Response data rendering */}
              {message.responseData && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <ResponseRenderer responseData={message.responseData} />
                </div>
              )}
            </CardContent>

            {/* Message tail */}
            <div className={cn(
              "absolute top-3 w-3 h-3 rotate-45",
              isUser ? 
                "-right-1 bg-primary" : 
                "-left-1 bg-card border-l border-t border-border"
            )} />
          </Card>

          {/* Message footer */}
          <div className="flex items-center gap-2">
            <MessageStatus message={message} isStreaming={isStreaming} />
            
            {/* Retry button for failed messages */}
            {message.type === 'assistant' && !isStreaming && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Example usage
export const ChatMessageExample: React.FC = () => {
  const exampleMessages: Message[] = [
    {
      id: '1',
      sessionId: 'session-1',
      content: 'Hello! Can you help me analyze this data?',
      type: 'user',
      timestamp: new Date(),
    },
    {
      id: '2',
      sessionId: 'session-1',
      content: 'Starting data analysis workflow...',
      type: 'interim',
      timestamp: new Date(),
    },
    {
      id: '3',
      sessionId: 'session-1',
      content: 'Here is your data analysis:',
      type: 'assistant',
      timestamp: new Date(),
      responseData: {
        type: 'json',
        content: {
          summary: 'Analysis complete',
          total_records: 1250,
          key_insights: ['Trend A', 'Trend B', 'Trend C']
        }
      }
    }
  ];

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      <h3 className="text-lg font-semibold">Chat Message Examples</h3>
      
      {exampleMessages.map((message) => (
        <ChatMessage 
          key={message.id} 
          message={message}
          onRetry={() => console.log('Retry message', message.id)}
        />
      ))}
    </div>
  );
};