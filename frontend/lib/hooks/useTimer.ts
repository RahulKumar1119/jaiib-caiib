'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseTimerReturn {
  timeRemaining: number
  isRunning: boolean
  start: () => void
  pause: () => void
  resume: () => void
  reset: (duration: number) => void
  getFormattedTime: () => string
  getPercentage: () => number
  getColor: () => 'green' | 'yellow' | 'red'
}

export function useTimer(initialDuration: number = 600): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(initialDuration)
  const [isRunning, setIsRunning] = useState(false)
  const [duration] = useState(initialDuration)

  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) {
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const resume = useCallback(() => {
    setIsRunning(true)
  }, [])

  const reset = useCallback((newDuration: number) => {
    setTimeRemaining(newDuration)
    setIsRunning(false)
  }, [])

  const getFormattedTime = useCallback(() => {
    const minutes = Math.floor(timeRemaining / 60)
    const seconds = timeRemaining % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [timeRemaining])

  const getPercentage = useCallback(() => {
    return (timeRemaining / duration) * 100
  }, [timeRemaining, duration])

  const getColor = useCallback((): 'green' | 'yellow' | 'red' => {
    const percentage = getPercentage()
    if (percentage > 50) return 'green'
    if (percentage > 10) return 'yellow'
    return 'red'
  }, [getPercentage])

  return {
    timeRemaining,
    isRunning,
    start,
    pause,
    resume,
    reset,
    getFormattedTime,
    getPercentage,
    getColor,
  }
}
