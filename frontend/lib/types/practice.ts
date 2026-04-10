export type JaiibPaper = 'JAIIB_IE_IFS' | 'JAIIB_PPB' | 'JAIIB_AFB' | 'JAIIB_RBWM'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type PracticeSetStatus = 'in_progress' | 'submitted' | 'expired'

export interface MCQOption {
  A: string
  B: string
  C: string
  D: string
}

export interface Question {
  question_id: string
  question_text: string
  options: MCQOption
  order: string[] // Shuffled order of options
  difficulty_level: DifficultyLevel
  paper: JaiibPaper
  syllabus_topic: string
  rbi_norms?: string[]
  iibf_norms?: string[]
}

export interface PracticeSet {
  practice_set_id: string
  paper: JaiibPaper
  questions: Question[]
  time_limit: number // in seconds
  created_at: number
  started_at?: number
  submitted_at?: number
  status: PracticeSetStatus
  user_answers?: Record<string, string | null>
  correct_answers?: Record<string, string>
  score?: number
  session_token: string
  session_expires_at: number
}

export interface SubmitPracticeSetRequest {
  answers: Record<string, string | null>
  time_taken: number
}

export interface AnswerDetail {
  question_id: string
  user_answer: string | null
  correct_answer: string
  is_correct: boolean
}

export interface PracticeSetResult {
  score_id: string
  score: number
  correct_count: number
  total_questions: number
  answers_detail: AnswerDetail[]
  time_taken: number
  created_at: number
}

export interface PracticeContextType {
  currentPracticeSet: PracticeSet | null
  result: PracticeSetResult | null
  isLoading: boolean
  error: string | null
  generatePracticeSet: (paper: JaiibPaper) => Promise<void>
  submitPracticeSet: (answers: Record<string, string | null>, timeTaken: number) => Promise<void>
  resumePracticeSet: (sessionToken: string) => Promise<void>
  clearError: () => void
}
