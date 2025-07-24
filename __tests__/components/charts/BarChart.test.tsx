import React from 'react'
import { render, screen } from '@testing-library/react'
import { BarChart } from '@/components/charts/BarChart'
import { BarChartData } from '@/types'

// Mock Recharts components
jest.mock('recharts', () => ({
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, fill }: any) => (
    <div data-testid="bar" data-key={dataKey} data-fill={fill} />
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

describe('BarChart', () => {
  const mockData: BarChartData[] = [
    { name: 'Jan', value: 100 },
    { name: 'Feb', value: 150 },
    { name: 'Mar', value: 200 },
    { name: 'Apr', value: 180 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic rendering', () => {
    it('should render bar chart with correct data', () => {
      render(<BarChart data={mockData} />)
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      expect(screen.getByTestId('bar')).toBeInTheDocument()
      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
      
      // Check data is passed correctly
      const chartElement = screen.getByTestId('bar-chart')
      expect(chartElement).toHaveAttribute('data-chart-data', JSON.stringify(mockData))
    })

    it('should use default keys when not provided', () => {
      render(<BarChart data={mockData} />)
      
      expect(screen.getByTestId('x-axis')).toHaveAttribute('data-key', 'name')
      expect(screen.getByTestId('bar')).toHaveAttribute('data-key', 'value')
    })

    it('should use custom keys when provided', () => {
      const customData = [
        { month: 'Jan', sales: 100 },
        { month: 'Feb', sales: 150 },
      ]
      
      render(<BarChart data={customData} xKey="month" yKey="sales" />)
      
      expect(screen.getByTestId('x-axis')).toHaveAttribute('data-key', 'month')
      expect(screen.getByTestId('bar')).toHaveAttribute('data-key', 'sales')
    })
  })

  describe('Options handling', () => {
    it('should apply default options', () => {
      render(<BarChart data={mockData} />)
      
      expect(screen.getByTestId('grid')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })

    it('should hide grid when showGrid is false', () => {
      const options = { showGrid: false }
      render(<BarChart data={mockData} options={options} />)
      
      expect(screen.queryByTestId('grid')).not.toBeInTheDocument()
    })

    it('should hide tooltip when showTooltip is false', () => {
      const options = { showTooltip: false }
      render(<BarChart data={mockData} options={options} />)
      
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      const options = { showLegend: false }
      render(<BarChart data={mockData} options={options} />)
      
      expect(screen.queryByTestId('legend')).not.toBeInTheDocument()
    })

    it('should use custom colors', () => {
      const options = { colors: ['#ff0000', '#00ff00'] }
      render(<BarChart data={mockData} options={options} />)
      
      expect(screen.getByTestId('bar')).toHaveAttribute('data-fill', '#ff0000')
    })

    it('should use responsive container by default', () => {
      render(<BarChart data={mockData} />)
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('should show error for empty data', () => {
      render(<BarChart data={[]} />)
      
      expect(screen.getByText('No data available for bar chart')).toBeInTheDocument()
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
    })

    it('should show error for null data', () => {
      render(<BarChart data={null as any} />)
      
      expect(screen.getByText('No data available for bar chart')).toBeInTheDocument()
    })

    it('should show error for non-array data', () => {
      render(<BarChart data={'invalid' as any} />)
      
      expect(screen.getByText('No data available for bar chart')).toBeInTheDocument()
    })

    it('should show error when required keys are missing', () => {
      const invalidData = [
        { foo: 'Jan', bar: 100 },
        { foo: 'Feb', bar: 150 },
      ]
      
      render(<BarChart data={invalidData} xKey="name" yKey="value" />)
      
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
      
      render(<BarChart data={mixedData} />)
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    it('should handle data with extra properties', () => {
      const extraData = [
        { name: 'Jan', value: 100, extra: 'info' },
        { name: 'Feb', value: 150, another: 'prop' },
      ]
      
      render(<BarChart data={extraData} />)
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render chart with proper structure', () => {
      render(<BarChart data={mockData} />)
      
      // The chart should render without throwing accessibility warnings
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })
})