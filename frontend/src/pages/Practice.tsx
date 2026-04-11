/**
 * Practice Page
 * Main page for practice sessions
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PracticeSet from '../components/PracticeSet'
import ScoreDisplay from '../components/ScoreDisplay'
import { ScoreResponse, PracticeSetResponse } from '../services/api'
import { apiClient } from '../services/api'
import '../styles/Practice.css'

type PageState = 'selection' | 'practice' | 'results'

const PAPERS = [
  { id: 'JAIIB_IE_IFS', name: 'Indian Economy & Indian Financial System' },
  { id: 'JAIIB_PPB', name: 'Principles and Practices of Banking' },
  { id: 'JAIIB_AFB', name: 'Accounting & Financial Management for Bankers' },
  { id: 'JAIIB_RBWM', name: 'Retail Banking and Wealth Management' },
]

export default function Practice() {
  const navigate = useNavigate()
  const [pageState, setPageState] = useState<PageState>('selection')
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null)
  const [practiceSetId, setPracticeSetId] = useState<string | null>(null)
  const [score, setScore] = useState<ScoreResponse | null>(null)
  const [practiceSet, setPracticeSet] = useState<PracticeSetResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePaperSelect = async (paperId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiClient.generatePracticeSet(paperId)
      setPracticeSet(data)
      setPracticeSetId(data.practice_set_id)
      setSelectedPaper(paperId)
      setPageState('practice')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate practice set')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePracticeComplete = (scoreData: ScoreResponse) => {
    setScore(scoreData)
    setPageState('results')
  }

  const handleRetry = async () => {
    if (!selectedPaper) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await apiClient.generatePracticeSet(selectedPaper)
      setPracticeSet(data)
      setPracticeSetId(data.practice_set_id)
      setScore(null)
      setPageState('practice')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate practice set')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setPageState('selection')
    setSelectedPaper(null)
    setPracticeSetId(null)
    setScore(null)
    setPracticeSet(null)
  }

  const handleDashboard = () => {
    navigate('/dashboard')
  }

  if (pageState === 'practice' && practiceSetId) {
    return (
      <PracticeSet
        practiceSetId={practiceSetId}
        onComplete={handlePracticeComplete}
        onCancel={handleCancel}
      />
    )
  }

  if (pageState === 'results' && score && practiceSet) {
    return (
      <ScoreDisplay
        score={score}
        questions={practiceSet.questions}
        onRetry={handleRetry}
        onDashboard={handleDashboard}
      />
    )
  }

  return (
    <div className="practice-page">
      <div className="practice-container">
        <div className="practice-header">
          <h1>Select a Paper</h1>
          <p>Choose a JAIIB paper to start practicing</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="papers-grid">
          {PAPERS.map((paper) => (
            <button
              key={paper.id}
              className="paper-card"
              onClick={() => handlePaperSelect(paper.id)}
              disabled={isLoading}
            >
              <div className="paper-icon">📚</div>
              <h3>{paper.name}</h3>
              <p>4 questions • 10 minutes</p>
              {isLoading && selectedPaper === paper.id && (
                <div className="loading-spinner"></div>
              )}
            </button>
          ))}
        </div>

        <div className="practice-footer">
          <button onClick={handleDashboard} className="btn-outline">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
