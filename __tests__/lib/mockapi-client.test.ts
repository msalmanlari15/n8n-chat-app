import { MockAPIClient, MockAPIError, createMockAPIClient, mockAPIUtils } from '@/lib/mockapi-client'
import { ChatSession, Message } from '@/types'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('MockAPIClient', () => {
  let client: MockAPIClient
  const mockConfig = {
    baseUrl: 'https://test.mockapi.url',
    projectId: 'test-project',
    timeout: 5000,
  }

  beforeEach(() => {
    client = new MockAPIClient(mockConfig)
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('getSessions', () => {
    it('should fetch sessions from API', async () => {
      const mockSessions: ChatSession[] = [
        {
          id: 'session-1',
          name: 'Test Session',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: {
            messageCount: 5,
            lastActivity: new Date('2024-01-01'),
            isActive: true,
          },
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSessions),
      })

      const result = await client.getSessions()

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/sessions`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )

      expect(result).toEqual(mockSessions)
    })

    it('should fallback to localStorage on API failure', async () => {
      const mockSessions: ChatSession[] = [
        {
          id: 'session-1',
          name: 'Local Session',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: {
            messageCount: 3,
            lastActivity: new Date('2024-01-01'),
            isActive: true,
          },
        },
      ]

      localStorage.setItem('mockapi_sessions', JSON.stringify(mockSessions))
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const result = await client.getSessions()

      expect(result).toEqual(mockSessions)
    })

    it('should return empty array when no sessions exist', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const result = await client.getSessions()

      expect(result).toEqual([])
    })
  })

  describe('createSession', () => {
    it('should create session via API', async () => {
      const sessionName = 'New Session'
      const mockSession: ChatSession = {
        id: 'new-session-id',
        name: sessionName,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        metadata: {
          messageCount: 0,
          lastActivity: new Date('2024-01-01'),
          isActive: true,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      })

      const result = await client.createSession(sessionName)

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/sessions`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: sessionName,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            metadata: {
              messageCount: 0,
              lastActivity: expect.any(String),
              isActive: true,
            },
          }),
        })
      )

      expect(result).toEqual(mockSession)
    })

    it('should create session in localStorage on API failure', async () => {
      const sessionName = 'Local Session'
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const result = await client.createSession(sessionName)

      expect(result.name).toBe(sessionName)
      expect(result.id).toBeDefined()
      expect(result.metadata.messageCount).toBe(0)

      const storedSessions = JSON.parse(localStorage.getItem('mockapi_sessions') || '[]')
      expect(storedSessions).toHaveLength(1)
      expect(storedSessions[0].name).toBe(sessionName)
    })
  })

  describe('getMessages', () => {
    const sessionId = 'test-session'

    it('should fetch messages from API', async () => {
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          sessionId,
          content: 'Test message',
          type: 'user',
          timestamp: new Date('2024-01-01'),
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      })

      const result = await client.getMessages(sessionId)

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/messages?sessionId=${sessionId}`,
        expect.objectContaining({
          method: 'GET',
        })
      )

      expect(result).toEqual(mockMessages)
    })

    it('should fallback to localStorage on API failure', async () => {
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          sessionId,
          content: 'Local message',
          type: 'user',
          timestamp: new Date('2024-01-01'),
        },
      ]

      localStorage.setItem('mockapi_messages', JSON.stringify(mockMessages))
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const result = await client.getMessages(sessionId)

      expect(result).toEqual(mockMessages)
    })
  })

  describe('createMessage', () => {
    const mockMessage: Omit<Message, 'id'> = {
      sessionId: 'test-session',
      content: 'Test message',
      type: 'user',
      timestamp: new Date('2024-01-01'),
    }

    it('should create message via API', async () => {
      const mockResponse: Message = {
        id: 'msg-1',
        ...mockMessage,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await client.createMessage(mockMessage)

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/messages`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...mockMessage,
            timestamp: mockMessage.timestamp.toISOString(),
          }),
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should create message in localStorage on API failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const result = await client.createMessage(mockMessage)

      expect(result.content).toBe(mockMessage.content)
      expect(result.id).toBeDefined()

      const storedMessages = JSON.parse(localStorage.getItem('mockapi_messages') || '[]')
      expect(storedMessages).toHaveLength(1)
      expect(storedMessages[0].content).toBe(mockMessage.content)
    })
  })

  describe('updateSession', () => {
    const sessionId = 'test-session'
    const updates = { name: 'Updated Session' }

    it('should update session via API', async () => {
      const mockResponse: ChatSession = {
        id: sessionId,
        name: 'Updated Session',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        metadata: {
          messageCount: 0,
          lastActivity: new Date('2024-01-02'),
          isActive: true,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await client.updateSession(sessionId, updates)

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/sessions/${sessionId}`,
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...updates,
            updatedAt: expect.any(String),
          }),
        })
      )

      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteSession', () => {
    const sessionId = 'test-session'

    it('should delete session via API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await client.deleteSession(sessionId)

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/sessions/${sessionId}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should delete session from localStorage on API failure', async () => {
      const mockSessions: ChatSession[] = [
        {
          id: sessionId,
          name: 'Session to delete',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: {
            messageCount: 0,
            lastActivity: new Date('2024-01-01'),
            isActive: true,
          },
        },
      ]

      localStorage.setItem('mockapi_sessions', JSON.stringify(mockSessions))
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      await client.deleteSession(sessionId)

      const storedSessions = JSON.parse(localStorage.getItem('mockapi_sessions') || '[]')
      expect(storedSessions).toHaveLength(0)
    })
  })
})

describe('createMockAPIClient', () => {
  it('should create client instance', () => {
    const client = createMockAPIClient({
      baseUrl: 'https://test.url',
      projectId: 'test-project',
    })

    expect(client).toBeInstanceOf(MockAPIClient)
  })
})

describe('mockAPIUtils', () => {
  describe('validateSessionName', () => {
    it('should validate correct session name', () => {
      const result = mockAPIUtils.validateSessionName('Valid Session Name')
      expect(result).toBeNull()
    })

    it('should reject empty session name', () => {
      const result = mockAPIUtils.validateSessionName('')
      expect(result).toBe('Session name cannot be empty')
    })

    it('should reject too long session name', () => {
      const longName = 'a'.repeat(101)
      const result = mockAPIUtils.validateSessionName(longName)
      expect(result).toBe('Session name must be less than 100 characters')
    })

    it('should reject session name with invalid characters', () => {
      const result = mockAPIUtils.validateSessionName('Invalid<>Name')
      expect(result).toBe('Session name contains invalid characters')
    })
  })

  describe('validateMessageContent', () => {
    it('should validate correct message content', () => {
      const result = mockAPIUtils.validateMessageContent('Valid message')
      expect(result).toBeNull()
    })

    it('should reject empty message content', () => {
      const result = mockAPIUtils.validateMessageContent('')
      expect(result).toBe('Message content cannot be empty')
    })

    it('should reject too long message content', () => {
      const longContent = 'a'.repeat(10001)
      const result = mockAPIUtils.validateMessageContent(longContent)
      expect(result).toBe('Message content must be less than 10000 characters')
    })
  })

  describe('formatError', () => {
    it('should format network error', () => {
      const error = new MockAPIError('Network failed', 'network', 'test-op')
      const result = mockAPIUtils.formatError(error)

      expect(result).toBe('Network connection failed. Please check your internet connection and try again.')
    })

    it('should format validation error', () => {
      const error = new MockAPIError('Invalid data', 'validation', 'test-op')
      const result = mockAPIUtils.formatError(error)

      expect(result).toBe('Invalid data provided. Please check your input and try again.')
    })

    it('should format server error', () => {
      const error = new MockAPIError('Server error', 'server', 'test-op')
      const result = mockAPIUtils.formatError(error)

      expect(result).toBe('Server error occurred. Please try again later.')
    })

    it('should format storage error', () => {
      const error = new MockAPIError('Storage failed', 'storage', 'test-op')
      const result = mockAPIUtils.formatError(error)

      expect(result).toBe('Local storage error. Please clear your browser cache and try again.')
    })
  })
})