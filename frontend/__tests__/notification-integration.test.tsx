import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NotificationProvider } from '@/lib/notification-context'
import { ToastContainer } from '@/components/ToastContainer'
import { useNotification } from '@/lib/hooks/useNotification'

// Mock component that simulates score notifications
const ScoreNotificationComponent = ({ score }: { score: number }) => {
  const { success, warning } = useNotification()

  React.useEffect(() => {
    if (score > 80) {
      success(`Great job! You scored ${score}%`)
    } else if (score < 50) {
      warning(`Keep practicing! You scored ${score}%. Review the explanations to improve.`)
    }
  }, [score, success, warning])

  return <div data-testid="score-component">Score: {score}</div>
}

// Mock component that simulates inactivity reminder
const InactivityReminderComponent = ({ daysSinceLastPractice }: { daysSinceLastPractice: number }) => {
  const { warning } = useNotification()

  React.useEffect(() => {
    if (daysSinceLastPractice > 7) {
      warning("It's time to practice! Start a new practice session today.")
    }
  }, [daysSinceLastPractice, warning])

  return <div data-testid="inactivity-component">Days: {daysSinceLastPractice}</div>
}

// Mock component that simulates new questions notification
const NewQuestionsComponent = ({ newQuestionsAdded }: { newQuestionsAdded: boolean }) => {
  const { success } = useNotification()

  React.useEffect(() => {
    if (newQuestionsAdded) {
      success('New practice questions available!')
    }
  }, [newQuestionsAdded, success])

  return <div data-testid="new-questions-component">New Questions: {newQuestionsAdded ? 'Yes' : 'No'}</div>
}

const renderWithNotifications = (component: React.ReactElement) => {
  return render(
    <NotificationProvider>
      <ToastContainer position="top-right" maxToasts={3} />
      {component}
    </NotificationProvider>
  )
}

