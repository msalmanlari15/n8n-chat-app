'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { ChatState, ChatSession, Message, N8NRequest, N8NResponse } from '@/types'
import { createN8NClient, N8NError, n8nUtils } from '@/lib/n8n-client'
import { createMockAPIClient, MockAPIError, mockAPIUtils } from '@/lib/mockapi-client'
import { API_CONFIG, UI_CONFIG, STORAGE_KEYS } from '@/lib/constants'

interface ChatContextType {
  // State
  state: ChatState
  currentMessages: Message[]
  currentMessageId: string | null
  
  // Session operations
  createSession: (name?: string) => Promise<void>
  selectSession: (sessionId: string) => Promise<void>
  renameSession: (sessionId: string, newName: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  
  // Message operations
  sendMessage: (content: string) => Promise<void>
  retryMessage: (messageId: string) => Promise<void>
  
  // UI operations
  toggleSidebar: () => void
  
  // Utility
  clearError: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: React.ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  // Initialize clients
  const n8nClient = useRef(createN8NClient({
    webhookUrl: API_CONFIG.n8n.webhookUrl,
    streamingUrl: API_CONFIG.n8n.streamingUrl,
    timeout: API_CONFIG.n8n.timeout,
    retryAttempts: API_CONFIG.n8n.retryAttempts,
    retryDelay: API_CONFIG.n8n.retryDelay
  }))
  
  const mockApiClient = useRef(createMockAPIClient({
    baseUrl: API_CONFIG.mockApi.baseUrl,
    projectId: API_CONFIG.mockApi.projectId,
    timeout: API_CONFIG.mockApi.timeout
  }))

  // State
  const [state, setState] = useState<ChatState>({
    sessions: [],
    currentSessionId: null,
    isLoading: false,
    error: null,
    sidebarCollapsed: false,
    theme: 'light'
  })

  // Current session messages
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null)
  const sendingMessageRef = useRef<boolean>(false)

  // Load initial data
  useEffect(() => {
    loadSessions()
    loadSidebarState()
  }, [])

  // Load messages when session changes
  useEffect(() => {
    if (state.currentSessionId) {
      loadMessages(state.currentSessionId)
    } else {
      setCurrentMessages([])
    }
  }, [state.currentSessionId])

  /**
   * Load all sessions
   */
  const loadSessions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const sessions = await mockApiClient.current.getSessions()
      const savedSessionId = localStorage.getItem(STORAGE_KEYS.sessionId)
      
