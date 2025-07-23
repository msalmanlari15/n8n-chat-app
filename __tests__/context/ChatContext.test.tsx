import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ChatProvider, useChat } from '@/context/ChatContext'
import { ChatSession, Message } from '@/types'

// Mock the clients
jest.mock('@/lib/n8n-client', () => ({
  createN8NClient: jest.fn(() => ({
    sendMessageWithRetry: jest.fn(),
    streamMessages: jest.fn(),
  })),
  n8nUtils: {
    formatError: jest.fn((error) => `N8N Error: ${error.message}`),
  },
}))

jest.mock('@/lib/mockapi-client', () => ({
  createMockAPIClient: jest.fn(() => ({
    getSessions: jest.fn(),
    createSession: jest.fn(),
    updateSession: jest.fn(),
    deleteSession: jest.fn(),
    getMessages: jest.fn(),
    createMessage: jest.fn(),
    updateSessionActivity: jest.fn(),
  })),
  mockAPIUtils: {
    validateSessionName: jest.fn(),
    formatError: jest.fn((error) => `MockAPI Error: ${error.message}`),
  },
}))

const mockN8NClient = require('@/lib/n8n-client').createN8NClient()
const mockMockAPIClient = require('@/lib/mockapi-client').createMockAPIClient()

describe('ChatContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ChatProvider>{children}</ChatProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('Initial state', () => {
    it('should initialize with empty sessions and no current session', async () => {
      mockMockAPIClient.getSessions.mockResolvedValue([])

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.state.sessions).toEqual([])
        expect(result.current.state.currentSessionId).toBeNull()
        expect(result.current.state.isLoading).toBe(false)
        expect(result.current.state.error).toBeNull()
      })
    })

    it('should load existing sessions', async () => {
      const mockSessions: ChatSession[] = [
        {
          id: 'session-1',
          name: 'Test Session',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: {
            messageCount: 0,
            lastActivity: new Date('2024-01-01'),
            isActive: true,
          },
        },
      ]

      mockMockAPIClient.getSessions.mockResolvedValue(mockSessions)

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.state.sessions).toEqual(mockSessions)
        expect(result.current.state.currentSessionId).toBe('session-1')
      })
    })
  })

  describe('createSession', () => {
    it('should create a new session', async () => {
      const newSession: ChatSession = {
        id: 'new-session',
        name: 'New Session',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        metadata: {
          messageCount: 0,
          lastActivity: new Date('2024-01-01'),
          isActive: true,
        },
      }

      mockMockAPIClient.getSessions.mockResolvedValue([])
      mockMockAPIClient.createSession.mockResolvedValue(newSession)

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.createSession('New Session')
      })

      await waitFor(() => {
        expect(result.current.state.sessions).toContainEqual(newSession)
        expect(result.current.state.currentSessionId).toBe('new-session')
      })

      expect(mockMockAPIClient.createSession).toHaveBeenCalledWith('New Session')
    })

    it('should handle session creation error', async () => {
      mockMockAPIClient.getSessions.mockResolvedValue([])
      mockMockAPIClient.createSession.mockRejectedValue(new Error('Creation failed'))

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.createSession('New Session')
      })

      await waitFor(() => {
        expect(result.current.state.error).toBe('MockAPI Error: Creation failed')
      })
    })
  })

  describe('selectSession', () => {
    it('should select a session and load messages', async () => {
      const mockSessions: ChatSession[] = [
        {
          id: 'session-1',
          name: 'Session 1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: {
            messageCount: 0,
            lastActivity: new Date('2024-01-01'),
            isActive: true,
          },
        },
      ]

      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          sessionId: 'session-1',
          content: 'Test message',
          type: 'user',
          timestamp: new Date('2024-01-01'),
        },
      ]

      mockMockAPIClient.getSessions.mockResolvedValue(mockSessions)
      mockMockAPIClient.getMessages.mockResolvedValue(mockMessages)
      mockMockAPIClient.updateSessionActivity.mockResolvedValue(undefined)

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.selectSession('session-1')
      })

      await waitFor(() => {
        expect(result.current.state.currentSessionId).toBe('session-1')
        expect(result.current.currentMessages).toEqual(mockMessages)
      })

      expect(mockMockAPIClient.updateSessionActivity).toHaveBeenCalledWith('session-1')
    })
  })

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockSessions: ChatSession[] = [
        {
          id: 'session-1',
          name: 'Session 1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: {
            messageCount: 0,
            lastActivity: new Date('2024-01-01'),
            isActive: true,
          },
        },
      ]

      const userMessage: Message = {
        id: 'user-msg-1',
        sessionId: 'session-1',
        content: 'Hello',
        type: 'user',
        timestamp: new Date('2024-01-01'),
      }

      const assistantMessage: Message = {
        id: 'assistant-msg-1',
        sessionId: 'session-1',
        content: 'Hello back!',
        type: 'assistant',
        timestamp: new Date('2024-01-01'),
        responseData: {
          type: 'text',
          content: 'Hello back!',
          metadata: { timestamp: new Date('2024-01-01') },
        },
      }

      mockMockAPIClient.getSessions.mockResolvedValue(mockSessions)
      mockMockAPIClient.getMessages.mockResolvedValue([])
      mockMockAPIClient.createMessage
        .mockResolvedValueOnce(userMessage)
        .mockResolvedValueOnce(assistantMessage)

      mockN8NClient.sendMessageWithRetry.mockResolvedValue({
        type: 'final',
        messageType: 'text',
        content: 'Hello back!',
        metadata: { timestamp: new Date('2024-01-01') },
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.state.currentSessionId).toBe('session-1')
      })

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      await waitFor(() => {
        expect(result.current.currentMessages).toHaveLength(2)
        expect(result.current.currentMessages[0]).toEqual(userMessage)
        expect(result.current.currentMessages[1]).toEqual(assistantMessage)
      })

      expect(mockN8NClient.sendMessageWithRetry).toHaveBeenCalledWith({
        username: 'user',
        message: 'Hello',
        sessionId: 'session-1',
        timestamp: expect.any(Date),
      })
    })

    it('should handle message sending error', async () => {
      const mockSessions: ChatSession[] = [
        {
          id: 'session-1',
          name: 'Session 1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: {
            messageCount: 0,
            lastActivity: new Date('2024-01-01'),
            isActive: true,
          },
        },
      ]

      const userMessage: Message = {
        id: 'user-msg-1',
        sessionId: 'session-1',
        content: 'Hello',
        type: 'user',
        timestamp: new Date('2024-01-01'),
      }

      mockMockAPIClient.getSessions.mockResolvedValue(mockSessions)
      mockMockAPIClient.getMessages.mockResolvedValue([])
      mockMockAPIClient.createMessage.mockResolvedValueOnce(userMessage)

      mockN8NClient.sendMessageWithRetry.mockRejectedValue(new Error('N8N Error'))

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.state.currentSessionId).toBe('session-1')
      })

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      await waitFor(() => {
        expect(result.current.state.error).toBe('N8N Error: N8N Error')
        expect(result.current.state.isLoading).toBe(false)
      })
    })

    it('should prevent double submissions', async () => {
      const mockSessions: ChatSession[] = [
        {
          id: 'session-1',
          name: 'Session 1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: {
            messageCount: 0,
            lastActivity: new Date('2024-01-01'),
            isActive: true,
          },
        },
      ]

      mockMockAPIClient.getSessions.mockResolvedValue(mockSessions)
      mockMockAPIClient.getMessages.mockResolvedValue([])

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.state.currentSessionId).toBe('session-1')
      })

      // Start first message
      const firstPromise = act(async () => {
        await result.current.sendMessage('First message')
      })

      // Try to send second message immediately
      await act(async () => {
        await result.current.sendMessage('Second message')
      })

      await firstPromise

      // Should only have been called once
      expect(mockMockAPIClient.createMessage).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      const mockSessions: ChatSession[] = [
        {
          id: 'session-1',
          name: 'Session 1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: {
            messageCount: 0,
            lastActivity: new Date('2024-01-01'),
            isActive: true,
          },
        },
        {
          id: 'session-2',
          name: 'Session 2',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: {
            messageCount: 0,
            lastActivity: new Date('2024-01-01'),
            isActive: true,
          },
        },
      ]

      mockMockAPIClient.getSessions.mockResolvedValue(mockSessions)
      mockMockAPIClient.deleteSession.mockResolvedValue(undefined)

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.state.sessions).toHaveLength(2)
      })

      await act(async () => {
        await result.current.deleteSession('session-1')
      })

      await waitFor(() => {
        expect(result.current.state.sessions).toHaveLength(1)
        expect(result.current.state.sessions[0].id).toBe('session-2')
      })

      expect(mockMockAPIClient.deleteSession).toHaveBeenCalledWith('session-1')
    })
  })

  describe('toggleSidebar', () => {
    it('should toggle sidebar state', async () => {
      mockMockAPIClient.getSessions.mockResolvedValue([])

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false)
      })

      const initialSidebarState = result.current.state.sidebarCollapsed

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.state.sidebarCollapsed).toBe(!initialSidebarState)
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockMockAPIClient.getSessions.mockResolvedValue([])
      mockMockAPIClient.createSession.mockRejectedValue(new Error('Test error'))

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.createSession('Test Session')
      })

      await waitFor(() => {
        expect(result.current.state.error).toBeTruthy()
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.state.error).toBeNull()
    })
  })
})