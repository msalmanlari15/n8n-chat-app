/**
 * Date utility functions for the chat application
 */

import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

/**
 * Format a date as a relative time string
 * @param date - The date to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date): string {
  try {
    if (isToday(date)) {
      return format(date, 'HH:mm')
    }
    
    if (isYesterday(date)) {
      return 'Yesterday'
    }
    
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays < 7) {
      return formatDistanceToNow(date, { addSuffix: true })
    }
    
    return format(date, 'MMM d')
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return 'Unknown'
  }
}

/**
 * Format a date as a full timestamp
 * @param date - The date to format
 * @returns Formatted full timestamp
 */
export function formatFullTimestamp(date: Date): string {
  try {
    return format(date, 'PPpp')
  } catch (error) {
    console.error('Error formatting full timestamp:', error)
    return 'Unknown'
  }
}

/**
 * Sort sessions by last activity (most recent first)
 * @param sessions - Array of chat sessions
 * @returns Sorted array of sessions
 */
export function sortSessionsByActivity<T extends { metadata: { lastActivity: Date } }>(sessions: T[]): T[] {
  return [...sessions].sort((a, b) => 
    b.metadata.lastActivity.getTime() - a.metadata.lastActivity.getTime()
  )
}

/**
 * Check if a date is within the last 24 hours
 * @param date - The date to check
 * @returns True if within last 24 hours
 */
export function isWithin24Hours(date: Date): boolean {
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  return diffInHours < 24
}

/**
 * Get a human-readable session activity status
 * @param lastActivity - The last activity date
 * @returns Activity status string
 */
export function getSessionActivityStatus(lastActivity: Date): string {
  if (isWithin24Hours(lastActivity)) {
    return 'active'
  }
  
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 7) {
    return 'recent'
  }
  
  return 'old'
}

/**
 * Get time-based category for session grouping
 * @param lastActivity - The last activity date
 * @returns Time category string
 */
export function getSessionTimeCategory(lastActivity: Date): string {
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
  
  if (isToday(lastActivity)) {
    return 'Today'
  }
  
  if (isYesterday(lastActivity)) {
    return 'Yesterday'
  }
  
  if (diffInDays < 7) {
    return 'This Week'
  }
  
  if (diffInDays < 30) {
    return 'This Month'
  }
  
  return 'Older'
}

/**
 * Group sessions by time categories
 * @param sessions - Array of chat sessions
 * @returns Object with grouped sessions
 */
export function groupSessionsByTime<T extends { metadata: { lastActivity: Date } }>(sessions: T[]): Record<string, T[]> {
  const sorted = sortSessionsByActivity(sessions)
  const groups: Record<string, T[]> = {}
  
  for (const session of sorted) {
    const category = getSessionTimeCategory(session.metadata.lastActivity)
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(session)
  }
  
  return groups
}