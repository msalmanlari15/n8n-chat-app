/**
 * useChat Hook
 * Manages chat state, session operations, and message handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatState, ChatSession, Message, N8NRequest, N8NResponse } from '../types';
import { createN8NClient, N8NError, n8nUtils } from '../lib/n8n-client';
import { createMockAPIClient, MockAPIError, mockAPIUtils } from '../lib/mockapi-client';

export interface UseChatConfig {
  n8nWebhookUrl: string;
  n8nStreamingUrl: string;
  mockApiBaseUrl: string;
  mockApiProjectId: string;
}

export interface UseChatReturn {
  // State
  state: ChatState;
  
  // Session operations
  createSession: (name?: string) => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newName: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Message operations
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  
  // UI operations
  toggleSidebar: () => void;
  toggleTheme: () => void;
  
  // Utility
  clearError: () => void;
}

export function useChat(config: UseChatConfig): UseChatReturn {
  // Initialize clients
  const n8nClient = useRef(createN8NClient({
    webhookUrl: config.n8nWebhookUrl,
    streamingUrl: config.n8nStreamingUrl
  }));
  
  const mockApiClient = useRef(createMockAPIClient({
    baseUrl: config.mockApiBaseUrl,
    projectId: config.mockApiProjectId
  }));

  // State
  const [state, setState] = useState<ChatState>({
    sessions: [],
    currentSessionId: null,
    isLoading: false,
    error: null,
    sidebarCollapsed: false,
    theme: 'light'
  });

  // Current session messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadSessions();
    loadTheme();
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (state.currentSessionId) {
      loadMessages(state.currentSessionId);
    } else {
      setMessages([]);
    }
  }, [state.currentSessionId]);

  /**
   * Load all sessions
   */
  const loadSessions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const sessions = await mockApiClient.current.getSessions();
      setState(prev => ({ 
        ...prev, 
        sessions, 
        isLoading: false,
        // Select first session if none selected
        currentSessionId: prev.currentSessionId || (sessions[0]?.id ?? null)
      }));
    } catch (error) {
      const errorMessage = error instanceof MockAPIError 
        ? mockAPIUtils.formatError(error)
        : 'Failed to load sessions';
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
    }
  }, []);

  /**
   * Load messages for a session
   */
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const sessionMessages = await mockApiClient.current.getMessages(sessionId);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  /**
   * Create new session
   */
  const createSession = useCallback(async (name?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const sessionName = name || `Chat ${new Date().toLocaleString()}`;
      const session = await mockApiClient.current.createSession(sessionName);
      
      setState(prev => ({ 
        ...prev, 
        sessions: [session, ...prev.sessions],
        currentSessionId: session.id,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof MockAPIError 
        ? mockAPIUtils.formatError(error)
        : 'Failed to create session';
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
    }
  }, []);

  /**
   * Select session
   */
  const selectSession = useCallback(async (sessionId: string) => {
    setState(prev => ({ ...prev, currentSessionId: sessionId }));
    
    // Update session activity
    try {
      await mockApiClient.current.updateSessionActivity(sessionId);
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }, []);

  /**
   * Rename session
   */
  const renameSession = useCallback(async (sessionId: string, newName: string) => {
    const validationError = mockAPIUtils.validateSessionName(newName);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      return;
    }

    try {
      const updatedSession = await mockApiClient.current.updateSession(sessionId, { name: newName });
      
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.id === sessionId ? updatedSession : session
        )
      }));
    } catch (error) {
      const errorMessage = error instanceof MockAPIError 
        ? mockAPIUtils.formatError(error)
        : 'Failed to rename session';
      
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  /**
   * Delete session
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await mockApiClient.current.deleteSession(sessionId);
      
      setState(prev => {
        const newSessions = prev.sessions.filter(s => s.id !== sessionId);
        const newCurrentSessionId = prev.currentSessionId === sessionId 
          ? (newSessions[0]?.id ?? null)
          : prev.currentSessionId;
        
        return {
          ...prev,
          sessions: newSessions,
          currentSessionId: newCurrentSessionId
        };
      });
    } catch (error) {
      const errorMessage = error instanceof MockAPIError 
        ? mockAPIUtils.formatError(error)
        : 'Failed to delete session';
      
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  /**
   * Send message
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!state.currentSessionId) {
      setState(prev => ({ ...prev, error: 'No session selected' }));
      return;
    }

    setState(prev => ({ ...prev, error: null }));

    // Create user message
    const userMessage: Omit<Message, 'id'> = {
      sessionId: state.currentSessionId,
      content,
      type: 'user',
      timestamp: new Date()
    };

    try {
      // Save user message
      const savedUserMessage = await mockApiClient.current.createMessage(userMessage);
      setMessages(prev => [...prev, savedUserMessage]);

      // Prepare n8n request
      const n8nRequest: N8NRequest = {
        username: 'user', // This could come from user context
        message: content,
        sessionId: state.currentSessionId,
        timestamp: new Date()
      };

      // Start streaming for interim messages
      const streamingPromise = handleStreaming(state.currentSessionId);

      // Send to n8n
      const response = await n8nClient.current.sendMessageWithRetry(n8nRequest);

      // Create assistant message
      const assistantMessage: Omit<Message, 'id'> = {
        sessionId: state.currentSessionId,
        content: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
        type: 'assistant',
        timestamp: new Date(),
        responseData: {
          type: response.messageType,
          content: response.content,
          metadata: response.metadata
        }
      };

      // Save assistant message
      const savedAssistantMessage = await mockApiClient.current.createMessage(assistantMessage);
      setMessages(prev => [...prev, savedAssistantMessage]);

      // Update session in state
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.id === state.currentSessionId
            ? { ...session, metadata: { ...session.metadata, messageCount: session.metadata.messageCount + 2 } }
            : session
        )
      }));

    } catch (error) {
      const errorMessage = error instanceof N8NError 
        ? n8nUtils.formatError(error)
        : 'Failed to send message';
      
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [state.currentSessionId]);

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
          };

          // Save and display interim message
          const savedInterimMessage = await mockApiClient.current.createMessage(interimMessage);
          setMessages(prev => [...prev, savedInterimMessage]);
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
    }
  }, []);

  /**
   * Retry failed message
   */
  const retryMessage = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.type !== 'user') return;

    await sendMessage(message.content);
  }, [messages, sendMessage]);

  /**
   * Toggle sidebar
   */
  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  /**
   * Toggle theme
   */
  const toggleTheme = useCallback(() => {
    setState(prev => {
      const newTheme = prev.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('chat-theme', newTheme);
      return { ...prev, theme: newTheme };
    });
  }, []);

  /**
   * Load theme from localStorage
   */
  const loadTheme = useCallback(() => {
    const savedTheme = localStorage.getItem('chat-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setState(prev => ({ ...prev, theme: savedTheme }));
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Update current session with messages
  const currentSession = state.sessions.find(s => s.id === state.currentSessionId);
  const stateWithMessages = {
    ...state,
    sessions: state.sessions.map(session =>
      session.id === state.currentSessionId
        ? { ...session, messages }
        : session
    )
  };

  return {
    state: stateWithMessages,
    createSession,
    selectSession,
    renameSession,
    deleteSession,
    sendMessage,
    retryMessage,
    toggleSidebar,
    toggleTheme,
    clearError
  };
}

// Example usage
export const useChatExample = () => {
  const chatConfig = {
    n8nWebhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!,
    n8nStreamingUrl: process.env.NEXT_PUBLIC_N8N_STREAMING_URL!,
    mockApiBaseUrl: process.env.NEXT_PUBLIC_MOCKAPI_BASE_URL!,
    mockApiProjectId: process.env.NEXT_PUBLIC_MOCKAPI_PROJECT_ID!
  };

  const chat = useChat(chatConfig);

  return chat;
};