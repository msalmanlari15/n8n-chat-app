import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { Message } from '@/types'

// Mock ReactMarkdown
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>
  }
})

// Mock ResponseRenderer
jest.mock('@/components/chat/ResponseRenderer', () => ({
  ResponseRenderer: ({ responseData }: { responseData: any }) => (
    <div data-testid="response-renderer">
      Response: {responseData.type} - {responseData.content}
    </div>
  ),
}))

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn(),
}
Object.assign(navigator, {
  clipboard: mockClipboard,
})

describe('ChatMessage', () => {
  const mockUserMessage: Message = {
    id: 'user-msg-1',
    sessionId: 'session-1',
    content: 'Hello, this is a user message',
    type: 'user',
    timestamp: new Date('2024-01-01T12:00:00Z'),
  }

  const mockAssistantMessage: Message = {
    id: 'assistant-msg-1',
    sessionId: 'session-1',
    content: 'Hello, this is an assistant message',
    type: 'assistant',
    timestamp: new Date('2024-01-01T12:01:00Z'),
  }

  const mockInterimMessage: Message = {
    id: 'interim-msg-1',
    sessionId: 'session-1',
    content: 'Processing your request...',
    type: 'interim',
    timestamp: new Date('2024-01-01T12:00:30Z'),
  }

  const mockAssistantWithResponse: Message = {
    id: 'assistant-msg-2',
    sessionId: 'session-1',
    content: 'Here is some data',
    type: 'assistant',
    timestamp: new Date('2024-01-01T12:02:00Z'),
    responseData: {
      type: 'json',
      content: { data: 'example' },
      metadata: { timestamp: new Date('2024-01-01T12:02:00Z') },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User message rendering', () => {
    it('should render user message correctly', () => {
      render(<ChatMessage message={mockUserMessage} />)

      expect(screen.getByText('Hello, this is a user message')).toBeInTheDocument()
      expect(screen.getByTitle('User')).toBeInTheDocument()
    })

    it('should position user message on the right', () => {
      render(<ChatMessage message={mockUserMessage} />)

      const container = screen.getByText('Hello, this is a user message').closest('.group')
      expect(container).toHaveClass('justify-end')
    })

    it('should not show copy button for user messages', () => {
      render(<ChatMessage message={mockUserMessage} />)

      expect(screen.queryByTitle('Copy text')).not.toBeInTheDocument()
    })
  })

  describe('Assistant message rendering', () => {
    it('should render assistant message correctly', () => {
      render(<ChatMessage message={mockAssistantMessage} />)

      expect(screen.getByText('Hello, this is an assistant message')).toBeInTheDocument()
      expect(screen.getByTitle('Bot')).toBeInTheDocument()
    })

    it('should position assistant message on the left', () => {
      render(<ChatMessage message={mockAssistantMessage} />)

      const container = screen.getByText('Hello, this is an assistant message').closest('.group')
      expect(container).toHaveClass('justify-start')
    })

    it('should show copy button for assistant messages', () => {
      render(<ChatMessage message={mockAssistantMessage} />)

      expect(screen.getByTitle('Copy text')).toBeInTheDocument()
    })

    it('should copy message content when copy button is clicked', async () => {
      render(<ChatMessage message={mockAssistantMessage} />)

      const copyButton = screen.getByTitle('Copy text')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('Hello, this is an assistant message')
      })
    })

    it('should show success indicator after copying', async () => {
      render(<ChatMessage message={mockAssistantMessage} />)

      const copyButton = screen.getByTitle('Copy text')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByTestId('check-circle')).toBeInTheDocument()
      })
    })

    it('should handle clipboard error gracefully', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<ChatMessage message={mockAssistantMessage} />)

      const copyButton = screen.getByTitle('Copy text')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to copy text:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Interim message rendering', () => {
    it('should render interim message with special styling', () => {
      render(<ChatMessage message={mockInterimMessage} />)

      expect(screen.getByText('Processing your request...')).toBeInTheDocument()
      expect(screen.getByText('Workflow Progress')).toBeInTheDocument()
    })

    it('should show progress indicator for interim messages', () => {
      render(<ChatMessage message={mockInterimMessage} />)

      const progressDots = screen.getAllByRole('generic')
      const animatedDots = progressDots.filter(dot => 
        dot.className.includes('animate-pulse')
      )
      expect(animatedDots.length).toBeGreaterThan(0)
    })
  })

  describe('Response data rendering', () => {
    it('should render response data for non-text types', () => {
      render(<ChatMessage message={mockAssistantWithResponse} />)

      expect(screen.getByTestId('response-renderer')).toBeInTheDocument()
      expect(screen.getByText('Response: json - [object Object]')).toBeInTheDocument()
    })

    it('should not render response data for text types', () => {
      const textResponseMessage: Message = {
        ...mockAssistantMessage,
        responseData: {
          type: 'text',
          content: 'Text response',
          metadata: { timestamp: new Date() },
        },
      }

      render(<ChatMessage message={textResponseMessage} />)

      expect(screen.queryByTestId('response-renderer')).not.toBeInTheDocument()
    })
  })

  describe('Streaming state', () => {
    it('should show streaming indicator when isStreaming is true', () => {
      render(<ChatMessage message={mockAssistantMessage} isStreaming={true} />)

      expect(screen.getByText('Streaming...')).toBeInTheDocument()
    })

    it('should show timestamp when not streaming', () => {
      render(<ChatMessage message={mockAssistantMessage} isStreaming={false} />)

      expect(screen.getByText('12:00 PM')).toBeInTheDocument()
    })
  })

  describe('Retry functionality', () => {
    const mockOnRetry = jest.fn()

    beforeEach(() => {
      mockOnRetry.mockClear()
    })

    it('should show retry button for assistant messages when onRetry is provided', () => {
      render(<ChatMessage message={mockAssistantMessage} onRetry={mockOnRetry} />)

      expect(screen.getByTitle('Retry message')).toBeInTheDocument()
    })

    it('should call onRetry when retry button is clicked', () => {
      render(<ChatMessage message={mockAssistantMessage} onRetry={mockOnRetry} />)

      const retryButton = screen.getByTitle('Retry message')
      fireEvent.click(retryButton)

      expect(mockOnRetry).toHaveBeenCalledTimes(1)
    })

    it('should not show retry button when streaming', () => {
      render(<ChatMessage message={mockAssistantMessage} isStreaming={true} onRetry={mockOnRetry} />)

      expect(screen.queryByTitle('Retry message')).not.toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('should show error indicator for error response types', () => {
      const errorMessage: Message = {
        ...mockAssistantMessage,
        responseData: {
          type: 'error',
          content: 'Something went wrong',
          metadata: { timestamp: new Date() },
        },
      }

      render(<ChatMessage message={errorMessage} />)

      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChatMessage message={mockAssistantMessage} />)

      const copyButton = screen.getByTitle('Copy text')
      expect(copyButton).toHaveAttribute('title', 'Copy text')
    })

    it('should be keyboard accessible', () => {
      render(<ChatMessage message={mockAssistantMessage} />)

      const copyButton = screen.getByTitle('Copy text')
      copyButton.focus()
      
      fireEvent.keyDown(copyButton, { key: 'Enter' })
      fireEvent.keyUp(copyButton, { key: 'Enter' })
      
      expect(copyButton).toHaveFocus()
    })
  })

  describe('Markdown rendering', () => {
    it('should render message content through ReactMarkdown', () => {
      render(<ChatMessage message={mockAssistantMessage} />)

      expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('Hello, this is an assistant message')
    })
  })
})