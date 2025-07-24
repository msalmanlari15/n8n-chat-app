import {
  formatRelativeTime,
  formatFullTimestamp,
  sortSessionsByActivity,
  isWithin24Hours,
  getSessionActivityStatus,
} from '@/lib/date-utils'

// Mock date-fns functions
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(),
  format: jest.fn(),
  isToday: jest.fn(),
  isYesterday: jest.fn(),
}))

const mockFormat = require('date-fns').format as jest.Mock
const mockFormatDistanceToNow = require('date-fns').formatDistanceToNow as jest.Mock
const mockIsToday = require('date-fns').isToday as jest.Mock
const mockIsYesterday = require('date-fns').isYesterday as jest.Mock

describe('date-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock current date to be consistent
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('formatRelativeTime', () => {
    it('should format today dates as time', () => {
      const today = new Date('2024-01-15T10:30:00Z')
      mockIsToday.mockReturnValue(true)
      mockFormat.mockReturnValue('10:30')

      const result = formatRelativeTime(today)

      expect(mockIsToday).toHaveBeenCalledWith(today)
      expect(mockFormat).toHaveBeenCalledWith(today, 'HH:mm')
      expect(result).toBe('10:30')
    })

    it('should format yesterday dates as "Yesterday"', () => {
      const yesterday = new Date('2024-01-14T10:30:00Z')
      mockIsToday.mockReturnValue(false)
      mockIsYesterday.mockReturnValue(true)

      const result = formatRelativeTime(yesterday)

      expect(mockIsYesterday).toHaveBeenCalledWith(yesterday)
      expect(result).toBe('Yesterday')
    })

    it('should format dates within a week as relative time', () => {
      const weekAgo = new Date('2024-01-10T10:30:00Z')
      mockIsToday.mockReturnValue(false)
      mockIsYesterday.mockReturnValue(false)
      mockFormatDistanceToNow.mockReturnValue('3 days ago')

      const result = formatRelativeTime(weekAgo)

      expect(mockFormatDistanceToNow).toHaveBeenCalledWith(weekAgo, { addSuffix: true })
      expect(result).toBe('3 days ago')
    })

    it('should format older dates as month and day', () => {
      const oldDate = new Date('2024-01-01T10:30:00Z')
      mockIsToday.mockReturnValue(false)
      mockIsYesterday.mockReturnValue(false)
      mockFormat.mockReturnValue('Jan 1')

      const result = formatRelativeTime(oldDate)

      expect(mockFormat).toHaveBeenCalledWith(oldDate, 'MMM d')
      expect(result).toBe('Jan 1')
    })

    it('should handle errors gracefully', () => {
      mockIsToday.mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = formatRelativeTime(new Date())

      expect(result).toBe('Unknown')
    })
  })

  describe('formatFullTimestamp', () => {
    it('should format full timestamp', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      mockFormat.mockReturnValue('January 15, 2024 at 12:00 PM')

      const result = formatFullTimestamp(date)

      expect(mockFormat).toHaveBeenCalledWith(date, 'PPpp')
      expect(result).toBe('January 15, 2024 at 12:00 PM')
    })

    it('should handle errors gracefully', () => {
      mockFormat.mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = formatFullTimestamp(new Date())

      expect(result).toBe('Unknown')
    })
  })

  describe('sortSessionsByActivity', () => {
    it('should sort sessions by last activity (most recent first)', () => {
      const sessions = [
        {
          id: '1',
          metadata: { lastActivity: new Date('2024-01-10T10:00:00Z') },
        },
        {
          id: '2',
          metadata: { lastActivity: new Date('2024-01-15T10:00:00Z') },
        },
        {
          id: '3',
          metadata: { lastActivity: new Date('2024-01-12T10:00:00Z') },
        },
      ]

      const result = sortSessionsByActivity(sessions)

      expect(result).toEqual([
        { id: '2', metadata: { lastActivity: new Date('2024-01-15T10:00:00Z') } },
        { id: '3', metadata: { lastActivity: new Date('2024-01-12T10:00:00Z') } },
        { id: '1', metadata: { lastActivity: new Date('2024-01-10T10:00:00Z') } },
      ])
    })

    it('should not mutate the original array', () => {
      const sessions = [
        {
          id: '1',
          metadata: { lastActivity: new Date('2024-01-10T10:00:00Z') },
        },
        {
          id: '2',
          metadata: { lastActivity: new Date('2024-01-15T10:00:00Z') },
        },
      ]

      const originalOrder = [...sessions]
      const result = sortSessionsByActivity(sessions)

      expect(sessions).toEqual(originalOrder)
      expect(result).not.toBe(sessions)
    })
  })

  describe('isWithin24Hours', () => {
    it('should return true for dates within 24 hours', () => {
      const recentDate = new Date('2024-01-15T10:00:00Z') // 2 hours ago

      const result = isWithin24Hours(recentDate)

      expect(result).toBe(true)
    })

    it('should return false for dates older than 24 hours', () => {
      const oldDate = new Date('2024-01-14T10:00:00Z') // 26 hours ago

      const result = isWithin24Hours(oldDate)

      expect(result).toBe(false)
    })

    it('should handle edge case of exactly 24 hours', () => {
      const exactDate = new Date('2024-01-14T12:00:00Z') // Exactly 24 hours ago

      const result = isWithin24Hours(exactDate)

      expect(result).toBe(false)
    })
  })

  describe('getSessionActivityStatus', () => {
    it('should return "active" for activity within 24 hours', () => {
      const recentDate = new Date('2024-01-15T10:00:00Z')

      const result = getSessionActivityStatus(recentDate)

      expect(result).toBe('active')
    })

    it('should return "recent" for activity within a week', () => {
      const recentDate = new Date('2024-01-10T10:00:00Z') // 5 days ago

      const result = getSessionActivityStatus(recentDate)

      expect(result).toBe('recent')
    })

    it('should return "old" for activity older than a week', () => {
      const oldDate = new Date('2024-01-01T10:00:00Z') // 14 days ago

      const result = getSessionActivityStatus(oldDate)

      expect(result).toBe('old')
    })

    it('should handle edge case of exactly 7 days', () => {
      const weekOldDate = new Date('2024-01-08T12:00:00Z') // Exactly 7 days ago

      const result = getSessionActivityStatus(weekOldDate)

      expect(result).toBe('old')
    })
  })
})