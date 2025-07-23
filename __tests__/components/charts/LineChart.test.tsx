import React from 'react'
import { render, screen } from '@testing-library/react'
import { LineChart } from '@/components/charts/LineChart'
import { LineChartData } from '@/types'

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke }: any) => (
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} />
  ),
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

describe('LineChart', () => {
  const mockData: LineChartData[] = [
    { name: 'Jan', value: 100 },
    { name: 'Feb', value: 150 },
    { name: 'Mar', value: 200 },
    { name: 'Apr', value: 180 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic rendering', () => {
    it('should render line chart with correct data', () => {
      render(<LineChart data={mockData} />)
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('line')).toBeInTheDocument()
      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
      
      // Check data is passed correctly
      const chartElement = screen.getByTestId('line-chart')
      expect(chartElement).toHaveAttribute('data-chart-data', JSON.stringify(mockData))
    })

    it('should use default keys when not provided', () => {
      render(<LineChart data={mockData} />)
      
      expect(screen.getByTestId('x-axis')).toHaveAttribute('data-key', 'name')
      expect(screen.getByTestId('line')).toHaveAttribute('data-key', 'value')
    })

    it('should use custom keys when provided', () => {
      const customData = [
        { time: '10:00', temperature: 25 },
        { time: '11:00', temperature: 26 },
      ]
      
      render(<LineChart data={customData} xKey="time" yKey="temperature" />)
      
      expect(screen.getByTestId('x-axis')).toHaveAttribute('data-key', 'time')
      expect(screen.getByTestId('line')).toHaveAttribute('data-key', 'temperature')
    })
  })

  describe('Options handling', () => {
    it('should apply default options', () => {
      render(<LineChart data={mockData} />)
      
      expect(screen.getByTestId('grid')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })

    it('should hide grid when showGrid is false', () => {
      const options = { showGrid: false }
      render(<LineChart data={mockData} options={options} />)
      
      expect(screen.queryByTestId('grid')).not.toBeInTheDocument()
    })

    it('should hide tooltip when showTooltip is false', () => {
      const options = { showTooltip: false }
      render(<LineChart data={mockData} options={options} />)
      
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      const options = { showLegend: false }
      render(<LineChart data={mockData} options={options} />)
      
      expect(screen.queryByTestId('legend')).not.toBeInTheDocument()
    })

    it('should use custom colors', () => {
      const options = { colors: ['#ff0000', '#00ff00'] }
      render(<LineChart data={mockData} options={options} />)
      
      expect(screen.getByTestId('line')).toHaveAttribute('data-stroke', '#ff0000')
    })

    it('should use responsive container by default', () => {
      render(<LineChart data={mockData} />)
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('should show error for empty data', () => {
      render(<LineChart data={[]} />)
      
      expect(screen.getByText('No data available for line chart')).toBeInTheDocument()
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
    })

    it('should show error for null data', () => {
      render(<LineChart data={null as any} />)
      
      expect(screen.getByText('No data available for line chart')).toBeInTheDocument()
    })

    it('should show error for non-array data', () => {
      render(<LineChart data={'invalid' as any} />)
      
      expect(screen.getByText('No data available for line chart')).toBeInTheDocument()
    })

    it('should show error when required keys are missing', () => {
      const invalidData = [
        { foo: 'Jan', bar: 100 },
        { foo: 'Feb', bar: 150 },
      ]
      
      render(<LineChart data={invalidData} xKey="name" yKey="value" />)
      
      expect(screen.getByText('Missing required keys: name or value')).toBeInTheDocument()
    })
  })

  describe('Data validation', () => {
    it('should handle data with mixed types', () => {
      const mixedData = [
        { name: 'Jan', value: 100 },
        { name: 'Feb', value: '150' }, // String value
        { name: 'Mar', value: 200 },
      ]
      
      render(<LineChart data={mixedData} />)
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should handle single data point', () => {
      const singleData = [{ name: 'Jan', value: 100 }]
      
      render(<LineChart data={singleData} />)
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should handle large datasets', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        name: `Point ${i}`,
        value: Math.random() * 100
      }))
      
      render(<LineChart data={largeData} />)
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render chart with proper structure', () => {
      render(<LineChart data={mockData} />)
      
      // The chart should render without throwing accessibility warnings
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })
})