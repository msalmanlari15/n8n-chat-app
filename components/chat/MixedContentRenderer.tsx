'use client'

import React from 'react'
import { ChartData } from '@/types'
import { ChartRenderer } from '@/components/charts'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TableWrapper } from './TableWrapper'

interface MixedContentRendererProps {
  content: any[]
}

/**
 * Converts Chart.js format to Recharts format
 * Adapted from ChartBubble implementation
 */
function transformChartData(chartConfig: any): ChartData | null {
  if (!chartConfig || typeof chartConfig !== 'object') {
    return null
  }

  const { type, data: chartDataRaw, options } = chartConfig

  // Validate chart type
  if (!type || !['bar', 'line', 'pie', 'area', 'scatter'].includes(type)) {
    return null
  }

  let dataArray: any[] = []

  try {
    // Handle scatter plot data - check if data has datasets with x,y coordinates
    if (type === 'scatter' && chartDataRaw?.datasets && Array.isArray(chartDataRaw.datasets) && chartDataRaw.datasets[0]?.data) {
      // For scatter plots, we expect array of {x, y} objects
      dataArray = chartDataRaw.datasets[0].data
      
      // Ensure each data point has x and y properties
      if (dataArray.length === 0 || typeof dataArray[0].x === 'undefined' || typeof dataArray[0].y === 'undefined') {
        return null
      }
    } else if (Array.isArray(chartDataRaw)) {
      // Data is already in Recharts format
      dataArray = chartDataRaw
    } else if (chartDataRaw?.labels && Array.isArray(chartDataRaw.datasets)) {
      // Chart.js format - transform to Recharts format
      if ((type === 'line' || type === 'area') && chartDataRaw.datasets.length > 1) {
        // Multi-series line/area chart transformation
        dataArray = chartDataRaw.labels.map((label: string, idx: number) => {
          const obj: Record<string, any> = { name: label }
          chartDataRaw.datasets.forEach((ds: any, dsIdx: number) => {
            const key = ds.label || `series${dsIdx}`
            obj[key] = ds.data[idx]
          })
          return obj
        })
      } else {
        // Single-series bar/pie etc.
        dataArray = chartDataRaw.labels.map((label: string, idx: number) => ({
          name: label,
          value: chartDataRaw.datasets[0].data[idx],
        }))
      }
    } else if (typeof chartDataRaw === 'object' && chartDataRaw !== null) {
      // Try to handle different formats
      dataArray = [chartDataRaw]
    } else {
      return null
    }
  } catch (error) {
    console.error('Error transforming chart data:', error)
    return null
  }

  // Extract title from different possible locations in the config
  const title = chartConfig.title || options?.title?.text || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`

  // Determine xKey and yKey based on data structure
  let xKey = 'name'
  let yKey = 'value'

  if (dataArray.length > 0) {
    const firstItem = dataArray[0]
    if (type === 'scatter' && firstItem.x !== undefined && firstItem.y !== undefined) {
      xKey = 'x'
      yKey = 'y'
    } else if (type === 'line' || type === 'area') {
      // For multi-series charts, we keep 'name' as xKey
      // yKey will be determined by the actual chart component
      xKey = 'name'
    }
  }

  return {
    type: type as 'bar' | 'line' | 'pie' | 'area' | 'scatter',
    title,
    data: dataArray,
    xKey,
    yKey,
    options: {
      colors: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'],
      showLegend: true,
      showGrid: true,
      showTooltip: true,
      responsive: true,
      ...options
    }
  }
}

/**
 * Renders mixed content containing text and charts
 * Handles n8n response format like: [{text1: "...", chart1: {...}, text2: "...", chart2: {...}}]
 */
export function MixedContentRenderer({ content }: MixedContentRendererProps) {
  if (!Array.isArray(content) || content.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No content to display
      </div>
    )
  }

  const renderItems: JSX.Element[] = []

  // Process each object in the array
  content.forEach((item, itemIndex) => {
    if (!item || typeof item !== 'object') {
      return
    }

    // Get all keys and sort them to maintain order (text1, chart1, text2, chart2, etc.)
    const keys = Object.keys(item).sort((a, b) => {
      // Extract the number from the key for proper sorting
      const getNumber = (key: string) => {
        const match = key.match(/\d+$/)
        return match ? parseInt(match[0]) : 0
      }
      
      const aNum = getNumber(a)
      const bNum = getNumber(b)
      
      if (aNum !== bNum) {
        return aNum - bNum
      }
      
      // If numbers are the same, text comes before chart
      if (a.startsWith('text') && b.startsWith('chart')) return -1
      if (a.startsWith('chart') && b.startsWith('text')) return 1
      
      return a.localeCompare(b)
    })

    keys.forEach((key, keyIndex) => {
      const value = item[key]
      const uniqueKey = `${itemIndex}-${keyIndex}-${key}`

      if (key.startsWith('text') && typeof value === 'string') {
        // Render text content
        renderItems.push(
          <div key={uniqueKey} className="prose prose-sm max-w-none mb-4">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }) => (
                  <a 
                    {...props} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  />
                ),
                p: ({ node, ...props }) => (
                  <p {...props} className="mb-2 last:mb-0 whitespace-pre-wrap text-sm leading-relaxed" />
                ),
                ul: ({ node, ...props }) => (
                  <ul {...props} className="my-2 pl-4" />
                ),
                li: ({ node, ...props }) => (
                  <li {...props} className="mb-1" />
                ),
                code: ({ node, ...props }) => (
                  <code {...props} className="bg-muted px-1 py-0.5 rounded text-sm font-mono" />
                ),
                pre: ({ node, ...props }) => (
                  <pre {...props} className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto" />
                ),
                h1: ({ node, ...props }) => (
                  <h1 {...props} className="text-lg font-semibold mb-2 mt-4 first:mt-0" />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="text-base font-semibold mb-2 mt-3 first:mt-0" />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} className="text-sm font-semibold mb-1 mt-2 first:mt-0" />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote {...props} className="border-l-4 border-muted-foreground/25 pl-4 italic my-2" />
                ),
                table: ({ node, ...props }) => (
                  <TableWrapper>
                    <table {...props} className="rounded-lg border border-border shadow-sm divide-y divide-border bg-card min-w-max" />
                  </TableWrapper>
                ),
                thead: ({ node, ...props }) => (
                  <thead {...props} className="bg-muted/50" />
                ),
                tbody: ({ node, ...props }) => (
                  <tbody {...props} className="divide-y divide-border bg-card" />
                ),
                th: ({ node, ...props }) => (
                  <th {...props} className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" />
                ),
                td: ({ node, ...props }) => (
                  <td {...props} className="px-6 py-4 text-sm text-foreground whitespace-nowrap" />
                ),
                tr: ({ node, ...props }) => (
                  <tr {...props} className="hover:bg-muted/30 transition-colors" />
                )
              }}
            >
              {value}
            </ReactMarkdown>
          </div>
        )
      } else if (key.startsWith('chart') && value && typeof value === 'object') {
        // Transform and render chart content
        const chartData = transformChartData(value)
        
        if (chartData) {
          renderItems.push(
            <div key={uniqueKey} className="mb-6">
              <ChartRenderer data={chartData} />
            </div>
          )
        } else {
          renderItems.push(
            <div key={uniqueKey} className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-destructive">Chart Error</span>
              </div>
              <div className="text-sm text-destructive mb-2">
                Unable to render chart: invalid data format
              </div>
              <details className="text-xs text-destructive/80">
                <summary>Show raw chart data</summary>
                <pre className="mt-2 bg-destructive/5 p-2 rounded overflow-x-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </details>
            </div>
          )
        }
      }
    })
  })

  if (renderItems.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No valid content found to display
      </div>
    )
  }

  return (
    <div className="mixed-content-container">
      {renderItems}
    </div>
  )
}