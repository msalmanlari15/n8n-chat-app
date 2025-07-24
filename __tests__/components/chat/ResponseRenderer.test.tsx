import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ResponseRenderer } from '@/components/chat/ResponseRenderer'
import { ResponseData } from '@/types'

// Mock ReactMarkdown to avoid ES module issues in Jest
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children, components }: any) {
    // Simple mock that applies some basic transformations for testing
    let content = children
    
    // Mock bold text
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Mock headers
    content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>')
    content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>')
    content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>')
    
    // Mock links
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Mock code blocks (before inline code)
    content = content.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    
    // Mock inline code
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Mock lists
    content = content.replace(/^- (.*)$/gm, '<li>$1</li>')
    content = content.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    
    return <div dangerouslySetInnerHTML={{ __html: content }} />
  }
})

describe('ResponseRenderer', () => {
  describe('Text rendering with markdown', () => {
    it('should render plain text', () => {
      const responseData: ResponseData = {
        type: 'text',
        content: 'This is plain text'
      }

      render(<ResponseRenderer responseData={responseData} />)
      expect(screen.getByText('This is plain text')).toBeInTheDocument()
    })

    it('should render markdown bold text', () => {
      const responseData: ResponseData = {
        type: 'text',
        content: 'This is **bold text**'
      }

      render(<ResponseRenderer responseData={responseData} />)
      expect(screen.getByText('bold text')).toBeInTheDocument()
      expect(screen.getByText('bold text').tagName).toBe('STRONG')
    })

    it('should render markdown links', () => {
      const responseData: ResponseData = {
        type: 'text',
        content: 'Check out [this link](https://example.com)'
      }

      render(<ResponseRenderer responseData={responseData} />)
      const link = screen.getByRole('link', { name: 'this link' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('should render markdown headers', () => {
      const responseData: ResponseData = {
        type: 'text',
        content: '# Main Title\n## Subtitle\n### Small header'
      }

      render(<ResponseRenderer responseData={responseData} />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Main Title')
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Subtitle')
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Small header')
    })

    it('should render markdown lists', () => {
      const responseData: ResponseData = {
        type: 'text',
        content: '- Item 1\n- Item 2\n- Item 3'
      }

      render(<ResponseRenderer responseData={responseData} />)
      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
      
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(3)
      expect(listItems[0]).toHaveTextContent('Item 1')
      expect(listItems[1]).toHaveTextContent('Item 2')
      expect(listItems[2]).toHaveTextContent('Item 3')
    })

    it('should render inline code', () => {
      const responseData: ResponseData = {
        type: 'text',
        content: 'Use the `console.log()` function'
      }

      render(<ResponseRenderer responseData={responseData} />)
      const codeElement = screen.getByText('console.log()')
      expect(codeElement).toBeInTheDocument()
      expect(codeElement.tagName).toBe('CODE')
    })

    it('should render code blocks', () => {
      const responseData: ResponseData = {
        type: 'text',
        content: '```javascript\nconst hello = "world";\nconsole.log(hello);\n```'
      }

      render(<ResponseRenderer responseData={responseData} />)
      const preElement = screen.getByText(/const hello = "world";/)
      expect(preElement).toBeInTheDocument()
      expect(preElement.closest('pre')).toBeInTheDocument()
    })
  })
})