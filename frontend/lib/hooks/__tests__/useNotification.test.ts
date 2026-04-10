import { renderHook, act } from '@testing-library/react'
import { useNotification } from '../useNotification'
import { NotificationProvider } from '../../notification-context'

describe('useNotification', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should add notification', () => {
    const wrapper = ({ children }: any) => <NotificationProvider>{children}</NotificationProvider>
    const { result } = renderHook(() => useNotification(), { wrapper })

    expect(result.current.notifications).toHaveLength(0)

    act(() => {
      result.current.addNotification('Test message', 'info')
    })

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].message).toBe('Test message')
    expect(result.current.notifications[0].type).toBe('info')
  })

  it('should remove notification', () => {
    const wrapper = ({ children }: any) => <NotificationProvider>{children}</NotificationProvider>
    const { result } = renderHook(() => useNotification(), { wrapper })

    let notificationId: string

    act(() => {
      notificationId = result.current.addNotification('Test message', 'info')
    })

    expect(result.current.notifications).toHaveLength(1)

    act(() => {
      result.current.removeNotification(notificationId!)
    })

    expect(result.current.notifications).toHaveLength(0)
  })

  it('should clear all notifications', () => {
    const wrapper = ({ children }: any) => <NotificationProvider>{children}</NotificationProvider>
    const { result } = renderHook(() => useNotification(), { wrapper })

    act(() => {
      result.current.addNotification('Message 1', 'info')
      result.current.addNotification('Message 2', 'error')
      result.current.addNotification('Message 3', 'success')
    })

    expect(result.current.notifications).toHaveLength(3)

    act(() => {
      result.current.clearNotifications()
    })

    expect(result.current.notifications).toHaveLength(0)
  })

  it('should auto-remove notification after duration', () => {
    const wrapper = ({ children }: any) => <NotificationProvider>{children}</NotificationProvider>
    const { result } = renderHook(() => useNotification(), { wrapper })

    act(() => {
      result.current.addNotification('Auto-remove', 'info', 1000)
    })

    expect(result.current.notifications).toHaveLength(1)

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.notifications).toHaveLength(0)
  })

  it('should support different notification types', () => {
    const wrapper = ({ children }: any) => <NotificationProvider>{children}</NotificationProvider>
    const { result } = renderHook(() => useNotification(), { wrapper })

    act(() => {
      result.current.addNotification('Success', 'success')
      result.current.addNotification('Error', 'error')
      result.current.addNotification('Info', 'info')
      result.current.addNotification('Warning', 'warning')
    })

    expect(result.current.notifications).toHaveLength(4)
    expect(result.current.notifications[0].type).toBe('success')
    expect(result.current.notifications[1].type).toBe('error')
    expect(result.current.notifications[2].type).toBe('info')
    expect(result.current.notifications[3].type).toBe('warning')
  })

  it('should return notification id', () => {
    const wrapper = ({ children }: any) => <NotificationProvider>{children}</NotificationProvider>
    const { result } = renderHook(() => useNotification(), { wrapper })

    let notificationId: string

    act(() => {
      notificationId = result.current.addNotification('Test', 'info')
    })

    expect(notificationId!).toBeTruthy()
    expect(notificationId!).toMatch(/^notification-/)
  })

  it('should handle notification without auto-remove', () => {
    const wrapper = ({ children }: any) => <NotificationProvider>{children}</NotificationProvider>
    const { result } = renderHook(() => useNotification(), { wrapper })

    act(() => {
      result.current.addNotification('Persistent', 'info', 0)
    })

    expect(result.current.notifications).toHaveLength(1)

    act(() => {
      jest.advanceTimersByTime(10000)
    })

    expect(result.current.notifications).toHaveLength(1)
  })
})
