'use client'

import React, { useState, useRef } from 'react'
import { ChartData } from '@/types'
import { BarChart } from './BarChart'
import { LineChart } from './LineChart'
import { PieChart } from './PieChart'
import { AreaChart } from './AreaChart'
import { ChartError } from './ChartError'
import { 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Maximize2,
  Copy,
  CheckCircle
} from 'lucide-react'

interface ChartRendererProps {
  data: ChartData
  className?: string
}

export function ChartRenderer({ data, className = '' }: ChartRendererProps) {
  const [expanded, setExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  // Validate chart data
  const validateChartData = (chartData: ChartData): { isValid: boolean; error?: string } => {
    if (!chartData || typeof chartData !== 'object') {
      return { isValid: false, error: 'Chart data must be an object' }
    }

    if (!chartData.type || !['bar', 'line', 'pie', 'area', 'scatter'].includes(chartData.type)) {
      return { isValid: false, error: `Invalid chart type: ${chartData.type}` }
    }

    if (!chartData.data || !Array.isArray(chartData.data) || chartData.data.length === 0) {
      return { isValid: false, error: 'Chart data must be a non-empty array' }
    }

    if (!chartData.data.every(item => typeof item === 'object' && item !== null)) {
      return { isValid: false, error: 'All chart data items must be objects' }
    }

    return { isValid: true }
  }

  const validation = validateChartData(data)
  
  if (!validation.isValid) {
    return <ChartError message={validation.error || 'Invalid chart data'} />
  }

  const handleDownload = async () => {
    try {
      // Use the ref to get the entire chart container (including header and content)
      const chartContainer = chartRef.current
      if (!chartContainer) {
        console.error('Chart container not found')
        return
      }

      // Import html2canvas dynamically with proper module handling
      const { default: html2canvas } = await import('html2canvas')
      
      // Capture the entire chart container as canvas
      const canvas = await html2canvas(chartContainer as HTMLElement, {
        backgroundColor: 'white',
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false
      })

      // Convert to PNG and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `chart-${data.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'untitled'}-${Date.now()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    } catch (error) {
      console.error('Failed to download chart:', error)
      // Fallback: download chart data as JSON if html2canvas fails
      const dataStr = JSON.stringify(data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `chart-data-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy chart data:', err)
    }
  }

  const renderChart = () => {
    const { type, data: chartData, xKey, yKey, options } = data

    switch (type) {
      case 'bar':
        return <BarChart data={chartData} xKey={xKey} yKey={yKey} options={options} />
      case 'line':
        return <LineChart data={chartData} xKey={xKey} yKey={yKey} options={options} />
      case 'pie':
        return <PieChart data={chartData} options={options} />
      case 'area':
        return <AreaChart data={chartData} xKey={xKey} yKey={yKey} options={options} />
      case 'scatter':
        // For now, render scatter as line chart - can be enhanced later
        return <LineChart data={chartData} xKey={xKey} yKey={yKey} options={options} />
      default:
        return <ChartError message={`Unsupported chart type: ${type}`} />
    }
  }

  return (
    <div ref={chartRef} className={`chart-container bg-card rounded-lg border border-border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          📊 {data.title || `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Chart`}
        </button>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-2 rounded hover:bg-accent transition-colors"
            title="Copy chart data"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded hover:bg-accent transition-colors"
            title="Download chart data"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-2 rounded hover:bg-accent transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart Content */}
      {expanded && (
        <div className={`chart-content p-4 ${fullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
          {fullscreen && (
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{data.title}</h2>
              <button
                onClick={() => setFullscreen(false)}
                className="p-2 rounded hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>
          )}
          
          <div className={`chart-wrapper ${fullscreen ? 'h-[calc(100vh-120px)]' : 'h-96'}`}>
            {renderChart()}
          </div>
        </div>
      )}
    </div>
  )
}