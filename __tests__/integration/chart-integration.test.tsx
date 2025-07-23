import React from 'react'
import { render, screen } from '@testing-library/react'
import { ResponseRenderer } from '@/components/chat/ResponseRenderer'
import { ResponseData } from '@/types'

// Mock Recharts components
jest.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="recharts-bar-chart">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="recharts-line-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="recharts-pie-chart">{children}</div>,
  Bar: () => <div data-testid="recharts-bar" />,
  Line: () => <div data-testid="recharts-line" />,
  Pie: ({ children }: any) => <div data-testid="recharts-pie">{children}</div>,
  Cell: () => <div data-testid="recharts-cell" />,
  XAxis: () => <div data-testid="recharts-x-axis" />,
  YAxis: () => <div data-testid="recharts-y-axis" />,
  CartesianGrid: () => <div data-testid="recharts-grid" />,
  Tooltip: () => <div data-testid="recharts-tooltip" />,
  Legend: () => <div data-testid="recharts-legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="recharts-responsive-container">{children}</div>,
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
  Copy: () => <div data-testid="copy" />,
  Download: () => <div data-testid="download" />,
  Maximize2: () => <div data-testid="maximize2" />,
  CheckCircle: () => <div data-testid="check-circle" />,
  AlertCircle: () => <div data-testid="alert-circle" />,
  ExternalLink: () => <div data-testid="external-link" />,
}))

