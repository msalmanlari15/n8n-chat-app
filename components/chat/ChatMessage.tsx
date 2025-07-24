'use client'

import React, { useState } from 'react'
import { Message, ResponseData } from '@/types'
import { useChat } from '@/context/ChatContext'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import { ResponseRenderer } from './ResponseRenderer'
import ReactMarkdown from 'react-markdown'
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
export function ChatMessage({ 
  message, 
  isStreaming = false,
  onRetry 
}: ChatMessageProps) {
  const isUser = message.type === 'user'
  const isInterim = message.type === 'interim'
  const isAssistant = message.type === 'assistant'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

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

            {/* Text content */}
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
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Response data rendering - only for non-text types */}
            {message.responseData && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <div className="text-xs text-muted-foreground mb-2">
                  Debug: Type = {message.responseData.type}, Content type = {typeof message.responseData.content}
                  {Array.isArray(message.responseData.content) && `, Array length = ${message.responseData.content.length}`}
                </div>
                <ResponseRenderer responseData={message.responseData} />
              </div>
            )}
            
            {/* Debug: Log response data */}
            {message.responseData && console.log('Debug - Response data:', message.responseData)}

            {/* Copy button for assistant messages */}
            {isAssistant && (
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
            <MessageStatus message={message} isStreaming={isStreaming} />
            
            {/* Retry button for failed messages */}
            {isAssistant && !isStreaming && onRetry && (
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