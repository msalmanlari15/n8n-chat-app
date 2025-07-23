'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useChat } from '@/context/ChatContext'
import { cn } from '@/lib/utils'
import { VALIDATION_RULES, KEYBOARD_SHORTCUTS } from '@/lib/constants'
import { 
  Send, 
  Plus, 
  Paperclip, 
  Loader2,
  AlertCircle
} from 'lucide-react'

interface MessageInputProps {
  onSubmit?: (message: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function MessageInput({ 
  onSubmit, 
  disabled = false, 
  placeholder = "Type a message...",
  className 
}: MessageInputProps) {
  const { sendMessage, state } = useChat()
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isDisabled = disabled || isSubmitting || state.isLoading || !state.currentSessionId

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [message, adjustTextareaHeight])

  const validateMessage = (content: string): string | null => {
    if (!content.trim()) {
      return 'Message cannot be empty'
    }
    
    if (content.length > VALIDATION_RULES.message.contentMaxLength) {
      return `Message cannot exceed ${VALIDATION_RULES.message.contentMaxLength} characters`
    }
    
    return null
  }

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (isDisabled) return
    
    const trimmedMessage = message.trim()
    const validationError = validateMessage(trimmedMessage)
    
    if (validationError) {
      setError(validationError)
      return
    }
    
    setError(null)
    setIsSubmitting(true)
    
    try {
      if (onSubmit) {
        await onSubmit(trimmedMessage)
      } else {
        await sendMessage(trimmedMessage)
      }
      
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }, [message, isDisabled, onSubmit, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    setError(null)
  }, [])

  const handleFocus = useCallback(() => {
    setError(null)
  }, [])

  const characterCount = message.length
  const maxLength = VALIDATION_RULES.message.contentMaxLength
  const isNearLimit = characterCount > maxLength * 0.8

  return (
    <div className={cn('w-full', className)}>
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}
        
        {/* No session warning */}
        {!state.currentSessionId && (
          <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
            <span className="text-sm text-warning">Please select or create a session to send messages</span>
          </div>
        )}

        {/* Input container */}
        <div className={cn(
          'relative flex items-end gap-2 p-3 bg-card border border-border rounded-lg',
          'focus-within:ring-2 focus-within:ring-ring focus-within:border-ring',
          'transition-colors duration-200',
          isDisabled && 'opacity-50'
        )}>
          {/* Attachment button (placeholder) */}
          <button
            type="button"
            disabled={isDisabled}
            className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            title="Attach file (coming soon)"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground',
              'focus:outline-none',
              'max-h-[200px] overflow-y-auto'
            )}
            style={{ minHeight: '20px' }}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={isDisabled || !message.trim()}
            className={cn(
              'flex-shrink-0 p-2 rounded-md transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              message.trim() && !isDisabled
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
            title="Send message (Enter)"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-1">
          {/* Character count */}
          <div className={cn(
            'text-xs transition-colors',
            isNearLimit ? 'text-warning' : 'text-muted-foreground'
          )}>
            {characterCount}/{maxLength}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="text-xs text-muted-foreground">
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send • <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> for new line
          </div>
        </div>
      </form>
    </div>
  )
}