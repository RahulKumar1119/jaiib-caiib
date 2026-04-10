export function formatScore(score: number): string {
  return `${Math.round(score)}%`
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

export function formatPaperName(paper: string): string {
  const paperMap: Record<string, string> = {
    JAIIB_IE_IFS: 'Indian Economy & Indian Financial System',
    JAIIB_PPB: 'Principles and Practices of Banking',
    JAIIB_AFB: 'Accounting & Finance for Bankers',
    JAIIB_RBWM: 'Retail Banking & Wealth Management',
  }
  return paperMap[paper] || paper
}

export function formatDifficultyLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

export function getScoreFeedback(score: number): string {
  if (score >= 80) {
    return 'Great job! You scored well.'
  }
  if (score >= 60) {
    return 'Good effort! Keep practicing to improve.'
  }
  if (score >= 40) {
    return 'Keep practicing! Review the explanations to improve.'
  }
  return 'Keep practicing! Review the explanations to improve.'
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success-600'
  if (score >= 60) return 'text-warning-600'
  return 'text-danger-600'
}