describe('Chart Integration Tests', () => {
  describe('ResponseRenderer with Chart Data', () => {
    it('should render bar chart through ResponseRenderer', () => {
      const chartResponseData: ResponseData = {
        type: 'chart',
        content: {
          type: 'bar',
          title: 'Sales Performance',
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
        },
      }

      render(<ResponseRenderer responseData={chartResponseData} />)

      // Check that chart renderer is displayed
      expect(screen.getByText('📊 Sales Performance')).toBeInTheDocument()
      expect(screen.getByText('Type: bar')).toBeInTheDocument()
      expect(screen.getByText('Data points: 3')).toBeInTheDocument()
      expect(screen.getByText('X-axis: month')).toBeInTheDocument()
      expect(screen.getByText('Y-axis: sales')).toBeInTheDocument()
      
      // Check that Recharts components are rendered
      expect(screen.getByTestId('recharts-responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('recharts-bar-chart')).toBeInTheDocument()
      expect(screen.getByTestId('recharts-bar')).toBeInTheDocument()
    })

    it('should render pie chart through ResponseRenderer', () => {
      const chartResponseData: ResponseData = {
        type: 'chart',
        content: {
          type: 'pie',
          title: 'Device Usage',
          data: [
            { name: 'Desktop', value: 45 },
            { name: 'Mobile', value: 35 },
            { name: 'Tablet', value: 20 },
          ],
          options: {
            colors: ['#2563eb', '#dc2626', '#16a34a'],
            showLegend: true,
          },
        },
      }

      render(<ResponseRenderer responseData={chartResponseData} />)

      // Check that chart renderer is displayed
      expect(screen.getByText('📊 Device Usage')).toBeInTheDocument()
      expect(screen.getByText('Type: pie')).toBeInTheDocument()
      expect(screen.getByText('Data points: 3')).toBeInTheDocument()
      
      // Check that Recharts components are rendered
      expect(screen.getByTestId('recharts-responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('recharts-pie-chart')).toBeInTheDocument()
      expect(screen.getByTestId('recharts-pie')).toBeInTheDocument()
    })

    it('should render line chart through ResponseRenderer', () => {
      const chartResponseData: ResponseData = {
        type: 'chart',
        content: {
          type: 'line',
          title: 'Temperature Trend',
          data: [
            { time: '10:00', temp: 25 },
            { time: '11:00', temp: 26 },
            { time: '12:00', temp: 27 },
            { time: '13:00', temp: 28 },
          ],
          xKey: 'time',
          yKey: 'temp',
          options: {
            colors: ['#dc2626'],
            showGrid: true,
          },
        },
      }

      render(<ResponseRenderer responseData={chartResponseData} />)

      // Check that chart renderer is displayed
      expect(screen.getByText('📊 Temperature Trend')).toBeInTheDocument()
      expect(screen.getByText('Type: line')).toBeInTheDocument()
      expect(screen.getByText('Data points: 4')).toBeInTheDocument()
      expect(screen.getByText('X-axis: time')).toBeInTheDocument()
      expect(screen.getByText('Y-axis: temp')).toBeInTheDocument()
      
      // Check that Recharts components are rendered
      expect(screen.getByTestId('recharts-responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('recharts-line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('recharts-line')).toBeInTheDocument()
    })

    it('should handle chart errors gracefully', () => {
      const invalidChartResponseData: ResponseData = {
        type: 'chart',
        content: {
          type: 'invalid',
          title: 'Invalid Chart',
          data: [],
        },
      }

      render(<ResponseRenderer responseData={invalidChartResponseData} />)

      // Check that error handling works
      expect(screen.getByText('Chart Error')).toBeInTheDocument()
      expect(screen.getByText('Invalid chart type: invalid')).toBeInTheDocument()
      expect(screen.getByTestId('alert-circle')).toBeInTheDocument()
    })
  })

  describe('Mock n8n Chart Responses', () => {
    it('should handle n8n bar chart response format', () => {
      // Simulate what n8n might return for a chart
      const n8nChartResponse: ResponseData = {
        type: 'chart',
        content: {
          type: 'bar',
          title: 'Monthly Revenue',
          data: [
            { month: 'January', revenue: 50000 },
            { month: 'February', revenue: 65000 },
            { month: 'March', revenue: 70000 },
            { month: 'April', revenue: 82000 },
          ],
          xKey: 'month',
          yKey: 'revenue',
          options: {
            colors: ['#059669'],
            showLegend: false,
            showGrid: true,
          },
        },
        metadata: {
          processingTime: 150,
          source: 'n8n-workflow',
        },
      }

      render(<ResponseRenderer responseData={n8nChartResponse} />)

      expect(screen.getByText('📊 Monthly Revenue')).toBeInTheDocument()
      expect(screen.getByText('Type: bar')).toBeInTheDocument()
      expect(screen.getByText('Data points: 4')).toBeInTheDocument()
      expect(screen.getByTestId('recharts-bar-chart')).toBeInTheDocument()
    })

    it('should handle n8n pie chart response format', () => {
      // Simulate what n8n might return for a pie chart
      const n8nPieResponse: ResponseData = {
        type: 'chart',
        content: {
          type: 'pie',
          title: 'Traffic Sources',
          data: [
            { name: 'Organic Search', value: 45.2 },
            { name: 'Direct', value: 32.1 },
            { name: 'Social Media', value: 15.7 },
            { name: 'Email', value: 7.0 },
          ],
          options: {
            colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
            showLegend: true,
          },
        },
        metadata: {
          processingTime: 89,
          source: 'n8n-analytics',
        },
      }

      render(<ResponseRenderer responseData={n8nPieResponse} />)

      expect(screen.getByText('📊 Traffic Sources')).toBeInTheDocument()
      expect(screen.getByText('Type: pie')).toBeInTheDocument()
      expect(screen.getByText('Data points: 4')).toBeInTheDocument()
      expect(screen.getByTestId('recharts-pie-chart')).toBeInTheDocument()
    })

    it('should handle n8n line chart response format', () => {
      // Simulate what n8n might return for a line chart
      const n8nLineResponse: ResponseData = {
        type: 'chart',
        content: {
          type: 'line',
          title: 'User Activity Over Time',
          data: [
            { timestamp: '2024-01-01', activeUsers: 1250 },
            { timestamp: '2024-01-02', activeUsers: 1380 },
            { timestamp: '2024-01-03', activeUsers: 1420 },
            { timestamp: '2024-01-04', activeUsers: 1550 },
            { timestamp: '2024-01-05', activeUsers: 1680 },
          ],
          xKey: 'timestamp',
          yKey: 'activeUsers',
          options: {
            colors: ['#8b5cf6'],
            showGrid: true,
            showLegend: false,
          },
        },
        metadata: {
          processingTime: 200,
          source: 'n8n-analytics',
        },
      }

      render(<ResponseRenderer responseData={n8nLineResponse} />)

      expect(screen.getByText('📊 User Activity Over Time')).toBeInTheDocument()
      expect(screen.getByText('Type: line')).toBeInTheDocument()
      expect(screen.getByText('Data points: 5')).toBeInTheDocument()
      expect(screen.getByText('X-axis: timestamp')).toBeInTheDocument()
      expect(screen.getByText('Y-axis: activeUsers')).toBeInTheDocument()
      expect(screen.getByTestId('recharts-line-chart')).toBeInTheDocument()
    })
  })
})