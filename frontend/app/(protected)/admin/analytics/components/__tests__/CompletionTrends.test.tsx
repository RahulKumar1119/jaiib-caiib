import React from 'react'
import { render, screen } from '@testing-library/react'
import { CompletionTrends } from '../CompletionTrends'

// Mock Recharts
jest.mock('recharts', () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, name }: any) => <div data-testid={`line-${dataKey}`}>{name}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

describe('CompletionTrends Component', () => {
  const mockTrendData = [
    {
      date: '2024-01-01',
      total_completions: 45,
      paper_breakdown: {
        JAIIB_IE_IFS: 12,
        JAIIB_PPB: 11,
        JAIIB_AFB: 11,
        JAIIB_RBWM: 11,
      },
    },
    {
      date: '2024-01-02',
      total_completions: 52,
      paper_breakdown: {
        JAIIB_IE_IFS: 14,
        JAIIB_PPB: 13,
        JAIIB_AFB: 12,
        JAIIB_RBWM: 13,
      },
    },
    {
      date: '2024-01-03',
      total_completions: 48,
      paper_breakdown: {
        JAIIB_IE_IFS: 13,
        JAIIB_PPB: 12,
        JAIIB_AFB: 11,
        JAIIB_RBWM: 12,
      },
    },
  ]

  describe('Rendering', () => {
    it('should render completion trends section', () => {
      render(<CompletionTrends data={mockTrendData} />)
      expect(screen.getByText('Practice Set Completion Trends')).toBeInTheDocument()
    })

    it('should display chart', () => {
      render(<CompletionTrends data={mockTrendData} />)
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should display responsive container', () => {
      render(<CompletionTrends data={mockTrendData} />)
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should display chart components', () => {
      render(<CompletionTrends data={mockTrendData} />)
      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })
  })

  describe('Chart Data', () => {
    it('should format dates correctly for chart', () => {
      render(<CompletionTrends data={mockTrendData} />)
      const chart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
      
      expect(chartData[0].date).toMatch(/Jan/)
      expect(chartData[0].date).toMatch(/\d/)
    })

    it('should include total completions in chart data', () => {
      render(<CompletionTrends data={mockTrendData} />)
      const chart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
      
      expect(chartData[0].total).toBe(45)
      expect(chartData[1].total).toBe(52)
    })

    it('should include paper breakdown in chart data', () => {
      render(<CompletionTrends data={mockTrendData} />)
      const chart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
      
      expect(chartData[0].JAIIB_IE_IFS).toBe(12)
      expect(chartData[0].JAIIB_PPB).toBe(11)
    })
  })

  describe('Chart Lines', () => {
    it('should display total completions line', () => {
      render(<CompletionTrends data={mockTrendData} />)
      expect(screen.getByTestId('line-total')).toBeInTheDocument()
    })

    it('should display lines for each paper', () => {
      render(<CompletionTrends data={mockTrendData} />)
      expect(screen.getByTestId('line-JAIIB_IE_IFS')).toBeInTheDocument()
      expect(screen.getByTestId('line-JAIIB_PPB')).toBeInTheDocument()
      expect(screen.getByTestId('line-JAIIB_AFB')).toBeInTheDocument()
      expect(screen.getByTestId('line-JAIIB_RBWM')).toBeInTheDocument()
    })

    it('should display paper names in legend', () => {
      render(<CompletionTrends data={mockTrendData} />)
      expect(screen.getByText('Total Completions')).toBeInTheDocument()
      expect(screen.getByText('IE & IFS')).toBeInTheDocument()
      expect(screen.getByText('PPB')).toBeInTheDocument()
      expect(screen.getByText('AFB')).toBeInTheDocument()
      expect(screen.getByText('RBWM')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should display no data message when data is empty', () => {
      render(<CompletionTrends data={[]} />)
      expect(screen.getByText('No trend data available')).toBeInTheDocument()
    })

    it('should display no data message when data is null', () => {
      render(<CompletionTrends data={null as any} />)
      expect(screen.getByText('No trend data available')).toBeInTheDocument()
    })

    it('should display section title even with no data', () => {
      render(<CompletionTrends data={[]} />)
      expect(screen.getByText('Practice Set Completion Trends')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have dark mode support', () => {
      const { container } = render(<CompletionTrends data={mockTrendData} />)
      const darkModeElements = container.querySelectorAll('[class*="dark:"]')
      expect(darkModeElements.length).toBeGreaterThan(0)
    })

    it('should have proper background styling', () => {
      const { container } = render(<CompletionTrends data={mockTrendData} />)
      const background = container.querySelector('[class*="bg-white"]')
      expect(background).toBeInTheDocument()
    })

    it('should have shadow styling', () => {
      const { container } = render(<CompletionTrends data={mockTrendData} />)
      const shadow = container.querySelector('[class*="shadow"]')
      expect(shadow).toBeInTheDocument()
    })
  })

  describe('Chart Dimensions', () => {
    it('should have responsive width', () => {
      const { container } = render(<CompletionTrends data={mockTrendData} />)
      const chartContainer = container.querySelector('[class*="w-full"]')
      expect(chartContainer).toBeInTheDocument()
    })

    it('should have fixed height', () => {
      const { container } = render(<CompletionTrends data={mockTrendData} />)
      const chartContainer = container.querySelector('[class*="h-96"]')
      expect(chartContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<CompletionTrends data={mockTrendData} />)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Practice Set Completion Trends')
    })

    it('should have semantic structure', () => {
      const { container } = render(<CompletionTrends data={mockTrendData} />)
      const divs = container.querySelectorAll('div')
      expect(divs.length).toBeGreaterThan(0)
    })
  })

  describe('Data Transformation', () => {
    it('should transform ISO dates to readable format', () => {
      const isoData = [
        {
          date: '2024-01-15T00:00:00Z',
          total_completions: 45,
          paper_breakdown: {
            JAIIB_IE_IFS: 12,
            JAIIB_PPB: 11,
            JAIIB_AFB: 11,
            JAIIB_RBWM: 11,
          },
        },
      ]

      render(<CompletionTrends data={isoData} />)
      const chart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
      
      expect(chartData[0].date).toMatch(/Jan/)
    })

    it('should preserve all data fields in transformation', () => {
      render(<CompletionTrends data={mockTrendData} />)
      const chart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
      
      expect(chartData[0]).toHaveProperty('date')
      expect(chartData[0]).toHaveProperty('total')
      expect(chartData[0]).toHaveProperty('JAIIB_IE_IFS')
      expect(chartData[0]).toHaveProperty('JAIIB_PPB')
      expect(chartData[0]).toHaveProperty('JAIIB_AFB')
      expect(chartData[0]).toHaveProperty('JAIIB_RBWM')
    })
  })

  describe('Multiple Data Points', () => {
    it('should handle single data point', () => {
      const singlePoint = [mockTrendData[0]]
      render(<CompletionTrends data={singlePoint} />)
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should handle many data points', () => {
      const manyPoints = Array.from({ length: 30 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        total_completions: 45 + i,
        paper_breakdown: {
          JAIIB_IE_IFS: 12 + i,
          JAIIB_PPB: 11 + i,
          JAIIB_AFB: 11 + i,
          JAIIB_RBWM: 11 + i,
        },
      }))

      render(<CompletionTrends data={manyPoints} />)
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  describe('Paper Breakdown Handling', () => {
    it('should handle missing paper in breakdown', () => {
      const incompleteData = [
        {
          date: '2024-01-01',
          total_completions: 45,
          paper_breakdown: {
            JAIIB_IE_IFS: 12,
            JAIIB_PPB: 11,
            // Missing JAIIB_AFB and JAIIB_RBWM
          },
        },
      ]

      render(<CompletionTrends data={incompleteData} />)
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should handle zero completions for a paper', () => {
      const zeroData = [
        {
          date: '2024-01-01',
          total_completions: 45,
          paper_breakdown: {
            JAIIB_IE_IFS: 0,
            JAIIB_PPB: 11,
            JAIIB_AFB: 11,
            JAIIB_RBWM: 23,
          },
        },
      ]

      render(<CompletionTrends data={zeroData} />)
      const chart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
      expect(chartData[0].JAIIB_IE_IFS).toBe(0)
    })
  })
})
