'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface ThinkingStatus {
  sessionId: string
  messageId: string
  status: string
  message: string
  type: 'thinking' | 'processing' | 'typing'
  timestamp: string
}

interface UseThinkingStatusOptions {
  pollingInterval?: number
  enabled?: boolean
}

export function useThinkingStatus(
  sessionId: string | null,
  messageId: string | null,
  options: UseThinkingStatusOptions = {}
) {
  const { pollingInterval = 500, enabled = true } = options
  const [status, setStatus] = useState<ThinkingStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!sessionId || !messageId || !enabled) return

    try {
      const response = await fetch(
        `/api/status?sessionId=${sessionId}&messageId=${messageId}`
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('Thinking status received:', data)
        if (data.status) {
          console.log('Setting thinking status:', data.status)
          setStatus(data.status)
        } else {
          setStatus(null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch thinking status:', error)
    }
  }, [sessionId, messageId, enabled])

  const clearStatus = useCallback(async () => {
    if (!sessionId || !messageId) return

    try {
      await fetch(
        `/api/status?sessionId=${sessionId}&messageId=${messageId}`,
        { method: 'DELETE' }
      )
      setStatus(null)
    } catch (error) {
      console.error('Failed to clear status:', error)
    }
  }, [sessionId, messageId])

  // Start/stop polling
  useEffect(() => {
    if (enabled && sessionId && messageId) {
      setIsPolling(true)
      
      // Initial fetch
      fetchStatus()
      
      // Set up polling
      intervalRef.current = setInterval(fetchStatus, pollingInterval)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setIsPolling(false)
      }
    }
  }, [enabled, sessionId, messageId, pollingInterval, fetchStatus])

  return {
    status,
    isPolling,
    clearStatus,
    refetch: fetchStatus
  }
}

// Hook for simulating streaming text
export function useStreamingText(
  text: string,
  options: { speed?: number; enabled?: boolean } = {}
) {
  const { speed = 20, enabled = true } = options
  const [displayedText, setDisplayedText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const indexRef = useRef(0)

  useEffect(() => {
    console.log('useStreamingText called:', { text: text?.substring(0, 50) + '...', enabled, textLength: text?.length })
    
    if (!enabled || !text) {
      console.log('Streaming disabled or no text, showing immediately')
      setDisplayedText(text)
      return
    }

    console.log('Starting streaming animation')
    // Reset state
    setDisplayedText('')
    indexRef.current = 0
    setIsStreaming(true)

    intervalRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1))
        indexRef.current++
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setIsStreaming(false)
      }
    }, speed)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [text, speed, enabled])

  return { displayedText, isStreaming }
}
