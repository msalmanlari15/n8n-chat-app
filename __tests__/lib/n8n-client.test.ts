import { N8NClient, N8NError, createN8NClient, n8nUtils } from '@/lib/n8n-client'
import { N8NRequest, N8NResponse } from '@/types'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('N8NClient', () => {
  let client: N8NClient
  const mockConfig = {
    webhookUrl: 'https://test.webhook.url',
    streamingUrl: 'https://test.streaming.url',
    timeout: 5000,
    retryAttempts: 2,
    retryDelay: 100,
  }

  beforeEach(() => {
    client = new N8NClient(mockConfig)
    jest.clearAllMocks()
  })

  describe('sendMessage', () => {
    const mockRequest: N8NRequest = {
      username: 'testuser',
      message: 'test message',
      sessionId: 'test-session',
      timestamp: new Date(),
    }

    it('should send message successfully', async () => {
      const mockResponse = {
        output: 'Test response from n8n',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
        headers: new Headers(),
      })

      const result = await client.sendMessage(mockRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        mockConfig.webhookUrl,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(mockRequest),
        })
      )

      expect(result).toEqual({
        type: 'final',
        messageType: 'text',
        content: 'Test response from n8n',
        metadata: expect.objectContaining({
          timestamp: expect.any(Date),
        }),
      })
    })

    it('should handle server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error'),
        headers: new Headers(),
      })

      await expect(client.sendMessage(mockRequest)).rejects.toThrow('HTTP 500: Internal Server Error')
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(client.sendMessage(mockRequest)).rejects.toThrow()
    })
  })

  describe('sendMessageWithRetry', () => {
    const mockRequest: N8NRequest = {
      username: 'testuser',
      message: 'test message',
      sessionId: 'test-session',
      timestamp: new Date(),
    }

    it('should succeed on first attempt', async () => {
      const mockResponse = { output: 'Success' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
        headers: new Headers(),
      })

      const result = await client.sendMessageWithRetry(mockRequest)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result.content).toBe('Success')
    })
  })

  describe('validateResponse', () => {
    it('should handle text response', () => {
      const client = new N8NClient(mockConfig)
      const result = (client as any).validateResponse({ output: 'Test response' })

      expect(result).toEqual({
        type: 'final',
        messageType: 'text',
        content: 'Test response',
        metadata: expect.objectContaining({
          timestamp: expect.any(Date),
        }),
      })
    })

    it('should handle JSON response', () => {
      const client = new N8NClient(mockConfig)
      const jsonData = { data: 'test', type: 'json' }
      const result = (client as any).validateResponse({
        content: jsonData,
        messageType: 'json',
      })

      expect(result).toEqual({
        type: 'final',
        messageType: 'json',
        content: jsonData,
        metadata: expect.objectContaining({
          timestamp: expect.any(Date),
        }),
      })
    })

    it('should handle malformed response', () => {
      const client = new N8NClient(mockConfig)
      const result = (client as any).validateResponse('invalid response')

      expect(result).toEqual({
        type: 'final',
        messageType: 'text',
        content: 'invalid response',
        metadata: expect.objectContaining({
          timestamp: expect.any(Date),
        }),
      })
    })
  })

  describe('deduplicateContent', () => {
    it('should remove duplicate lines', () => {
      const client = new N8NClient(mockConfig)
      const duplicateContent = `Line 1
Line 2
Line 1
Line 3`

      const result = (client as any).deduplicateContent(duplicateContent)

      expect(result).toBe(`Line 1
Line 2
Line 3`)
    })

    it('should handle empty content', () => {
      const client = new N8NClient(mockConfig)
      const result = (client as any).deduplicateContent('')

      expect(result).toBe('')
    })
  })

  describe('cancel', () => {
    it('should cancel ongoing request', () => {
      const client = new N8NClient(mockConfig)
      client.cancel()
      // Should not throw error
    })
  })
})

describe('createN8NClient', () => {
  it('should create client instance', () => {
    const client = createN8NClient({
      webhookUrl: 'https://test.url',
      streamingUrl: 'https://test.stream.url',
    })

    expect(client).toBeInstanceOf(N8NClient)
  })
})

describe('n8nUtils', () => {
  describe('formatError', () => {
    it('should format network error', () => {
      const error = new N8NError('Network failed', 'network')
      const result = n8nUtils.formatError(error)

      expect(result).toBe('Network connection failed. Please check your internet connection.')
    })

    it('should format timeout error', () => {
      const error = new N8NError('Timeout', 'timeout')
      const result = n8nUtils.formatError(error)

      expect(result).toBe('Request timed out. The workflow may be taking longer than expected.')
    })

    it('should format server error', () => {
      const error = new N8NError('Server error', 'server')
      const result = n8nUtils.formatError(error)

      expect(result).toBe('Server error occurred. Please try again later.')
    })

    it('should format validation error', () => {
      const error = new N8NError('Invalid data', 'validation')
      const result = n8nUtils.formatError(error)

      expect(result).toBe('Invalid data format. Please contact support.')
    })
  })

  describe('isInterimMessage', () => {
    it('should identify interim message', () => {
      const response: N8NResponse = {
        type: 'interim',
        messageType: 'text',
        content: 'Processing...',
        metadata: { timestamp: new Date() },
      }

      expect(n8nUtils.isInterimMessage(response)).toBe(true)
    })

    it('should identify final message', () => {
      const response: N8NResponse = {
        type: 'final',
        messageType: 'text',
        content: 'Complete',
        metadata: { timestamp: new Date() },
      }

      expect(n8nUtils.isInterimMessage(response)).toBe(false)
    })
  })

  describe('isFinalMessage', () => {
    it('should identify final message', () => {
      const response: N8NResponse = {
        type: 'final',
        messageType: 'text',
        content: 'Complete',
        metadata: { timestamp: new Date() },
      }

      expect(n8nUtils.isFinalMessage(response)).toBe(true)
    })
  })

  describe('getProcessingTime', () => {
    it('should extract processing time', () => {
      const response: N8NResponse = {
        type: 'final',
        messageType: 'text',
        content: 'Complete',
        metadata: { timestamp: new Date(), processingTime: 1500 },
      }

      expect(n8nUtils.getProcessingTime(response)).toBe(1500)
    })

    it('should return null if no processing time', () => {
      const response: N8NResponse = {
        type: 'final',
        messageType: 'text',
        content: 'Complete',
        metadata: { timestamp: new Date() },
      }

      expect(n8nUtils.getProcessingTime(response)).toBeNull()
    })
  })
})