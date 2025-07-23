'use client'

import React from 'react'
import { MessageCircle, Plus, Sparkles } from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { Button } from '@/components/ui/button'

export function WelcomeScreen() {
  const { createSession } = useChat()

  const handleCreateSession = async () => {
    await createSession('New Chat')
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Welcome to Chat App
        </h2>
        
        <p className="text-muted-foreground mb-8">
          Start a new conversation to begin chatting with your AI assistant.
        </p>
        
        <Button 
          onClick={handleCreateSession}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Session
        </Button>
        
        <div className="mt-8 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Features</span>
          </div>
          <ul className="text-left space-y-1">
            <li>• Real-time chat with AI assistant</li>
            <li>• Session management and history</li>
            <li>• Multiple response formats</li>
            <li>• Dark and light themes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}