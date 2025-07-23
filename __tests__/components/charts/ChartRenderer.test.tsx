import React from 'react'
import { render, screen } from '@testing-library/react'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { ChartData } from '@/types'

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
  Copy: () => <div data-testid="copy" />,
  Download: () => <div data-testid="download" />,
  Maximize2: () => <div data-testid="maximize2" />,
  CheckCircle: () => <div data-testid="check-circle" />,
}))

// Mock child chart components
jest.mock('@/components/charts/BarChart', () => ({
  BarChart: ({ data, xKey, yKey, options }: any) => (
    <div data-testid="bar-chart" data-x-key={xKey} data-y-key={yKey}>
      Bar Chart: {data.length} items
    </div>
  ),
}))

jest.mock('@/components/charts/LineChart', () => ({
  LineChart: ({ data, xKey, yKey, options }: any) => (
    <div data-testid="line-chart" data-x-key={xKey} data-y-key={yKey}>
      Line Chart: {data.length} items
    </div>
  ),
}))

jest.mock('@/components/charts/PieChart', () => ({
  PieChart: ({ data, options }: any) => (
    <div data-testid="pie-chart">
      Pie Chart: {data.length} items
    </div>
  ),
}))

jest.mock('@/components/charts/AreaChart', () => ({
  AreaChart: ({ data, xKey, yKey, options }: any) => (
    <div data-testid="area-chart" data-x-key={xKey} data-y-key={yKey}>
      Area Chart: {data.length} items
    </div>
  ),
}))

jest.mock('@/components/charts/ChartError', () => ({
  ChartError: ({ message }: { message: string }) => (
    <div data-testid="chart-error">{message}</div>
  ),
}))

describe('ChartRenderer', () => {
  const mockBarData: ChartData = {
    type: 'bar',
    title: 'Sales Data',
    data: [
      { month: 'Jan', sales: 100 },
      { month: 'Feb', sales: 150 },
      { month: 'Mar', sales: 200 },
    ],
    xKey: 'month',
    yKey: 'sales',
    options: {
      colors: ['#2563eb'],
      showLegend: true,
    },
  }

  const mockLineData: ChartData = {
    type: 'line',
    title: 'Temperature Trend',
    data: [
      { time: '10:00', temp: 25 },
      { time: '11:00', temp: 26 },
      { time: '12:00', temp: 27 },
    ],
    xKey: 'time',
    yKey: 'temp',
  }

  const mockPieData: ChartData = {
    type: 'pie',
    title: 'Device Usage',
    data: [
      { name: 'Desktop', value: 45 },
      { name: 'Mobile', value: 35 },
      { name: 'Tablet', value: 20 },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Chart type rendering', () => {
    it('should render bar chart correctly', () => {
      render(<ChartRenderer data={mockBarData} />)
      
      expect(screen.getByText('📊 Sales Data')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      expect(screen.getByText('Bar Chart: 3 items')).toBeInTheDocument()
    })

    it('should render line chart correctly', () => {
      render(<ChartRenderer data={mockLineData} />)
      
      expect(screen.getByText('📊 Temperature Trend')).toBeInTheDocument()
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByText('Line Chart: 3 items')).toBeInTheDocument()
    })

    it('should render pie chart correctly', () => {
      render(<ChartRenderer data={mockPieData} />)
      
      expect(screen.getByText('📊 Device Usage')).toBeInTheDocument()
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
      expect(screen.getByText('Pie Chart: 3 items')).toBeInTheDocument()
    })
  })

  describe('Chart validation', () => {
    it('should show error for invalid chart data', () => {
      const invalidData = null as any
      render(<ChartRenderer data={invalidData} />)
      
      expect(screen.getByTestId('chart-error')).toBeInTheDocument()
      expect(screen.getByText('Chart data must be an object')).toBeInTheDocument()
    })

    it('should show error for invalid chart type', () => {
      const invalidData = { ...mockBarData, type: 'invalid' as any }
      render(<ChartRenderer data={invalidData} />)
      
      expect(screen.getByTestId('chart-error')).toBeInTheDocument()
      expect(screen.getByText('Invalid chart type: invalid')).toBeInTheDocument()
    })

    it('should show error for empty data array', () => {
      const invalidData = { ...mockBarData, data: [] }
      render(<ChartRenderer data={invalidData} />)
      
      expect(screen.getByTestId('chart-error')).toBeInTheDocument()
      expect(screen.getByText('Chart data must be a non-empty array')).toBeInTheDocument()
    })
  })

  describe('Chart info display', () => {
    it('should display chart information', () => {
      render(<ChartRenderer data={mockBarData} />)
      
      expect(screen.getByText('Type: bar')).toBeInTheDocument()
      expect(screen.getByText('Data points: 3')).toBeInTheDocument()
      expect(screen.getByText('X-axis: month')).toBeInTheDocument()
      expect(screen.getByText('Y-axis: sales')).toBeInTheDocument()
    })

    it('should use fallback title when title is not provided', () => {
      const dataWithoutTitle = { ...mockBarData, title: undefined }
      render(<ChartRenderer data={dataWithoutTitle} />)
      
      expect(screen.getByText('📊 Bar Chart')).toBeInTheDocument()
    })
  })
})