/**
 * Practice Context
 * Manages practice session state globally
 */

import React, { createContext, useContext, useState, useCallback } from 'react'
import { PracticeSetResponse, ScoreResponse } from '../services/api'

export interface PracticeSession {
  practiceSetId: string | null
  paper: string | null
  currentQuestionIndex: number
  answers: Record<string, string>
  startTime: number | null
  score: ScoreResponse | null
}

export interface PracticeContextType {
  session: PracticeSession
  startSession: (practiceSetId: string, paper: string) => void
  updateAnswer: (questionId: string, answer: string) => void
  completeSession: (score: ScoreResponse) => void
  resetSession: () => void
  setCurrentQuestion: (index: number) => void
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined)

export const PracticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<PracticeSession>({
    practiceSetId: null,
    paper: null,
    currentQuestionIndex: 0,
    answers: {},
    startTime: null,
    score: null,
  })

  const startSession = useCallback((practiceSetId: string, paper: string) => {
    setSession((prev) => ({
      ...prev,
      practiceSetId,
      paper,
      currentQuestionIndex: 0,
      answers: {},
      startTime: Date.now(),
      score: null,
    }))
  }, [])

  const updateAnswer = useCallback((questionId: string, answer: string) => {
    setSession((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer,
      },
    }))
  }, [])

  const completeSession = useCallback((score: ScoreResponse) => {
    setSession((prev) => ({
      ...prev,
      score,
    }))
  }, [])

  const resetSession = useCallback(() => {
    setSession({
      practiceSetId: null,
      paper: null,
      currentQuestionIndex: 0,
      answers: {},
      startTime: null,
      score: null,
    })
  }, [])

  const setCurrentQuestion = useCallback((index: number) => {
    setSession((prev) => ({
      ...prev,
      currentQuestionIndex: index,
    }))
  }, [])

  const value: PracticeContextType = {
    session,
    startSession,
    updateAnswer,
    completeSession,
    resetSession,
    setCurrentQuestion,
  }

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>
}

export const usePractice = (): PracticeContextType => {
  const context = useContext(PracticeContext)

  if (context === undefined) {
    throw new Error('usePractice must be used within a PracticeProvider')
  }

  return context
}

export default PracticeContext
