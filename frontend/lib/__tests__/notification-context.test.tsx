import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { NotificationProvider, useNotificationContext } from '../notification-context'

function TestComponent() {
  const { notifications, addNotification, removeNotification, clearNotifications } =
    useNotificationContext()

  return (
    <div>
      <div data-testid="count">{notifications.length}</div>
      <button
        onClick={() => addNotification('Success!', 'success')}
        data-testid="add-success-btn"
      >
        Add Success
      </button>
      <button
        onClick={() => addNotification('Error!', 'error')}
        data-testid="add-error-btn"
      >
        Add Error
      </button>
      <button
        onClick={() => {
          if (notifications.length > 0) {
            removeNotification(notifications[0].id)
          }
        }}
        data-testid="remove-btn"
      >
        Remove
      </button>
      <button onClick={() => clearNotifications()} data-testid="clear-btn">
        Clear
      </button>
    </div>
  )
}

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should provide initial state', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  it('should add notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const addBtn = screen.getByTestId('add-success-btn')
    addBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1')
    })
  })

  it('should add multiple notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const addSuccessBtn = screen.getByTestId('add-success-btn')
    const addErrorBtn = screen.getByTestId('add-error-btn')

    addSuccessBtn.click()
    addErrorBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
    })
  })

  it('should remove notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const addBtn = screen.getByTestId('add-success-btn')
    addBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1')
    })

    const removeBtn = screen.getByTestId('remove-btn')
    removeBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('0')
    })
  })

  it('should clear all notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const addSuccessBtn = screen.getByTestId('add-success-btn')
    const addErrorBtn = screen.getByTestId('add-error-btn')

    addSuccessBtn.click()
    addErrorBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
    })

    const clearBtn = screen.getByTestId('clear-btn')
    clearBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('0')
    })
  })

  it('should auto-remove notification after duration', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const addBtn = screen.getByTestId('add-success-btn')
    addBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1')
    })

    jest.advanceTimersByTime(5100)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('0')
    })
  })
})
