import { renderHook, act, waitFor } from '@testing-library/react'
import { useDashboard } from '../useDashboard'
import { DashboardProvider } from '../../dashboard-context'
import * as apiClient from '../../api-client'
import { DashboardMetrics } from '../../types/score'

jest.mock('../../api-client', () => ({
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

describe('useDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should fetch metrics', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      metrics: mockMetrics,
    })

    const wrapper = ({ children }: any) => <DashboardProvider>{children}</DashboardProvider>
    const { result } = renderHook(() => useDashboard(), { wrapper })

    expect(result.current.metrics).toBeNull()

    await act(async () => {
      await result.current.fetchMetrics()
    })

    await waitFor(() => {
      expect(result.current.metrics).toEqual(mockMetrics)
    })
  })

  it('should select paper', async () => {
    const wrapper = ({ children }: any) => <DashboardProvider>{children}</DashboardProvider>
    const { result } = renderHook(() => useDashboard(), { wrapper })

    expect(result.current.selectedPaper).toBeNull()

    act(() => {
      result.current.selectPaper('JAIIB_IE_IFS')
    })

    expect(result.current.selectedPaper).toBe('JAIIB_IE_IFS')
  })

  it('should clear selected paper', async () => {
    const wrapper = ({ children }: any) => <DashboardProvider>{children}</DashboardProvider>
    const { result } = renderHook(() => useDashboard(), { wrapper })

    act(() => {
      result.current.selectPaper('JAIIB_IE_IFS')
    })

    expect(result.current.selectedPaper).toBe('JAIIB_IE_IFS')

    act(() => {
      result.current.selectPaper(null)
    })

    expect(result.current.selectedPaper).toBeNull()
  })

  it('should handle errors', async () => {
    mockApiClient.get.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = ({ children }: any) => <DashboardProvider>{children}</DashboardProvider>
    const { result } = renderHook(() => useDashboard(), { wrapper })

    await act(async () => {
      try {
        await result.current.fetchMetrics()
      } catch (err) {
        // Expected error
      }
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })
  })

  it('should clear error', async () => {
    mockApiClient.get.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = ({ children }: any) => <DashboardProvider>{children}</DashboardProvider>
    const { result } = renderHook(() => useDashboard(), { wrapper })

    await act(async () => {
      try {
        await result.current.fetchMetrics()
      } catch (err) {
        // Expected error
      }
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('should cache metrics', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      metrics: mockMetrics,
    })

    const wrapper = ({ children }: any) => <DashboardProvider>{children}</DashboardProvider>
    const { result } = renderHook(() => useDashboard(), { wrapper })

    await act(async () => {
      await result.current.fetchMetrics()
    })

    await waitFor(() => {
      const cached = localStorage.getItem('dashboard_metrics')
      expect(cached).toBeTruthy()
    })
  })
})
