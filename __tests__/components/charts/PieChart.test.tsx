import React from 'react'
import { render, screen } from '@testing-library/react'
import { PieChart } from '@/components/charts/PieChart'
import { PieChartData } from '@/types'

// Mock Recharts components
jest.mock('recharts', () => ({
  PieChart: ({ children, data }: any) => (
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Pie: ({ data, dataKey, children }: any) => (
    <div data-testid="pie" data-key={dataKey} data-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Cell: ({ fill }: any) => <div data-testid="cell" data-fill={fill} />,
  Tooltip: ({ content }: any) => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

describe('PieChart', () => {
  const mockData: PieChartData[] = [
    { name: 'Desktop', value: 45 },
    { name: 'Mobile', value: 35 },
    { name: 'Tablet', value: 20 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic rendering', () => {
    it('should render pie chart with correct data', () => {
      render(<PieChart data={mockData} />)
      
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
      expect(screen.getByTestId('pie')).toBeInTheDocument()
      expect(screen.getByTestId('pie')).toHaveAttribute('data-key', 'value')
      expect(screen.getByTestId('pie')).toHaveAttribute('data-data', JSON.stringify(mockData))
    })

    it('should render cells for each data point', () => {
      render(<PieChart data={mockData} />)
      
      const cells = screen.getAllByTestId('cell')
      expect(cells).toHaveLength(mockData.length)
    })

    it('should use custom colors when provided in data', () => {
      const coloredData = [
        { name: 'Red', value: 30, color: '#ff0000' },
        { name: 'Blue', value: 70, color: '#0000ff' },
      ]
      
      render(<PieChart data={coloredData} />)
      
      const cells = screen.getAllByTestId('cell')
      expect(cells[0]).toHaveAttribute('data-fill', '#ff0000')
      expect(cells[1]).toHaveAttribute('data-fill', '#0000ff')
    })
  })

  describe('Options handling', () => {
    it('should apply default options', () => {
      render(<PieChart data={mockData} />)
      
      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })

    it('should hide tooltip when showTooltip is false', () => {
      const options = { showTooltip: false }
      render(<PieChart data={mockData} options={options} />)
      
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      const options = { showLegend: false }
      render(<PieChart data={mockData} options={options} />)
      
      expect(screen.queryByTestId('legend')).not.toBeInTheDocument()
    })

    it('should use custom colors from options', () => {
      const options = { colors: ['#ff0000', '#00ff00', '#0000ff'] }
      render(<PieChart data={mockData} options={options} />)
      
      const cells = screen.getAllByTestId('cell')
      expect(cells[0]).toHaveAttribute('data-fill', '#ff0000')
      expect(cells[1]).toHaveAttribute('data-fill', '#00ff00')
      expect(cells[2]).toHaveAttribute('data-fill', '#0000ff')
    })

    it('should use responsive container by default', () => {
      render(<PieChart data={mockData} />)
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('should show error for empty data', () => {
      render(<PieChart data={[]} />)
      
      expect(screen.getByText('No data available for pie chart')).toBeInTheDocument()
      expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument()
    })

    it('should show error for null data', () => {
      render(<PieChart data={null as any} />)
      
      expect(screen.getByText('No data available for pie chart')).toBeInTheDocument()
    })

    it('should show error for non-array data', () => {
      render(<PieChart data={'invalid' as any} />)
      
      expect(screen.getByText('No data available for pie chart')).toBeInTheDocument()
    })

    it('should show error when data lacks required structure', () => {
      const invalidData = [
        { foo: 'Desktop', bar: 45 },
        { foo: 'Mobile', bar: 35 },
      ]
      
      render(<PieChart data={invalidData as any} />)
      
      expect(screen.getByText("Pie chart data must have 'name' and 'value' properties")).toBeInTheDocument()
    })

    it('should show error when some items lack required properties', () => {
      const invalidData = [
        { name: 'Desktop', value: 45 },
        { name: 'Mobile' }, // Missing value
      ]
      
      render(<PieChart data={invalidData as any} />)
      
      expect(screen.getByText("Pie chart data must have 'name' and 'value' properties")).toBeInTheDocument()
    })
  })

  describe('Data validation', () => {
    it('should handle data with zero values', () => {
      const zeroData = [
        { name: 'Zero', value: 0 },
        { name: 'NonZero', value: 100 },
      ]
      
      render(<PieChart data={zeroData} />)
      
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })

    it('should handle data with negative values', () => {
      const negativeData = [
        { name: 'Positive', value: 50 },
        { name: 'Negative', value: -10 },
      ]
      
      render(<PieChart data={negativeData} />)
      
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })

    it('should handle data with decimal values', () => {
      const decimalData = [
        { name: 'First', value: 33.33 },
        { name: 'Second', value: 66.67 },
      ]
      
      render(<PieChart data={decimalData} />)
      
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })

    it('should handle data with extra properties', () => {
      const extraData = [
        { name: 'Desktop', value: 45, extra: 'info' },
        { name: 'Mobile', value: 35, category: 'device' },
      ]
      
      render(<PieChart data={extraData} />)
      
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })
  })

  describe('Color handling', () => {
    it('should cycle through colors when more data than colors', () => {
      const options = { colors: ['#ff0000', '#00ff00'] }
      const moreData = [
        { name: 'First', value: 25 },
        { name: 'Second', value: 25 },
        { name: 'Third', value: 25 },
        { name: 'Fourth', value: 25 },
      ]
      
      render(<PieChart data={moreData} options={options} />)
      
      const cells = screen.getAllByTestId('cell')
      expect(cells[0]).toHaveAttribute('data-fill', '#ff0000')
      expect(cells[1]).toHaveAttribute('data-fill', '#00ff00')
      expect(cells[2]).toHaveAttribute('data-fill', '#ff0000') // Cycles back
      expect(cells[3]).toHaveAttribute('data-fill', '#00ff00')
    })

    it('should prioritize item color over option colors', () => {
      const options = { colors: ['#ff0000', '#00ff00'] }
      const mixedData = [
        { name: 'Custom', value: 50, color: '#0000ff' },
        { name: 'Default', value: 50 },
      ]
      
      render(<PieChart data={mixedData} options={options} />)
      
      const cells = screen.getAllByTestId('cell')
      expect(cells[0]).toHaveAttribute('data-fill', '#0000ff') // Custom color
      expect(cells[1]).toHaveAttribute('data-fill', '#00ff00') // From options
    })
  })

  describe('Accessibility', () => {
    it('should render chart with proper structure', () => {
      render(<PieChart data={mockData} />)
      
      // The chart should render without throwing accessibility warnings
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })
  })
})