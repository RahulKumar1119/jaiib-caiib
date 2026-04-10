export const JAIIB_PAPERS = [
  {
    id: 'JAIIB_IE_IFS',
    name: 'Indian Economy & Indian Financial System',
    shortName: 'IE & IFS',
    description: 'Paper I - Economic fundamentals and financial systems',
  },
  {
    id: 'JAIIB_PPB',
    name: 'Principles and Practices of Banking',
    shortName: 'PPB',
    description: 'Paper II - Banking principles and practices',
  },
  {
    id: 'JAIIB_AFB',
    name: 'Accounting & Finance for Bankers',
    shortName: 'AFB',
    description: 'Paper III - Accounting and financial management',
  },
  {
    id: 'JAIIB_RBWM',
    name: 'Retail Banking & Wealth Management',
    shortName: 'RBWM',
    description: 'Paper IV - Retail banking and wealth management',
  },
]

export const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
]

export const PRACTICE_SET_DURATION = 600 // 10 minutes in seconds

export const SESSION_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '1800'
) // 30 minutes in seconds

export const TIMER_WARNING_THRESHOLD = 300 // 5 minutes in seconds
export const TIMER_CRITICAL_THRESHOLD = 60 // 1 minute in seconds

export const API_TIMEOUT = 10000 // 10 seconds in milliseconds

export const NOTIFICATION_DURATION = 5000 // 5 seconds in milliseconds

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  FAIR: 40,
  POOR: 0,
}

export const USER_ROLES = {
  OFFICER: 'officer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
}

export const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
}

export const PRACTICE_SET_STATUSES = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  EXPIRED: 'expired',
}

export const EVENT_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  PRACTICE_COMPLETE: 'practice_complete',
  EXPLANATION_REQUESTED: 'explanation_requested',
  QUESTION_MODIFIED: 'question_modified',
  ERROR: 'error',
}
