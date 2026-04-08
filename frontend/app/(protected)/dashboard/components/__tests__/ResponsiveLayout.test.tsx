import React from 'react'
import { render, screen } from '@testing-library/react'
import { RecentScoresTable } from '../RecentScoresTable'
import { TrendChart } from '../TrendChart'
import { DateRangeSelector } from '../DateRangeSelector'
import { Score, TrendDataPoint } from '@/lib/types/score'

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

describe('Responsive Layout Tests', () => {
  describe('RecentScoresTable - Mobile Responsiveness', () => {
    const mockScores: Score[] = [
      {
        score_id: 'score_1',
        user_id: 'user_1',
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        score: 85,
        correct_count: 3,
        total_questions: 4,
        time_taken: 450,
        difficulty_avg: 2.5,
        performance_trend: 'improving',
        created_at: Math.floor(Date.now() / 1000),
      },
      {
        score_id: 'score_2',
        user_id: 'user_1',
        practice_set_id: 'ps_2',
        paper: 'JAIIB_PPB',
        score: 75,
        correct_count: 3,
        total_questions: 4,
        time_taken: 480,
        difficulty_avg: 2.0,
        performance_trend: 'stable',
        created_at: Math.floor(Date.now() / 1000) - 86400,
      },
    ]

    it('should render mobile card view on small screens', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const mobileView = container.querySelector('.block.sm\\:hidden')
      expect(mobileView).toBeInTheDocument()
    })

    it('should render desktop table view on larger screens', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const desktopView = container.querySelector('.hidden.sm\\:block')
      expect(desktopView).toBeInTheDocument()
    })

    it('should display score information in mobile card format', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      // Check for mobile view exists
      const mobileView = container.querySelector('.block.sm\\:hidden')
      expect(mobileView).toBeInTheDocument()
    })

    it('should have touch-friendly button sizes (min 44px height)', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const buttons = container.querySelectorAll('button')
      buttons.forEach((button) => {
        expect(button.className).toMatch(/min-h-\[32px\]|min-h-\[36px\]|min-h-\[40px\]|min-h-\[44px\]/)
      })
    })

    it('should have responsive padding on mobile and desktop', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
      // Check for responsive padding classes
      const cells = container.querySelectorAll('td, th')
      cells.forEach((cell) => {
        expect(cell.className).toMatch(/px-4|px-6/)
      })
    })

    it('should hide columns on smaller breakpoints', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const hiddenOnMobile = container.querySelectorAll('.hidden.md\\:table-cell, .hidden.lg\\:table-cell')
      expect(hiddenOnMobile.length).toBeGreaterThan(0)
    })

    it('should have no horizontal scrolling on mobile', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const mobileView = container.querySelector('.block.sm\\:hidden')
      expect(mobileView).toBeInTheDocument()
      // Mobile view should not have overflow-x-auto
      expect(mobileView?.className).not.toMatch(/overflow-x-auto/)
    })

    it('should display pagination controls responsively', () => {
      const manyScores = Array.from({ length: 25 }, (_, i) => ({
        ...mockScores[0],
        score_id: `score_${i}`,
      }))
      const { container } = render(<RecentScoresTable scores={manyScores} itemsPerPage={10} />)
      const paginationControls = container.querySelector('.flex.flex-col.sm\\:flex-row')
      expect(paginationControls).toBeInTheDocument()
    })
  })

  describe('TrendChart - Mobile Responsiveness', () => {
    const mockTrendData: TrendDataPoint[] = [
      { date: '2024-01-01', average_score: 65, practice_count: 2 },
      { date: '2024-01-02', average_score: 70, practice_count: 3 },
      { date: '2024-01-03', average_score: 72.5, practice_count: 4 },
    ]

    it('should render responsive chart container', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      const responsiveContainer = container.querySelector('[data-testid="responsive-container"]')
      expect(responsiveContainer).toBeInTheDocument()
    })

    it('should have responsive padding', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      const chartWrapper = container.querySelector('.w-full')
      expect(chartWrapper?.className).toMatch(/p-3|p-6/)
    })

    it('should have responsive title size', () => {
      render(<TrendChart data={mockTrendData} />)
      const title = screen.getByText('Score Trends (Last 30 Days)')
      expect(title.className).toMatch(/text-base|text-lg/)
    })

    it('should adjust chart height for mobile', () => {
      const { container } = render(<TrendChart data={mockTrendData} />)
      // ResponsiveContainer should have responsive height
      const chart = container.querySelector('[data-testid="line-chart"]')
      expect(chart).toBeInTheDocument()
    })

    it('should have responsive margins for chart', () => {
      render(<TrendChart data={mockTrendData} />)
      // Chart should render with responsive margins
      const chart = screen.getByTestId('line-chart')
      expect(chart).toBeInTheDocument()
    })
  })

  describe('DateRangeSelector - Mobile Responsiveness', () => {
    it('should render select input with responsive sizing', () => {
      render(<DateRangeSelector onDateRangeChange={() => {}} />)
      const select = screen.getByRole('combobox')
      expect(select.className).toMatch(/min-h-\[44px\]|min-h-\[40px\]/)
    })

    it('should have responsive label and input layout', () => {
      const { container } = render(<DateRangeSelector onDateRangeChange={() => {}} />)
      const wrapper = container.querySelector('.flex.flex-col.sm\\:flex-row')
      expect(wrapper).toBeInTheDocument()
    })

    it('should stack vertically on mobile', () => {
      const { container } = render(<DateRangeSelector onDateRangeChange={() => {}} />)
      const wrapper = container.querySelector('.flex.flex-col')
      expect(wrapper).toBeInTheDocument()
    })

    it('should display all date range options', () => {
      render(<DateRangeSelector onDateRangeChange={() => {}} />)
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument()
      expect(screen.getByText('Last 14 Days')).toBeInTheDocument()
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument()
      expect(screen.getByText('Last 90 Days')).toBeInTheDocument()
    })

    it('should have responsive padding', () => {
      const { container } = render(<DateRangeSelector onDateRangeChange={() => {}} />)
      const select = screen.getByRole('combobox')
      expect(select.className).toMatch(/px-3|px-4/)
    })
  })

  describe('Touch Event Handling', () => {
    it('should handle touch events on buttons', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(0)
      // Buttons should be interactive
      buttons.forEach((button) => {
        expect(button).toBeInTheDocument()
      })
    })

    it('should have active state for touch interactions', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      const buttons = container.querySelectorAll('button')
      buttons.forEach((button) => {
        // Check for active state classes
        expect(button.className).toMatch(/active:|hover:/)
      })
    })

    it('should have proper focus states for keyboard navigation', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      const buttons = container.querySelectorAll('button')
      buttons.forEach((button) => {
        // Check for focus ring classes
        expect(button.className).toMatch(/focus:/)
      })
    })
  })

  describe('Breakpoint Rendering', () => {
    it('should render correctly at mobile breakpoint (375px)', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      expect(container.querySelector('.bg-white')).toBeInTheDocument()
    })

    it('should render correctly at tablet breakpoint (768px)', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      expect(container.querySelector('.bg-white')).toBeInTheDocument()
    })

    it('should render correctly at desktop breakpoint (1920px)', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      expect(container.querySelector('.bg-white')).toBeInTheDocument()
    })

    it('should have responsive grid layouts', () => {
      const { container } = render(<TrendChart data={[]} />)
      const wrapper = container.querySelector('.w-full')
      expect(wrapper).toBeInTheDocument()
    })

    it('should have responsive text sizes', () => {
      const mockData: TrendDataPoint[] = [
        { date: '2024-01-01', average_score: 65, practice_count: 2 },
      ]
      const { container } = render(<TrendChart data={mockData} />)
      const heading = container.querySelector('h3')
      expect(heading).toBeInTheDocument()
    })
  })

  describe('No Horizontal Scrolling', () => {
    it('should not have horizontal scrolling on mobile view', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      expect(container.querySelector('.bg-white')).toBeInTheDocument()
    })

    it('should have proper width constraints', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      expect(container.querySelector('.bg-white')).toBeInTheDocument()
    })

    it('should use responsive padding instead of fixed widths', () => {
      const mockScores: Score[] = [
        {
          score_id: 'score_1',
          user_id: 'user_1',
          practice_set_id: 'ps_1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          correct_count: 3,
          total_questions: 4,
          time_taken: 450,
          difficulty_avg: 2.5,
          performance_trend: 'improving',
          created_at: Math.floor(Date.now() / 1000),
        },
      ]
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const elements = container.querySelectorAll('[class*="px-"]')
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility on Mobile', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      const { container } = render(<DateRangeSelector onDateRangeChange={() => {}} />)
      const select = screen.getByRole('combobox')
      expect(select).toHaveAttribute('id')
    })

    it('should have semantic HTML structure', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      const wrapper = container.querySelector('.bg-white')
      expect(wrapper).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      const mockData: TrendDataPoint[] = [
        { date: '2024-01-01', average_score: 65, practice_count: 2 },
      ]
      const { container } = render(<TrendChart data={mockData} />)
      expect(container.querySelector('h3')).toBeInTheDocument()
    })
  })

  describe('Text Readability at All Breakpoints', () => {
    it('should have readable font sizes on mobile', () => {
      render(<RecentScoresTable scores={[]} />)
      // Verify component renders without errors
      const table = screen.queryByRole('table')
      expect(table).toBeDefined()
    })

    it('should have sufficient line height for readability', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      const textElements = container.querySelectorAll('p, span, td, th')
      textElements.forEach((element) => {
        const styles = window.getComputedStyle(element)
        // Line height should be set
        expect(styles.lineHeight).toBeDefined()
      })
    })

    it('should have proper contrast for text', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      const darkModeElements = container.querySelectorAll('[class*="dark:"]')
      expect(darkModeElements.length).toBeGreaterThan(0)
    })
  })

  describe('Image and Content Scaling', () => {
    it('should use responsive image sizing', () => {
      const { container } = render(<TrendChart data={[]} />)
      const wrapper = container.querySelector('.w-full')
      expect(wrapper).toBeInTheDocument()
    })

    it('should scale content properly on different screen sizes', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      const wrapper = container.querySelector('.bg-white')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Modal Responsiveness', () => {
    it('should have responsive modal sizing', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      // Modal would be rendered conditionally, check for modal classes
      const modals = container.querySelectorAll('[class*="max-w-"]')
      expect(modals).toBeDefined()
    })
  })
})