      setState(prev => ({ 
        ...prev, 
        sessions, 
        isLoading: false,
        // Select saved session or first session if none selected
        currentSessionId: savedSessionId && sessions.find(s => s.id === savedSessionId) 
          ? savedSessionId 
          : (sessions[0]?.id ?? null)
      }))
    } catch (error) {
      const errorMessage = error instanceof MockAPIError 
        ? mockAPIUtils.formatError(error)
        : 'Failed to load sessions'
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }))
    }
  }, [])

  /**
   * Load messages for a session
   */
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const sessionMessages = await mockApiClient.current.getMessages(sessionId)
      console.log('Loading messages for session:', sessionId, 'count:', sessionMessages.length)
      console.log('Message IDs:', sessionMessages.map(m => m.id))
      setCurrentMessages(sessionMessages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }, [])

  /**
   * Create new session
   */
  const createSession = useCallback(async (name?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const sessionName = name || `Chat ${new Date().toLocaleString()}`
      const session = await mockApiClient.current.createSession(sessionName)
      
      setState(prev => ({ 
        ...prev, 
        sessions: [session, ...prev.sessions],
        currentSessionId: session.id,
        isLoading: false
      }))
      
      // Save current session to localStorage
      localStorage.setItem(STORAGE_KEYS.sessionId, session.id)
      
    } catch (error) {
      const errorMessage = error instanceof MockAPIError 
        ? mockAPIUtils.formatError(error)
        : 'Failed to create session'
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }))
    }
  }, [])

  /**
   * Select session
   */
  const selectSession = useCallback(async (sessionId: string) => {
    setState(prev => ({ ...prev, currentSessionId: sessionId }))
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.sessionId, sessionId)
    
    // Update session activity
    try {
      await mockApiClient.current.updateSessionActivity(sessionId)
    } catch (error) {
      console.error('Failed to update session activity:', error)
    }
  }, [])

  /**
   * Rename session
   */
  const renameSession = useCallback(async (sessionId: string, newName: string) => {
    const validationError = mockAPIUtils.validateSessionName(newName)
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }))
      return
    }

    try {
      const updatedSession = await mockApiClient.current.updateSession(sessionId, { name: newName })
      
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.id === sessionId ? updatedSession : session
        )
      }))
    } catch (error) {
      const errorMessage = error instanceof MockAPIError 
        ? mockAPIUtils.formatError(error)
        : 'Failed to rename session'
      
      setState(prev => ({ ...prev, error: errorMessage }))
    }
  }, [])

  /**
   * Delete session
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await mockApiClient.current.deleteSession(sessionId)
      
      setState(prev => {
        const newSessions = prev.sessions.filter(s => s.id !== sessionId)
        const newCurrentSessionId = prev.currentSessionId === sessionId 
          ? (newSessions[0]?.id ?? null)
          : prev.currentSessionId
        
        // Update localStorage
        if (newCurrentSessionId) {
          localStorage.setItem(STORAGE_KEYS.sessionId, newCurrentSessionId)
        } else {
          localStorage.removeItem(STORAGE_KEYS.sessionId)
        }
        
        return {
          ...prev,
          sessions: newSessions,
          currentSessionId: newCurrentSessionId
        }
      })
    } catch (error) {
      const errorMessage = error instanceof MockAPIError 
        ? mockAPIUtils.formatError(error)
        : 'Failed to delete session'
      
      setState(prev => ({ ...prev, error: errorMessage }))
    }
  }, [])

  /**
   * Send message
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!state.currentSessionId) {
      setState(prev => ({ ...prev, error: 'No session selected' }))
      return
    }

    // Prevent double submissions with ref
    if (sendingMessageRef.current) {
      console.log('Already sending message, ignoring duplicate request')
      return
    }

    sendingMessageRef.current = true
    setState(prev => ({ ...prev, error: null, isLoading: true }))

    // Generate a temporary message ID for tracking
    const tempMessageId = `temp-${Date.now()}`
    setCurrentMessageId(tempMessageId)

    // Create user message
    const userMessage: Omit<Message, 'id'> = {
      sessionId: state.currentSessionId,
      content,
      type: 'user',
      timestamp: new Date()
    }

    try {
      // Save user message
      const savedUserMessage = await mockApiClient.current.createMessage(userMessage)
      console.log('Adding user message:', savedUserMessage.id)
      setCurrentMessages(prev => {
        // Check if this message already exists to prevent duplicates
        const exists = prev.some(msg => msg.id === savedUserMessage.id)
        if (exists) {
          console.log('User message already exists, skipping:', savedUserMessage.id)
          return prev
        }
        console.log('Adding new user message to state:', savedUserMessage.id)
        return [...prev, savedUserMessage]
      })

      // Prepare n8n request with message ID for tracking
      const n8nRequest: N8NRequest = {
        username: 'user', // This could come from user context
        message: content,
        sessionId: state.currentSessionId,
        timestamp: new Date(),
        messageId: tempMessageId // Add this to track thinking updates
      }

      // Send to n8n
      const response = await n8nClient.current.sendMessageWithRetry(n8nRequest)

      // Create assistant message
      const assistantMessage: Omit<Message, 'id'> = {
        sessionId: state.currentSessionId,
        content: '', // Leave empty - ResponseRenderer will handle display
        type: 'assistant',
        timestamp: new Date(),
        responseData: {
          type: response.messageType,
          content: response.content,
          metadata: response.metadata
        }
      }

      // Save assistant message
      const savedAssistantMessage = await mockApiClient.current.createMessage(assistantMessage)
      console.log('Adding assistant message:', savedAssistantMessage.id)
      setCurrentMessages(prev => {
        // Check if this message already exists to prevent duplicates
        const exists = prev.some(msg => msg.id === savedAssistantMessage.id)
        if (exists) {
          console.log('Assistant message already exists, skipping:', savedAssistantMessage.id)
          return prev
        }
        console.log('Adding new assistant message to state:', savedAssistantMessage.id)
        return [...prev, savedAssistantMessage]
      })

      // Update session in state
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.id === state.currentSessionId
            ? { ...session, metadata: { ...session.metadata, messageCount: session.metadata.messageCount + 2 } }
            : session
        )
      }))

      // Clear loading state and message ID on success
      setState(prev => ({ ...prev, isLoading: false }))
      setCurrentMessageId(null)

    } catch (error) {
      const errorMessage = error instanceof N8NError 
        ? n8nUtils.formatError(error)
        : 'Failed to send message'
      
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      setCurrentMessageId(null)
    } finally {
      sendingMessageRef.current = false
    }
  }, [state.currentSessionId])

  /**
   * Handle streaming messages
   */
  const handleStreaming = useCallback(async (sessionId: string) => {
    try {
      for await (const response of n8nClient.current.streamMessages(sessionId)) {
        if (n8nUtils.isInterimMessage(response)) {
          // Create interim message
          const interimMessage: Omit<Message, 'id'> = {
            sessionId,
            content: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
            type: 'interim',
            timestamp: new Date(),
            responseData: {
              type: response.messageType,
              content: response.content,
              metadata: response.metadata
            }
          }

          // Save and display interim message
          const savedInterimMessage = await mockApiClient.current.createMessage(interimMessage)
          setCurrentMessages(prev => [...prev, savedInterimMessage])
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
    }
  }, [])

  /**
   * Retry failed message
   */
  const retryMessage = useCallback(async (messageId: string) => {
    const message = currentMessages.find(m => m.id === messageId)
    if (!message || message.type !== 'user') return

    await sendMessage(message.content)
  }, [currentMessages, sendMessage])

  /**
   * Toggle sidebar
   */
  const toggleSidebar = useCallback(() => {
    setState(prev => {
      const newCollapsed = !prev.sidebarCollapsed
      localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, String(newCollapsed))
      return { ...prev, sidebarCollapsed: newCollapsed }
    })
  }, [])

  /**
   * Load sidebar state from localStorage
   */
  const loadSidebarState = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed)
    if (saved) {
      setState(prev => ({ ...prev, sidebarCollapsed: saved === 'true' }))
    }
  }, [])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const value: ChatContextType = {
    state,
    currentMessages,
    currentMessageId,
    createSession,
    selectSession,
    renameSession,
    deleteSession,
    sendMessage,
    retryMessage,
    toggleSidebar,
    clearError
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}