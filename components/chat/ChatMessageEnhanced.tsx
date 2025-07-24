'use client'

import React, { useState, useEffect } from 'react'
import { Message, ResponseData } from '@/types'
import { useChat } from '@/context/ChatContext'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import { ResponseRenderer } from './ResponseRenderer'
import ReactMarkdown from 'react-markdown'
import { useStreamingText } from '@/hooks/useThinkingStatus'
import { 
  MessageCircle, 
  RefreshCw, 
  User, 
  Bot, 
  Clock,
  AlertCircle,
  Copy,
  CheckCircle
} from 'lucide-react'

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
  onRetry?: () => void
}

// Message status indicator
const MessageStatus: React.FC<{ message: Message; isStreaming?: boolean }> = ({ 
  message, 
  isStreaming 
}) => {
  if (isStreaming) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <span>Streaming...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>{formatTime(message.timestamp)}</span>
    </div>
  )
}

// Main ChatMessage component
export function ChatMessageEnhanced({ 
  message, 
  isStreaming = false,
  onRetry 
}: ChatMessageProps) {
  const isUser = message.type === 'user'
  const isInterim = message.type === 'interim'
  const isAssistant = message.type === 'assistant'
  const [copied, setCopied] = useState(false)
  const [isNewMessage, setIsNewMessage] = useState(false)

  // Check if this is a new assistant message that should be streamed
  useEffect(() => {
    if (isAssistant && message.timestamp) {
      const messageAge = Date.now() - new Date(message.timestamp).getTime()
      console.log('Message age check:', {
        messageId: message.id,
        messageAge,
        timestamp: message.timestamp,
        isNewMessage: messageAge < 10000
      })
      // Increased to 10 seconds to account for n8n processing time
      setIsNewMessage(messageAge < 10000)
    }
  }, [isAssistant, message.timestamp])

  // Get content for streaming - extract actual text from responseData
  const contentForStreaming = isAssistant && message.responseData?.content 
    ? (() => {
        const content = message.responseData.content;
        console.log('Raw responseData content:', content);
        console.log('Content type:', typeof content);
        
        if (typeof content === 'string') {
          console.log('Using string content for streaming:', content);
          return content;
        }
        // Extract text from object or array - look for text fields like text1, text2, etc.
        if (typeof content === 'object' && content !== null) {
          let allTextFields = [];
          
          // Handle array case
          if (Array.isArray(content)) {
            console.log('Content is array, processing each item');
            content.forEach((item, index) => {
              if (typeof item === 'object' && item !== null) {
                Object.entries(item).forEach(([key, value]) => {
                  if (key.startsWith('text') && typeof value === 'string') {
                    allTextFields.push(value);
                  }
                });
              }
            });
          } else {
            // Handle object case
            Object.entries(content).forEach(([key, value]) => {
              if (key.startsWith('text') && typeof value === 'string') {
                allTextFields.push(value);
              }
            });
          }
          
          const extractedText = allTextFields.join('\n\n');
          console.log('Extracted text fields:', extractedText);
          
          if (extractedText) {
            console.log('Using extracted text for streaming:', extractedText);
            return extractedText;
          }
          
          console.log('No text fields found, using JSON');
          return JSON.stringify(content, null, 2);
        }
        return JSON.stringify(content, null, 2);
      })()
    : message.content;

  // Use streaming text for new assistant messages
  const { displayedText, isStreaming: isTextStreaming } = useStreamingText(
    contentForStreaming,
    { 
      enabled: isAssistant && isNewMessage && !isStreaming && contentForStreaming,
      speed: 2 // Faster streaming speed
    }
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const displayContent = isAssistant && isNewMessage && !isStreaming 
    ? displayedText 
    : message.content

  return (
    <div className={cn(
      "flex w-full mb-6 group",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex gap-3 min-w-0",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary text-secondary-foreground"
        )}>
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>

        {/* Message content */}
        <div className={cn(
          "flex flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}>
          {/* Message bubble */}
          <div className={cn(
            "relative rounded-lg px-4 py-3 shadow-sm transition-all duration-200 group min-w-0 max-w-[78vw] overflow-hidden",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-card border border-border",
            isInterim && "border-dashed border-2 border-warning/50 bg-warning/5",
            "hover:shadow-md"
          )}>
            {/* Interim message indicator */}
            {isInterim && (
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-warning/20">
                <div className="flex items-center gap-1 text-xs text-warning">
                  <MessageCircle className="h-3 w-3" />
                  <span className="font-medium">Workflow Progress</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            {/* Content rendering */}
            {isAssistant && message.responseData && !isTextStreaming ? (
              // Show ResponseRenderer when streaming is complete
              <ResponseRenderer responseData={message.responseData} />
            ) : (
              // Show streaming text or regular content
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                <ReactMarkdown 
                  components={{
                    a: ({ node, ...props }) => (
                      <a 
                        {...props} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p {...props} className="m-0 break-words" />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul {...props} className="my-2 pl-4" />
                    ),
                    li: ({ node, ...props }) => (
                      <li {...props} className="mb-1" />
                    )
                  }}
                >
                  {displayContent}
                </ReactMarkdown>
                
                {/* Streaming cursor */}
                {isTextStreaming && (
                  <span className="inline-block w-1 h-4 bg-current animate-pulse ml-0.5" />
                )}
              </div>
            )}

            {/* Copy button for assistant messages */}
            {isAssistant && !isTextStreaming && (
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                title="Copy text"
              >
                {copied ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            )}

          </div>

          {/* Message footer */}
          <div className={cn(
            "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "flex-row-reverse" : "flex-row"
          )}>
            <MessageStatus message={message} isStreaming={isStreaming || isTextStreaming} />
            
            {/* Retry button for failed messages */}
            {isAssistant && !isStreaming && !isTextStreaming && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
                title="Retry message"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            )}
            
            {/* Error indicator */}
            {message.responseData?.type === 'error' && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>Error</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
