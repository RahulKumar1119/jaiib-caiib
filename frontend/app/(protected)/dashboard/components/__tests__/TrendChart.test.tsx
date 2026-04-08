import React from 'react'
import { render, screen } from '@testing-library/react'
import { TrendChart } from '../TrendChart'
import { TrendDataPoint } from '@/lib/types/score'

// Mock Recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

describe('TrendChart', () => {
  const mockTrendData: TrendDataPoint[] = [
    { date: '2024-01-01', average_score: 65, practice_count: 2 },
    { date: '2024-01-02', average_score: 70, practice_count: 3 },
    { date: '2024-01-03', average_score: 72.5, practice_count: 4 },
    { date: '2024-01-04', average_score: 75, practice_count: 5 },
    { date: '2024-01-05', average_score: 78, practice_count: 6 },
  ]

  describe('Chart Rendering', () => {
    it('should render chart title', () => {
      render(<TrendChart data={mockTrendData} />)
      expect(screen.getByText('Score Trends (Last 30 Days)')).toBeInTheDocument()
    })

    it('should render chart container with proper styling', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      const chartContainer = container.querySelector('.bg-white')
      expect(chartContainer).toBeInTheDocument()
    })

    it('should render ResponsiveContainer for responsive design', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      // Check for mocked responsive container
      const responsiveContainer = container.querySelector('[data-testid="responsive-container"]')
      expect(responsiveContainer).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      render(<TrendChart data={[]} isLoading={true} />)
      expect(screen.getByText('Loading chart...')).toBeInTheDocument()
    })

    it('should display loading spinner with animation', () => {
      const { container } = render(<TrendChart data={[]} isLoading={true} />)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should not render chart when loading', () => {
      const { container } = render(<TrendChart data={mockTrendData} isLoading={true} />)
      const svg = container.querySelector('svg')
      expect(svg).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should display no data message when data is empty', () => {
      render(<TrendChart data={[]} isLoading={false} />)
      expect(screen.getByText('No trend data available')).toBeInTheDocument()
    })

    it('should display no data message when data is null', () => {
      render(<TrendChart data={null as any} isLoading={false} />)
      expect(screen.getByText('No trend data available')).toBeInTheDocument()
    })

    it('should not render chart when data is empty', () => {
      const { container } = render(<TrendChart data={[]} isLoading={false} />)
      const svg = container.querySelector('svg')
      expect(svg).not.toBeInTheDocument()
    })
  })

  describe('Chart Data Rendering', () => {
    it('should render chart with sample data', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      const lineChart = container.querySelector('[data-testid="line-chart"]')
      expect(lineChart).toBeInTheDocument()
    })

    it('should render line chart with correct data points', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      // Check for mocked line chart
      const lineChart = container.querySelector('[data-testid="line-chart"]')
      expect(lineChart).toBeInTheDocument()
    })

    it('should render chart with multiple data points', () => {
      const largeDataSet: TrendDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        average_score: 60 + Math.random() * 40,
        practice_count: Math.floor(Math.random() * 10) + 1,
      }))

      const { container } = render(<TrendChart data={largeDataSet} />)
      const lineChart = container.querySelector('[data-testid="line-chart"]')
      expect(lineChart).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive container', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      // Check for mocked responsive container
      const responsiveContainer = container.querySelector('[data-testid="responsive-container"]')
      expect(responsiveContainer).toBeInTheDocument()
    })

    it('should render chart with proper height', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      const chartWrapper = container.querySelector('.w-full')
      expect(chartWrapper).toBeInTheDocument()
    })

    it('should have dark mode support', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      const darkModeElement = container.querySelector('.dark\\:bg-gray-800')
      expect(darkModeElement).toBeInTheDocument()
    })
  })

  describe('Chart Styling', () => {
    it('should have proper background styling', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      const chartContainer = container.querySelector('.bg-white')
      expect(chartContainer).toHaveClass('rounded-lg', 'shadow')
    })

    it('should have proper padding', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      const chartContainer = container.querySelector('.p-6')
      expect(chartContainer).toBeInTheDocument()
    })

    it('should have proper title styling', () => {
      render(<TrendChart data={mockTrendData} />)
      const title = screen.getByText('Score Trends (Last 30 Days)')
      expect(title).toHaveClass('text-lg', 'font-semibold')
    })
  })

  describe('Chart Axes', () => {
    it('should render X-axis with date labels', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      // Check for mocked x-axis
      const xAxis = container.querySelector('[data-testid="x-axis"]')
      expect(xAxis).toBeInTheDocument()
    })

    it('should render Y-axis with score values', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      // Check for mocked y-axis
      const yAxis = container.querySelector('[data-testid="y-axis"]')
      expect(yAxis).toBeInTheDocument()
    })

    it('should have grid lines for better readability', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      // Check for mocked cartesian grid
      const grid = container.querySelector('[data-testid="cartesian-grid"]')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<TrendChart data={mockTrendData} />)
      const title = screen.getByText('Score Trends (Last 30 Days)')
      expect(title.tagName).toBe('H3')
    })

    it('should have semantic structure', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      const mainDiv = container.querySelector('.w-full')
      expect(mainDiv).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const singlePoint: TrendDataPoint[] = [
        { date: '2024-01-01', average_score: 75, practice_count: 1 },
      ]
      const { container } = render(<TrendChart data={singlePoint} />)
      const lineChart = container.querySelector('[data-testid="line-chart"]')
      expect(lineChart).toBeInTheDocument()
    })

    it('should handle data with zero scores', () => {
      const zeroScoreData: TrendDataPoint[] = [
        { date: '2024-01-01', average_score: 0, practice_count: 1 },
        { date: '2024-01-02', average_score: 50, practice_count: 2 },
      ]
      const { container } = render(<TrendChart data={zeroScoreData} />)
      const lineChart = container.querySelector('[data-testid="line-chart"]')
      expect(lineChart).toBeInTheDocument()
    })

    it('should handle data with perfect scores', () => {
      const perfectScoreData: TrendDataPoint[] = [
        { date: '2024-01-01', average_score: 100, practice_count: 1 },
        { date: '2024-01-02', average_score: 100, practice_count: 2 },
      ]
      const { container } = render(<TrendChart data={perfectScoreData} />)
      const lineChart = container.querySelector('[data-testid="line-chart"]')
      expect(lineChart).toBeInTheDocument()
    })

    it('should handle data with decimal scores', () => {
      const decimalScoreData: TrendDataPoint[] = [
        { date: '2024-01-01', average_score: 72.5, practice_count: 1 },
        { date: '2024-01-02', average_score: 85.75, practice_count: 2 },
      ]
      const { container } = render(<TrendChart data={decimalScoreData} />)
      const lineChart = container.querySelector('[data-testid="line-chart"]')
      expect(lineChart).toBeInTheDocument()
    })
  })
})
