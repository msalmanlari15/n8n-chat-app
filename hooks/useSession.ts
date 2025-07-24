'use client'

import { useState, useCallback } from 'react'
import { ChatSession } from '@/types'
import { useChat } from '@/context/ChatContext'
import { VALIDATION_RULES } from '@/lib/constants'

interface UseSessionReturn {
  // Session operations
  createSession: (name?: string) => Promise<void>
  selectSession: (sessionId: string) => Promise<void>
  renameSession: (sessionId: string, newName: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  
  // Validation
  validateSessionName: (name: string) => string | null
  
  // UI state
  isCreating: boolean
  isDeleting: boolean
  isRenaming: boolean
  error: string | null
}

export function useSession(): UseSessionReturn {
  const { createSession, selectSession, renameSession, deleteSession } = useChat()
  
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateSession = useCallback(async (name?: string) => {
    setIsCreating(true)
    setError(null)
    
    try {
      if (name) {
        const validationError = validateSessionName(name)
        if (validationError) {
          setError(validationError)
          return
        }
      }
      
      await createSession(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setIsCreating(false)
    }
  }, [createSession])

  const handleSelectSession = useCallback(async (sessionId: string) => {
    setError(null)
    
    try {
      await selectSession(sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select session')
    }
  }, [selectSession])

  const handleRenameSession = useCallback(async (sessionId: string, newName: string) => {
    setIsRenaming(true)
    setError(null)
    
    try {
      const validationError = validateSessionName(newName)
      if (validationError) {
        setError(validationError)
        return
      }
      
      await renameSession(sessionId, newName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename session')
    } finally {
      setIsRenaming(false)
    }
  }, [renameSession])

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    setIsDeleting(true)
    setError(null)
    
    try {
      await deleteSession(sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session')
    } finally {
      setIsDeleting(false)
    }
  }, [deleteSession])

  const validateSessionName = useCallback((name: string): string | null => {
    if (!name.trim()) {
      return 'Session name cannot be empty'
    }
    
    if (name.length > VALIDATION_RULES.session.nameMaxLength) {
      return `Session name cannot exceed ${VALIDATION_RULES.session.nameMaxLength} characters`
    }
    
    if (name.length < VALIDATION_RULES.session.nameMinLength) {
      return `Session name must be at least ${VALIDATION_RULES.session.nameMinLength} character`
    }
    
    return null
  }, [])

  return {
    createSession: handleCreateSession,
    selectSession: handleSelectSession,
    renameSession: handleRenameSession,
    deleteSession: handleDeleteSession,
    validateSessionName,
    isCreating,
    isDeleting,
    isRenaming,
    error
  }
}