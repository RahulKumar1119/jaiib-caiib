import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminAnalyticsPage from '../page'
import { apiClient } from '@/lib/api-client'

// Mock the apiClient
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}))

// Mock Recharts components
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

// Mock DateRangeSelector
jest.mock('@/app/(protected)/dashboard/components/DateRangeSelector', () => ({
  DateRangeSelector: ({ onDateRangeChange }: any) => (
    <div data-testid="date-range-selector">
      <button
        onClick={() =>
          onDateRangeChange({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
          })
        }
      >
        Select Date Range
      </button>
    </div>
  ),
}))

describe('AdminAnalyticsPage', () => {
  const mockAnalyticsData = {
    total_logins_30d: 150,
    average_scores_per_paper: {
      JAIIB_IE_IFS: 75.5,
      JAIIB_PPB: 72.3,
      JAIIB_AFB: 73.8,
      JAIIB_RBWM: 71.2,
    },
    completion_trends: [
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
    ],
    most_missed_questions: [
      {
        question_id: 'q_001',
        question_text: 'What is the primary function of RBI?',
        paper: 'JAIIB_IE_IFS',
        average_score: 35.5,
        times_attempted: 120,
      },
      {
        question_id: 'q_002',
        question_text: 'Define monetary policy',
        paper: 'JAIIB_IE_IFS',
        average_score: 42.3,
        times_attempted: 105,
      },
      {
        question_id: 'q_003',
        question_text: 'What is inflation?',
        paper: 'JAIIB_PPB',
        average_score: 48.7,
        times_attempted: 98,
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiClient.get as jest.Mock).mockResolvedValue(mockAnalyticsData)
  })

  describe('Page Rendering', () => {
    it('should render analytics title and description', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument()
        expect(
          screen.getByText(/View platform-wide engagement and performance metrics/i)
        ).toBeInTheDocument()
      })
    })

    it('should fetch analytics data on mount', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('/admin/analytics'))
      })
    })

    it('should display loading state initially', () => {
      ;(apiClient.get as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockAnalyticsData), 100)
          })
      )

      render(<AdminAnalyticsPage />)

      expect(screen.getByText('Loading analytics...')).toBeInTheDocument()
    })

    it('should display analytics data after loading', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument()
      })
    })
  })

  describe('User Engagement Metrics', () => {
    it('should display user engagement section', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('User Engagement')).toBeInTheDocument()
      })
    })

    it('should display total logins metric', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Total Logins (Last 30 Days)')).toBeInTheDocument()
        expect(screen.getByText('150')).toBeInTheDocument()
      })
    })

    it('should display active users metric', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Active Users')).toBeInTheDocument()
      })
    })

    it('should calculate active users based on login frequency', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        // 150 logins / 5 = 30 estimated active users
        expect(screen.getByText('30')).toBeInTheDocument()
      })
    })
  })

  describe('Average Scores Per Paper', () => {
    it('should display average scores section', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Average Scores Per Paper')).toBeInTheDocument()
      })
    })

    it('should display all four JAIIB papers', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('IE & IFS')).toBeInTheDocument()
        expect(screen.getByText('PPB')).toBeInTheDocument()
        expect(screen.getByText('AFB')).toBeInTheDocument()
        expect(screen.getByText('RBWM')).toBeInTheDocument()
      })
    })

    it('should display average score for each paper', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('76%')).toBeInTheDocument() // 75.5 rounded
        expect(screen.getByText('72%')).toBeInTheDocument() // 72.3 rounded
        expect(screen.getByText('74%')).toBeInTheDocument() // 73.8 rounded
        expect(screen.getByText('71%')).toBeInTheDocument() // 71.2 rounded
      })
    })

    it('should display "Average Score" label for each paper', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const labels = screen.getAllByText('Average Score')
        expect(labels.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Practice Set Completion Trends', () => {
    it('should display completion trends section', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Practice Set Completion Trends')).toBeInTheDocument()
      })
    })

    it('should display trend chart', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const chart = screen.getByTestId('line-chart')
        expect(chart).toBeInTheDocument()
      })
    })

    it('should display responsive chart container', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const container = screen.getByTestId('responsive-container')
        expect(container).toBeInTheDocument()
      })
    })

    it('should render chart with trend data', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const chart = screen.getByTestId('line-chart')
        expect(chart).toBeInTheDocument()
      })
    })
  })

  describe('Most Frequently Missed Questions', () => {
    it('should display missed questions section', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Most Frequently Missed Questions')).toBeInTheDocument()
      })
    })

    it('should display table with question data', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
        expect(screen.getByText('Define monetary policy')).toBeInTheDocument()
      })
    })

    it('should display table headers', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Question')).toBeInTheDocument()
        expect(screen.getByText('Paper')).toBeInTheDocument()
        expect(screen.getByText('Avg Score')).toBeInTheDocument()
        expect(screen.getByText('Attempts')).toBeInTheDocument()
      })
    })

    it('should display average score for each missed question', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('35.5%')).toBeInTheDocument()
        expect(screen.getByText('42.3%')).toBeInTheDocument()
        expect(screen.getByText('48.7%')).toBeInTheDocument()
      })
    })

    it('should display attempt count for each question', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('120')).toBeInTheDocument()
        expect(screen.getByText('105')).toBeInTheDocument()
        expect(screen.getByText('98')).toBeInTheDocument()
      })
    })

    it('should display paper name for each question', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const paperNames = screen.getAllByText(/Indian Economy|Principles and Practices|Accounting|Retail Banking/)
        expect(paperNames.length).toBeGreaterThan(0)
      })
    })

    it('should display pagination controls', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        // Pagination should be present if there are more than 10 questions
        const paginationButtons = screen.queryAllByRole('button')
        expect(paginationButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('CSV Export Functionality', () => {
    it('should display export button', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })
    })

    it('should call export API when export button is clicked', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce(mockAnalyticsData)
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce(new Blob(['csv data']))

      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })

      const exportButton = screen.getByText('Export CSV')
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('/admin/analytics/export'),
          expect.objectContaining({ responseType: 'blob' })
        )
      })
    })

    it('should display loading state during export', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce(mockAnalyticsData)
      ;(apiClient.get as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(new Blob(['csv data'])), 100)
          })
      )

      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })

      const exportButton = screen.getByText('Export CSV')
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText('Exporting...')).toBeInTheDocument()
      })
    })

    it('should disable export button during export', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce(mockAnalyticsData)
      ;(apiClient.get as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(new Blob(['csv data'])), 100)
          })
      )

      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })

      const exportButton = screen.getByText('Export CSV') as HTMLButtonElement
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(exportButton.disabled).toBe(true)
      })
    })
  })

  describe('Date Range Filtering', () => {
    it('should display date range selector', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByTestId('date-range-selector')).toBeInTheDocument()
      })
    })

    it('should display filter by date range section', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Filter by Date Range')).toBeInTheDocument()
      })
    })

    it('should refetch analytics when date range changes', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByTestId('date-range-selector')).toBeInTheDocument()
      })

      const selectButton = screen.getByText('Select Date Range')
      fireEvent.click(selectButton)

      await waitFor(() => {
        // Should be called twice: once on mount, once on date range change
        expect(apiClient.get).toHaveBeenCalledTimes(2)
      })
    })

    it('should include date range in API request', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByTestId('date-range-selector')).toBeInTheDocument()
      })

      const selectButton = screen.getByText('Select Date Range')
      fireEvent.click(selectButton)

      await waitFor(() => {
        const lastCall = (apiClient.get as jest.Mock).mock.calls[
          (apiClient.get as jest.Mock).mock.calls.length - 1
        ]
        expect(lastCall[0]).toContain('startDate')
        expect(lastCall[0]).toContain('endDate')
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      ;(apiClient.get as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to load analytics')
      )

      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load analytics')).toBeInTheDocument()
      })
    })

    it('should display error with proper styling', async () => {
      ;(apiClient.get as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to load analytics')
      )

      const { container } = render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const errorDiv = container.querySelector('.bg-danger-50')
        expect(errorDiv).toBeInTheDocument()
      })
    })

    it('should handle export error gracefully', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce(mockAnalyticsData)
      ;(apiClient.get as jest.Mock).mockRejectedValueOnce(
        new Error('Export failed')
      )

      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })

      const exportButton = screen.getByText('Export CSV')
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText('Export failed')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should display no data message when analytics data is null', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce(null)

      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('No analytics data available')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid layout for paper scores', async () => {
      const { container } = render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const grids = container.querySelectorAll('[class*="grid"]')
        expect(grids.length).toBeGreaterThan(0)
      })
    })

    it('should have responsive breakpoint classes', async () => {
      const { container } = render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const responsiveElements = container.querySelectorAll('[class*="md:"]')
        expect(responsiveElements.length).toBeGreaterThan(0)
      })
    })

    it('should have mobile-first responsive design', async () => {
      const { container } = render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const responsiveElements = container.querySelectorAll('[class*="lg:"]')
        expect(responsiveElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 })
        expect(h1).toHaveTextContent('Analytics')
      })
    })

    it('should have semantic table structure for missed questions', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()

        const thead = table.querySelector('thead')
        expect(thead).toBeInTheDocument()

        const tbody = table.querySelector('tbody')
        expect(tbody).toBeInTheDocument()
      })
    })

    it('should have proper contrast for text', async () => {
      const { container } = render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const darkModeElements = container.querySelectorAll('[class*="dark:"]')
        expect(darkModeElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Data Formatting', () => {
    it('should format scores as percentages', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('76%')).toBeInTheDocument()
        expect(screen.getByText('35.5%')).toBeInTheDocument()
      })
    })

    it('should format dates correctly in trends', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const chart = screen.getByTestId('line-chart')
        expect(chart).toBeInTheDocument()
      })
    })
  })

  describe('Metrics Display', () => {
    it('should display all required metric sections', async () => {
      render(<AdminAnalyticsPage />)

      await waitFor(() => {
        expect(screen.getByText('User Engagement')).toBeInTheDocument()
        expect(screen.getByText('Average Scores Per Paper')).toBeInTheDocument()
        expect(screen.getByText('Practice Set Completion Trends')).toBeInTheDocument()
        expect(screen.getByText('Most Frequently Missed Questions')).toBeInTheDocument()
      })
    })

    it('should display metrics in correct order', async () => {
      const { container } = render(<AdminAnalyticsPage />)

      await waitFor(() => {
        const sections = container.querySelectorAll('h2')
        const sectionTexts = Array.from(sections).map((s) => s.textContent)

        const engagementIndex = sectionTexts.findIndex((t) => t?.includes('User Engagement'))
        const scoresIndex = sectionTexts.findIndex((t) => t?.includes('Average Scores'))
        const trendsIndex = sectionTexts.findIndex((t) => t?.includes('Completion Trends'))
        const missedIndex = sectionTexts.findIndex((t) => t?.includes('Missed Questions'))

        expect(engagementIndex).toBeLessThan(scoresIndex)
        expect(scoresIndex).toBeLessThan(trendsIndex)
        expect(trendsIndex).toBeLessThan(missedIndex)
      })
    })
  })
})
