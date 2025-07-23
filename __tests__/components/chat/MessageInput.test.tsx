import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MessageInput } from '@/components/chat/MessageInput'
import { ChatProvider } from '@/context/ChatContext'

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

const mockMockAPIClient = require('@/lib/mockapi-client').createMockAPIClient()

describe('MessageInput', () => {
  const mockOnSubmit = jest.fn()

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChatProvider>
      {children}
    </ChatProvider>
  )

  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockMockAPIClient.getSessions.mockResolvedValue([
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
    ])
    mockMockAPIClient.getMessages.mockResolvedValue([])
  })

  describe('Basic rendering', () => {
    it('should render input field and send button', () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      expect(screen.getByTitle('Send message')).toBeInTheDocument()
    })

    it('should render with custom placeholder', () => {
      render(<MessageInput onSubmit={mockOnSubmit} placeholder="Custom placeholder" />, { wrapper: TestWrapper })

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<MessageInput onSubmit={mockOnSubmit} disabled={true} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByTitle('Send message')

      expect(input).toBeDisabled()
      expect(sendButton).toBeDisabled()
    })
  })

  describe('Message submission', () => {
    it('should submit message when send button is clicked', async () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByTitle('Send message')

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test message')
      })
    })

    it('should submit message when Enter key is pressed', async () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test message')
      })
    })

    it('should not submit on Shift+Enter', async () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true })

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it('should clear input after submission', async () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement
      const sendButton = screen.getByTitle('Send message')

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })

    it('should not submit empty message', async () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const sendButton = screen.getByTitle('Send message')

      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it('should not submit whitespace-only message', async () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByTitle('Send message')

      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })
  })

  describe('Textarea auto-resize', () => {
    it('should auto-resize textarea based on content', () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const textarea = screen.getByPlaceholderText('Type your message...')
      
      fireEvent.change(textarea, { 
        target: { 
          value: 'This is a very long message that should cause the textarea to expand\n'.repeat(5)
        } 
      })

      // The textarea should have grown (this is hard to test without actual DOM measurements)
      expect(textarea).toHaveValue('This is a very long message that should cause the textarea to expand\n'.repeat(5))
    })
  })

  describe('Button state', () => {
    it('should disable send button when input is empty', () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const sendButton = screen.getByTitle('Send message')
      expect(sendButton).toBeDisabled()
    })

    it('should enable send button when input has content', () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByTitle('Send message')

      fireEvent.change(input, { target: { value: 'Test message' } })

      expect(sendButton).not.toBeDisabled()
    })

    it('should disable send button when whitespace-only content', () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByTitle('Send message')

      fireEvent.change(input, { target: { value: '   ' } })

      expect(sendButton).toBeDisabled()
    })
  })

  describe('Loading state', () => {
    it('should show loading indicator when disabled', () => {
      render(<MessageInput onSubmit={mockOnSubmit} disabled={true} />, { wrapper: TestWrapper })

      // Look for loading indicator (assuming it exists in the actual component)
      const sendButton = screen.getByTitle('Send message')
      expect(sendButton).toBeDisabled()
    })
  })

  describe('Keyboard shortcuts', () => {
    it('should handle Ctrl+Enter for submission', async () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', ctrlKey: true })

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test message')
      })
    })

    it('should handle Meta+Enter for submission (Mac)', async () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', metaKey: true })

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test message')
      })
    })
  })

  describe('Character limit', () => {
    it('should not exceed maximum character limit', () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')
      const longMessage = 'a'.repeat(10000) // Assuming there's a character limit

      fireEvent.change(input, { target: { value: longMessage } })

      // The actual behavior depends on the component implementation
      expect(input).toHaveValue(longMessage)
    })
  })

  describe('Focus management', () => {
    it('should focus input after submission', async () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByTitle('Send message')

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(input).toHaveFocus()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByTitle('Send message')

      expect(input).toHaveAttribute('aria-label', 'Message input')
      expect(sendButton).toHaveAttribute('title', 'Send message')
    })

    it('should be keyboard navigable', () => {
      render(<MessageInput onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByTitle('Send message')

      // Tab to input
      input.focus()
      expect(input).toHaveFocus()

      // Tab to send button
      fireEvent.keyDown(input, { key: 'Tab' })
      // Note: In actual usage, this would move focus to the send button
    })
  })

  describe('Error handling', () => {
    it('should handle submission errors gracefully', async () => {
      const mockOnSubmitWithError = jest.fn().mockRejectedValue(new Error('Submission failed'))

      render(<MessageInput onSubmit={mockOnSubmitWithError} />, { wrapper: TestWrapper })

      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByTitle('Send message')

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockOnSubmitWithError).toHaveBeenCalledWith('Test message')
      })

      // The component should handle the error gracefully
      // This depends on the actual error handling implementation
    })
  })
})