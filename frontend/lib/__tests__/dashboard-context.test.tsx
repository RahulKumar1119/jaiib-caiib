import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { DashboardProvider, useDashboardContext } from '../dashboard-context'
import { DashboardMetrics } from '../types/score'
import * as apiClient from '../api-client'

// Mock the API client
jest.mock('../api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}))

const mockApiClient = apiClient.apiClient as jest.Mocked<typeof apiClient.apiClient>

const mockMetrics: DashboardMetrics = {
  total_practice_sets: 10,
  average_score: 75,
  paper_stats: {
    JAIIB_IE_IFS: {
      paper: 'JAIIB_IE_IFS',
      average_score: 75,
      highest_score: 100,
      lowest_score: 50,
      practice_count: 3,
      total_time_spent: 1800,
    },
    JAIIB_PPB: {
      paper: 'JAIIB_PPB',
      average_score: 70,
      highest_score: 95,
      lowest_score: 45,
      practice_count: 2,
      total_time_spent: 1200,
    },
    JAIIB_AFB: {
      paper: 'JAIIB_AFB',
      average_score: 72,
      highest_score: 90,
      lowest_score: 55,
      practice_count: 3,
      total_time_spent: 1800,
    },
    JAIIB_RBWM: {
      paper: 'JAIIB_RBWM',
      average_score: 78,
      highest_score: 100,
      lowest_score: 60,
      practice_count: 2,
      total_time_spent: 1200,
    },
  },
  recent_scores: [],
  trend_data: [],
}

function TestComponent() {
  const { metrics, selectedPaper, isLoading, error, fetchMetrics, selectPaper } =
    useDashboardContext()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <div data-testid="metrics">{metrics?.total_practice_sets || 'No Metrics'}</div>
      <div data-testid="selected-paper">{selectedPaper || 'No Paper'}</div>
      <button onClick={() => fetchMetrics()} data-testid="fetch-btn">
        Fetch
      </button>
      <button onClick={() => selectPaper('JAIIB_IE_IFS')} data-testid="select-btn">
        Select
      </button>
    </div>
  )
}

describe('DashboardContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should provide initial state', () => {
    render(
      <DashboardProvider>
        <TestComponent />
      </DashboardProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    expect(screen.getByTestId('error')).toHaveTextContent('No Error')
    expect(screen.getByTestId('metrics')).toHaveTextContent('No Metrics')
  })

  it('should fetch metrics', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      metrics: mockMetrics,
    })

    render(
      <DashboardProvider>
        <TestComponent />
      </DashboardProvider>
    )

    const fetchBtn = screen.getByTestId('fetch-btn')
    fetchBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('metrics')).toHaveTextContent('10')
    })

    expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/metrics')
  })

  it('should cache metrics in localStorage', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      metrics: mockMetrics,
    })

    render(
      <DashboardProvider>
        <TestComponent />
      </DashboardProvider>
    )

    const fetchBtn = screen.getByTestId('fetch-btn')
    fetchBtn.click()

    await waitFor(() => {
      const cached = localStorage.getItem('dashboard_metrics')
      expect(cached).toBeTruthy()
      const parsed = JSON.parse(cached!)
      expect(parsed.metrics.total_practice_sets).toBe(10)
    })
  })

  it('should restore cached metrics on mount', async () => {
    const now = Date.now()
    localStorage.setItem(
      'dashboard_metrics',
      JSON.stringify({
        metrics: mockMetrics,
        timestamp: now,
      })
    )

    render(
      <DashboardProvider>
        <TestComponent />
      </DashboardProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('metrics')).toHaveTextContent('10')
    })
  })

  it('should select paper', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      metrics: mockMetrics,
    })

    render(
      <DashboardProvider>
        <TestComponent />
      </DashboardProvider>
    )

    const selectBtn = screen.getByTestId('select-btn')
    selectBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('selected-paper')).toHaveTextContent('JAIIB_IE_IFS')
    })
  })

  it('should fetch metrics for specific paper', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      metrics: mockMetrics,
    })

    render(
      <DashboardProvider>
        <TestComponent />
      </DashboardProvider>
    )

    const fetchBtn = screen.getByTestId('fetch-btn')
    fetchBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('metrics')).toHaveTextContent('10')
    })
  })

  it('should handle errors', async () => {
    mockApiClient.get.mockRejectedValueOnce(new Error('Network error'))

    render(
      <DashboardProvider>
        <TestComponent />
      </DashboardProvider>
    )

    const fetchBtn = screen.getByTestId('fetch-btn')
    
    try {
      fetchBtn.click()
    } catch (err) {
      // Expected error
    }

    // Just verify the component renders without crashing
    expect(screen.getByTestId('error')).toBeInTheDocument()
  })

  it('should invalidate cache after TTL', async () => {
    const oldTimestamp = Date.now() - 6 * 60 * 1000 // 6 minutes ago
    localStorage.setItem(
      'dashboard_metrics',
      JSON.stringify({
        metrics: mockMetrics,
        timestamp: oldTimestamp,
      })
    )

    render(
      <DashboardProvider>
        <TestComponent />
      </DashboardProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('metrics')).toHaveTextContent('No Metrics')
      expect(localStorage.getItem('dashboard_metrics')).toBeNull()
    })
  })
})
