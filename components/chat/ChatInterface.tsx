'use client'

import React, { useEffect, useRef } from 'react'
import { useChat } from '@/context/ChatContext'
import { ChatMessageEnhanced } from './ChatMessageEnhanced'
import { MessageInput } from './MessageInput'
import { StreamingIndicator } from './StreamingIndicator'
import { cn } from '@/lib/utils'
import { MessageCircle, Plus } from 'lucide-react'
import { useThinkingStatus } from '@/hooks/useThinkingStatus'

export function ChatInterface() {
  const { state, currentMessages, sendMessage, retryMessage, currentMessageId } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  // Hook for thinking status
  const { status: thinkingStatus } = useThinkingStatus(
    state.currentSessionId,
    currentMessageId,
    { enabled: state.isLoading }
  )

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentMessages])

  const handleRetryMessage = async (messageId: string) => {
    await retryMessage(messageId)
  }

  // Show empty state when no session is selected
  if (!state.currentSessionId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No Session Selected</h2>
          <p className="text-muted-foreground mb-4">
            Select an existing session from the sidebar or create a new one to start chatting.
          </p>
          <button
            onClick={() => {
              // This would trigger session creation
              console.log('Create new session')
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 min-h-0"
      >
        {/* Empty state for session with no messages */}
        {currentMessages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
              <p className="text-muted-foreground mb-4">
                Send your first message to begin chatting with the AI assistant.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {currentMessages.map((message) => (
          <ChatMessageEnhanced
            key={message.id}
            message={message}
            onRetry={() => handleRetryMessage(message.id)}
          />
        ))}

        {/* Loading indicator with thinking status */}
        {state.isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <StreamingIndicator 
                message={thinkingStatus?.message || "Processing your message..."} 
                type={thinkingStatus?.type || "processing"}
              />
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input - sticky at bottom */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm p-4">
        <MessageInput 
          onSubmit={sendMessage}
          disabled={state.isLoading}
          placeholder="Type your message..."
        />
      </div>
    </div>
  )
}