'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2, Zap, Activity } from 'lucide-react'

interface StreamingIndicatorProps {
  message?: string
  type?: 'typing' | 'processing' | 'thinking'
  className?: string
}

export function StreamingIndicator({ 
  message = 'Processing...', 
  type = 'processing',
  className 
}: StreamingIndicatorProps) {
  const getIcon = () => {
    switch (type) {
      case 'typing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'processing':
        return <Activity className="h-4 w-4 animate-pulse" />
      case 'thinking':
        return <Zap className="h-4 w-4 animate-bounce" />
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />
    }
  }

  const getAnimationClass = () => {
    switch (type) {
      case 'typing':
        return 'animate-pulse'
      case 'processing':
        return 'animate-pulse'
      case 'thinking':
        return 'animate-bounce'
      default:
        return 'animate-pulse'
    }
  }

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg',
      'text-sm text-muted-foreground',
      className
    )}>
      {getIcon()}
      <span className={getAnimationClass()}>{message}</span>
      
      {/* Typing dots animation */}
      {type === 'typing' && (
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></div>
        </div>
      )}
    </div>
  )
}