/**
 * Timer Component
 * Displays countdown timer for practice sessions
 * Changes color based on time remaining
 */

import React, { useEffect, useState } from 'react'
import '../styles/Timer.css'

interface TimerProps {
  initialSeconds: number
  onTimeUp: () => void
  isActive?: boolean
}

export const Timer: React.FC<TimerProps> = ({
  initialSeconds,
  onTimeUp,
  isActive = true,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds)
  const [isWarning, setIsWarning] = useState(false)
  const [isCritical, setIsCritical] = useState(false)

  useEffect(() => {
    if (!isActive || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1

        if (newTime <= 0) {
          clearInterval(interval)
          onTimeUp()
          return 0
        }

        // Update warning states
        const oneMinute = 60
        const fiveMinutes = 300

        setIsCritical(newTime <= oneMinute)
        setIsWarning(newTime <= fiveMinutes && newTime > oneMinute)

        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, onTimeUp])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerClass = (): string => {
    if (isCritical) return 'timer-critical'
    if (isWarning) return 'timer-warning'
    return 'timer-normal'
  }

  return (
    <div className={`timer ${getTimerClass()}`}>
      <div className="timer-icon">⏱️</div>
      <div className="timer-display">
        <span className="timer-label">Time Remaining</span>
        <span className="timer-value">{formatTime(timeRemaining)}</span>
      </div>
      {isCritical && <div className="timer-alert">Time's running out!</div>}
    </div>
  )
}

export default Timer
