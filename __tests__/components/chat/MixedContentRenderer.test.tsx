import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MixedContentRenderer } from '@/components/chat/MixedContentRenderer'

// Mock ReactMarkdown to test table rendering
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children, components }: any) {
    // Process table markdown
    let content = children
    
    // Simple table processing for testing
    if (content.includes('|') && content.includes('---')) {
      const lines = content.split('\n').filter(line => line.trim())
      const isTableLine = (line: string) => line.includes('|') && !line.includes('---')
      
      if (lines.some(line => line.includes('---'))) {
        // This is a table
        const tableLines = lines.filter(isTableLine)
        if (tableLines.length > 0) {
          const headerLine = tableLines[0]
          const dataLines = tableLines.slice(1)
          
          const headers = headerLine.split('|').map(h => h.trim()).filter(h => h)
          
          let tableHTML = '<table><thead><tr>'
          headers.forEach(header => {
            tableHTML += `<th>${header}</th>`
          })
          tableHTML += '</tr></thead><tbody>'
          
          dataLines.forEach(line => {
            const cells = line.split('|').map(c => c.trim()).filter(c => c)
            tableHTML += '<tr>'
            cells.forEach(cell => {
              tableHTML += `<td>${cell}</td>`
            })
            tableHTML += '</tr>'
          })
          
          tableHTML += '</tbody></table>'
          
          return <div dangerouslySetInnerHTML={{ __html: tableHTML }} />
        }
      }
    }
    
    return <div>{content}</div>
  }
})

describe('MixedContentRenderer', () => {
  describe('Table rendering', () => {
    it('should render markdown table from mixed content', () => {
      const mixedContent = [{
        text1: `Here's a table showing each assignee and how many tasks they have:

| Assignee | Task Count |
|----------|------------|
| Salman Lari | 17 |
| Syed Ahmed | 5 |
| Mohammad Bhram | 2 |
| Moutasem Rajab | 1 |`
      }]

      render(<MixedContentRenderer content={mixedContent} />)
      
      // Check if table elements are rendered
      expect(screen.getByRole('table')).toBeInTheDocument()
      
      // Check if headers are present
      expect(screen.getByRole('columnheader', { name: 'Assignee' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Task Count' })).toBeInTheDocument()
      
      // Check if data cells are present
      expect(screen.getByRole('cell', { name: 'Salman Lari' })).toBeInTheDocument()
      expect(screen.getByRole('cell', { name: '17' })).toBeInTheDocument()
      expect(screen.getByRole('cell', { name: 'Syed Ahmed' })).toBeInTheDocument()
      expect(screen.getByRole('cell', { name: '5' })).toBeInTheDocument()
    })

    it('should handle empty or invalid content', () => {
      render(<MixedContentRenderer content={[]} />)
      expect(screen.getByText('No content to display')).toBeInTheDocument()
    })

    it('should handle non-table text content', () => {
      const mixedContent = [{
        text1: 'This is just regular text without any tables.'
      }]

      render(<MixedContentRenderer content={mixedContent} />)
      expect(screen.getByText('This is just regular text without any tables.')).toBeInTheDocument()
    })
  })
})