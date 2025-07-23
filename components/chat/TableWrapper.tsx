'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Download, CheckCircle } from 'lucide-react'

interface TableWrapperProps {
  children: React.ReactNode
  className?: string
}

/**
 * Extracts table data from DOM table element and converts to CSV format
 */
const extractTableDataToCSV = (tableElement: HTMLTableElement): string => {
  const rows: string[][] = []
  
  // Extract header rows
  const headerRows = tableElement.querySelectorAll('thead tr')
  headerRows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('th'))
    const rowData = cells.map(cell => {
      // Clean the text content and escape quotes
      const text = cell.textContent?.trim() || ''
      return text.includes(',') || text.includes('"') || text.includes('\n') 
        ? `"${text.replace(/"/g, '""')}"` 
        : text
    })
    rows.push(rowData)
  })
  
  // Extract data rows
  const dataRows = tableElement.querySelectorAll('tbody tr')
  dataRows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'))
    const rowData = cells.map(cell => {
      // Clean the text content and escape quotes
      const text = cell.textContent?.trim() || ''
      return text.includes(',') || text.includes('"') || text.includes('\n') 
        ? `"${text.replace(/"/g, '""')}"` 
        : text
    })
    rows.push(rowData)
  })
  
  // Convert to CSV string
  return rows.map(row => row.join(',')).join('\n')
}

/**
 * Enhanced table wrapper with horizontal scrolling and CSV download
 */
export function TableWrapper({ children, className = '' }: TableWrapperProps) {
  const [downloaded, setDownloaded] = useState(false)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  // Check if table needs horizontal scrolling
  useEffect(() => {
    const checkScrollable = () => {
      if (tableContainerRef.current && tableRef.current) {
        const containerWidth = tableContainerRef.current.clientWidth
        const tableWidth = tableRef.current.scrollWidth
        setShowScrollIndicator(tableWidth > containerWidth)
      }
    }

    checkScrollable()
    window.addEventListener('resize', checkScrollable)
    return () => window.removeEventListener('resize', checkScrollable)
  }, [children])

  const handleDownloadCSV = () => {
    try {
      const tableElement = tableContainerRef.current?.querySelector('table')
      if (!tableElement) {
        console.error('Table element not found')
        return
      }

      const csvData = extractTableDataToCSV(tableElement as HTMLTableElement)
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `table-data-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2000)
    } catch (error) {
      console.error('Failed to download CSV:', error)
    }
  }

  return (
    <div
      className={`table-wrapper-container max-w-full ${className ?? ''}`}
      style={{}}
    >
      {/* Table container with horizontal scrolling */}
      <div 
        ref={tableContainerRef}
        className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 max-w-full pr-4"
        style={{ display: 'block' }}
        
      >
        {/* Scroll indicator */}
        {showScrollIndicator && (
          <div className="absolute top-2 right-2 z-10 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded backdrop-blur-sm">
            Scroll →
          </div>
        )}
        
        {/* Table content */}
        {React.isValidElement(children) && (children as React.ReactElement).type === 'table'
  ? React.cloneElement(children as React.ReactElement<any>, {
      ...(children as any).props,
      ref: tableRef,
      className: `${(children as any).props?.className ?? ''} min-w-max`,
    } as any)
  : children}
      </div>

      {/* Download button */}
      <div className="flex justify-end mt-3">
        <button
          onClick={handleDownloadCSV}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted/80 rounded-md transition-all duration-200 hover:shadow-sm"
          title="Download table as CSV"
        >
          {downloaded ? (
            <>
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-green-500">Downloaded</span>
            </>
          ) : (
            <>
              <Download className="h-3 w-3" />
              <span>Download CSV</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}