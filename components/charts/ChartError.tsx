'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ChartErrorProps {
  message: string
  details?: string
}

export function ChartError({ message, details }: ChartErrorProps) {
  return (
    <div className="flex items-center justify-center p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
      <div className="text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <h3 className="text-sm font-medium text-destructive mb-1">Chart Error</h3>
        <p className="text-sm text-destructive/80">{message}</p>
        {details && (
          <details className="mt-2 text-xs text-destructive/60">
            <summary className="cursor-pointer">Show details</summary>
            <pre className="mt-1 text-left bg-destructive/5 p-2 rounded text-xs">
              {details}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}