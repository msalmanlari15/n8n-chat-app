'use client'

import React, { useState } from 'react'
import { ResponseData } from '@/types'
import { cn } from '@/lib/utils'
import { ChartRenderer as ChartRendererComponent } from '@/components/charts'
import { MixedContentRenderer } from './MixedContentRenderer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TableWrapper } from './TableWrapper'
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Download, 
  ExternalLink,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface ResponseRendererProps {
  responseData: ResponseData
}

// Text response renderer
const TextRenderer: React.FC<{ content: string; metadata?: Record<string, any> }> = ({ 
  content, 
  metadata 
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <div className="relative group">
      <div className="prose prose-sm max-w-none">
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
                <table {...props} className="rounded-lg border border-border shadow-sm w-max divide-y divide-border bg-card" />
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
          {content}
        </ReactMarkdown>
      </div>
      
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
        title="Copy text"
      >
        {copied ? (
          <CheckCircle className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
      
      {/* Processing time indicator */}
      {metadata?.processingTime && (
        <div className="mt-2 text-xs text-muted-foreground">
          Processed in {metadata.processingTime}ms
        </div>
      )}
    </div>
  )
}

// JSON response renderer
const JsonRenderer: React.FC<{ content: any; metadata?: Record<string, any> }> = ({ 
  content, 
  metadata 
}) => {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const jsonString = JSON.stringify(content, null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy JSON:', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `response-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-muted rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          JSON Response
        </button>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-accent transition-colors"
            title="Copy JSON"
          >
            {copied ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-1 rounded hover:bg-accent transition-colors"
            title="Download JSON"
          >
            <Download className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4">
          <pre className="text-sm overflow-x-auto bg-background/50 p-3 rounded border">
            <code className="font-mono">{jsonString}</code>
          </pre>
        </div>
      )}
      
      {/* Metadata */}
      {metadata?.processingTime && (
        <div className="px-3 pb-3 text-xs text-muted-foreground">
          Processed in {metadata.processingTime}ms
        </div>
      )}
    </div>
  )
}

// Image response renderer
const ImageRenderer: React.FC<{ content: string; metadata?: Record<string, any> }> = ({ 
  content, 
  metadata 
}) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const handleImageLoad = () => {
    setLoaded(true)
  }

  const handleImageError = () => {
    setError(true)
  }

  const handleOpenExternal = () => {
    window.open(content, '_blank')
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm text-destructive">Failed to load image</span>
      </div>
    )
  }

  return (
    <div className="max-w-md group">
      <div className="relative">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        
        <img 
          src={content} 
          alt="Response image" 
          className={cn(
            "rounded-lg shadow-sm w-full transition-opacity duration-300",
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        
        {/* Image overlay actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleOpenExternal}
            className="p-1 rounded bg-black/50 text-white hover:bg-black/70 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      {/* Image metadata */}
      {metadata && (
        <div className="mt-2 text-xs text-muted-foreground space-y-1">
          {metadata.imageSize && (
            <div>Size: {metadata.imageSize}</div>
          )}
          {metadata.imageFormat && (
            <div>Format: {metadata.imageFormat.toUpperCase()}</div>
          )}
          {metadata.processingTime && (
            <div>Processed in {metadata.processingTime}ms</div>
          )}
        </div>
      )}
    </div>
  )
}

// Chart response renderer
const ChartRenderer: React.FC<{ content: any; metadata?: Record<string, any> }> = ({ 
  content, 
  metadata 
}) => {
  try {
    // Validate that content is a valid chart data structure
    if (!content || typeof content !== 'object') {
      throw new Error('Invalid chart data structure')
    }

    return <ChartRendererComponent data={content} />
  } catch (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">Chart Error</span>
        </div>
        <div className="text-sm text-destructive mb-2">
          {error instanceof Error ? error.message : 'Failed to render chart'}
        </div>
        <details className="text-xs text-destructive/80">
          <summary>Show raw data</summary>
          <pre className="mt-2 bg-destructive/5 p-2 rounded">
            {JSON.stringify(content, null, 2)}
          </pre>
        </details>
      </div>
    )
  }
}

// Error response renderer
const ErrorRenderer: React.FC<{ content: any; metadata?: Record<string, any> }> = ({ 
  content, 
  metadata 
}) => {
  const errorContent = typeof content === 'string' ? content : content.error || 'Unknown error'
  const errorDetails = typeof content === 'object' ? content.details : undefined
  const errorCode = typeof content === 'object' ? content.code : undefined

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm font-medium text-destructive">Error</span>
        {errorCode && (
          <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
            {errorCode}
          </span>
        )}
      </div>
      
      <div className="text-sm text-destructive mb-2">
        {errorContent}
      </div>
      
      {errorDetails && (
        <div className="text-xs text-destructive/80 bg-destructive/5 p-2 rounded">
          {errorDetails}
        </div>
      )}
      
      {metadata?.processingTime && (
        <div className="mt-2 text-xs text-muted-foreground">
          Failed after {metadata.processingTime}ms
        </div>
      )}
    </div>
  )
}

// Main ResponseRenderer component
export function ResponseRenderer({ responseData }: ResponseRendererProps) {
  switch (responseData.type) {
    case 'text':
      return <TextRenderer content={responseData.content} metadata={responseData.metadata} />
    
    case 'json':
      return <JsonRenderer content={responseData.content} metadata={responseData.metadata} />
    
    case 'image':
      return <ImageRenderer content={responseData.content} metadata={responseData.metadata} />
    
    case 'chart':
      return <ChartRenderer content={responseData.content} metadata={responseData.metadata} />
    
    case 'mixed':
      return <MixedContentRenderer content={responseData.content} />
    
    default:
      // Handle error type or unknown types
      return <ErrorRenderer content={responseData.content} metadata={responseData.metadata} />
  }
}