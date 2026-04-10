import { JaiibPaper } from './practice'

export interface Score {
  score_id: string
  user_id: string
  practice_set_id: string
  paper: JaiibPaper
  score: number
  correct_count: number
  total_questions: number
  time_taken: number
  difficulty_avg: number
  performance_trend: 'improving' | 'stable' | 'declining'
  created_at: number
}

export interface PaperStats {
  paper: JaiibPaper
  average_score: number
  highest_score: number
  lowest_score: number
  practice_count: number
  total_time_spent: number
}

export interface DashboardMetrics {
  total_practice_sets: number
  average_score: number
  paper_stats: Record<JaiibPaper, PaperStats>
  recent_scores: Score[]
  trend_data: TrendDataPoint[]
}

export interface TrendDataPoint {
  date: string
  average_score: number
  practice_count: number
}

export interface DashboardContextType {
  metrics: DashboardMetrics | null
  selectedPaper: JaiibPaper | null
  isLoading: boolean
  error: string | null
  fetchMetrics: (paper?: JaiibPaper) => Promise<void>
  selectPaper: (paper: JaiibPaper | null) => void
  clearError: () => void
}