describe('Notification Integration Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('High Score Notification', () => {
    it('should display notification when score > 80', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={85} />
      )

      await waitFor(() => {
        expect(screen.getByText('Great job! You scored 85%')).toBeInTheDocument()
      })
    })

    it('should display notification for score exactly 81', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={81} />
      )

      await waitFor(() => {
        expect(screen.getByText('Great job! You scored 81%')).toBeInTheDocument()
      })
    })

    it('should not display notification for score = 80', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={80} />
      )

      expect(screen.queryByText(/Great job/)).not.toBeInTheDocument()
    })

    it('should display notification for perfect score', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={100} />
      )

      await waitFor(() => {
        expect(screen.getByText('Great job! You scored 100%')).toBeInTheDocument()
      })
    })

    it('should auto-dismiss high score notification', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={85} />
      )

      await waitFor(() => {
        expect(screen.getByText('Great job! You scored 85%')).toBeInTheDocument()
      })

      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(screen.queryByText('Great job! You scored 85%')).not.toBeInTheDocument()
      })
    })
  })

  describe('Low Score Notification', () => {
    it('should display notification when score < 50', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={45} />
      )

      await waitFor(() => {
        expect(screen.getByText(/Keep practicing! You scored 45%/)).toBeInTheDocument()
      })
    })

    it('should display notification for score exactly 49', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={49} />
      )

      await waitFor(() => {
        expect(screen.getByText(/Keep practicing! You scored 49%/)).toBeInTheDocument()
      })
    })

    it('should not display notification for score = 50', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={50} />
      )

      expect(screen.queryByText(/Keep practicing/)).not.toBeInTheDocument()
    })

    it('should display notification for zero score', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={0} />
      )

      await waitFor(() => {
        expect(screen.getByText(/Keep practicing! You scored 0%/)).toBeInTheDocument()
      })
    })

    it('should auto-dismiss low score notification', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={45} />
      )

      await waitFor(() => {
        expect(screen.getByText(/Keep practicing! You scored 45%/)).toBeInTheDocument()
      })

      jest.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.queryByText(/Keep practicing! You scored 45%/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Inactivity Reminder', () => {
    it('should display notification when inactive for > 7 days', async () => {
      renderWithNotifications(
        <InactivityReminderComponent daysSinceLastPractice={8} />
      )

      await waitFor(() => {
        expect(screen.getByText("It's time to practice! Start a new practice session today.")).toBeInTheDocument()
      })
    })

    it('should display notification for exactly 8 days', async () => {
      renderWithNotifications(
        <InactivityReminderComponent daysSinceLastPractice={8} />
      )

      await waitFor(() => {
        expect(screen.getByText("It's time to practice! Start a new practice session today.")).toBeInTheDocument()
      })
    })

    it('should not display notification for 7 days', async () => {
      renderWithNotifications(
        <InactivityReminderComponent daysSinceLastPractice={7} />
      )

      expect(screen.queryByText(/It's time to practice/)).not.toBeInTheDocument()
    })

    it('should display notification for 30 days inactive', async () => {
      renderWithNotifications(
        <InactivityReminderComponent daysSinceLastPractice={30} />
      )

      await waitFor(() => {
        expect(screen.getByText("It's time to practice! Start a new practice session today.")).toBeInTheDocument()
      })
    })

    it('should auto-dismiss inactivity reminder', async () => {
      renderWithNotifications(
        <InactivityReminderComponent daysSinceLastPractice={8} />
      )

      await waitFor(() => {
        expect(screen.getByText("It's time to practice! Start a new practice session today.")).toBeInTheDocument()
      })

      jest.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.queryByText(/It's time to practice/)).not.toBeInTheDocument()
      })
    })
  })

  describe('New Questions Notification', () => {
    it('should display notification when new questions are added', async () => {
      renderWithNotifications(
        <NewQuestionsComponent newQuestionsAdded={true} />
      )

      await waitFor(() => {
        expect(screen.getByText('New practice questions available!')).toBeInTheDocument()
      })
    })

    it('should not display notification when no new questions', async () => {
      renderWithNotifications(
        <NewQuestionsComponent newQuestionsAdded={false} />
      )

      expect(screen.queryByText('New practice questions available!')).not.toBeInTheDocument()
    })

    it('should auto-dismiss new questions notification', async () => {
      renderWithNotifications(
        <NewQuestionsComponent newQuestionsAdded={true} />
      )

      await waitFor(() => {
        expect(screen.getByText('New practice questions available!')).toBeInTheDocument()
      })

      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(screen.queryByText('New practice questions available!')).not.toBeInTheDocument()
      })
    })
  })

  describe('Notification Display Timing', () => {
    it('should display notification within 2 seconds', async () => {
      const startTime = Date.now()

      renderWithNotifications(
        <ScoreNotificationComponent score={85} />
      )

      await waitFor(() => {
        expect(screen.getByText('Great job! You scored 85%')).toBeInTheDocument()
      })

      const endTime = Date.now()
      const displayTime = endTime - startTime

      // Should be displayed almost immediately (within 2 seconds)
      expect(displayTime).toBeLessThan(2000)
    })
  })

  describe('Multiple Notifications', () => {
    it('should display multiple notifications in sequence', async () => {
      const MultipleNotificationsComponent = () => {
        const { success, warning } = useNotification()

        return (
          <div>
            <button onClick={() => success('First notification')}>Add First</button>
            <button onClick={() => warning('Second notification')}>Add Second</button>
          </div>
        )
      }

      renderWithNotifications(
        <MultipleNotificationsComponent />
      )

      fireEvent.click(screen.getByText('Add First'))
      fireEvent.click(screen.getByText('Add Second'))

      await waitFor(() => {
        expect(screen.getByText('First notification')).toBeInTheDocument()
        expect(screen.getByText('Second notification')).toBeInTheDocument()
      })
    })

    it('should limit visible notifications to maxToasts', async () => {
      const ManyNotificationsComponent = () => {
        const { success } = useNotification()

        return (
          <button
            onClick={() => {
              for (let i = 0; i < 5; i++) {
                success(`Notification ${i + 1}`)
              }
            }}
          >
            Add Many
          </button>
        )
      }

      renderWithNotifications(
        <ManyNotificationsComponent />
      )

      fireEvent.click(screen.getByText('Add Many'))

      await waitFor(() => {
        // Should show last 3 notifications (maxToasts = 3)
        expect(screen.getByText('Notification 3')).toBeInTheDocument()
        expect(screen.getByText('Notification 4')).toBeInTheDocument()
        expect(screen.getByText('Notification 5')).toBeInTheDocument()
      })
    })
  })

  describe('Notification Dismissal', () => {
    it('should allow manual dismissal of notification', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={85} />
      )

      await waitFor(() => {
        expect(screen.getByText('Great job! You scored 85%')).toBeInTheDocument()
      })

      const closeButton = screen.getByLabelText('Close notification')
      fireEvent.click(closeButton)

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.queryByText('Great job! You scored 85%')).not.toBeInTheDocument()
      })
    })

    it('should not show same notification after dismissal', async () => {
      const { rerender } = renderWithNotifications(
        <ScoreNotificationComponent score={85} />
      )

      await waitFor(() => {
        expect(screen.getByText('Great job! You scored 85%')).toBeInTheDocument()
      })

      const closeButton = screen.getByLabelText('Close notification')
      fireEvent.click(closeButton)

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.queryByText('Great job! You scored 85%')).not.toBeInTheDocument()
      })

      // Re-render with same score should not show notification again
      rerender(
        <NotificationProvider>
          <ToastContainer position="top-right" maxToasts={3} />
          <ScoreNotificationComponent score={85} />
        </NotificationProvider>
      )

      expect(screen.queryByText('Great job! You scored 85%')).not.toBeInTheDocument()
    })
  })

  describe('Notification Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={85} />
      )

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('aria-live', 'polite')
        expect(alert).toHaveAttribute('aria-atomic', 'true')
      })
    })

    it('should be keyboard accessible', async () => {
      renderWithNotifications(
        <ScoreNotificationComponent score={85} />
      )

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('tabIndex', '0')
      })
    })
  })

  describe('Dark Mode Support', () => {
    it('should render notifications with dark mode classes', async () => {
      const { container } = renderWithNotifications(
        <ScoreNotificationComponent score={85} />
      )

      await waitFor(() => {
        const toast = container.querySelector('[role="alert"]')
        expect(toast).toHaveClass('dark:bg-green-900')
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render notifications responsively', async () => {
      const { container } = renderWithNotifications(
        <ScoreNotificationComponent score={85} />
      )

      await waitFor(() => {
        const region = screen.getByRole('region', { name: 'Notifications' })
        expect(region).toHaveClass('max-w-sm')
      })
    })
  })
})
