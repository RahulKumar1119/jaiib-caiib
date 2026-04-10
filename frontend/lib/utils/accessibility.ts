/**
 * Accessibility utilities for WCAG AA compliance
 */

/**
 * Calculate relative luminance of a color (for contrast ratio calculation)
 * Based on WCAG 2.0 formula
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(
  rgb1: [number, number, number],
  rgb2: [number, number, number]
): number {
  const l1 = getRelativeLuminance(rgb1[0], rgb1[1], rgb1[2])
  const l2 = getRelativeLuminance(rgb2[0], rgb2[1], rgb2[2])
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * - Normal text: 4.5:1
 * - Large text (18pt+): 3:1
 */
export function meetsWCAGAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5
}

/**
 * Announce a message to screen readers using aria-live
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  document.body.appendChild(announcement)
  setTimeout(() => announcement.remove(), 1000)
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element (for modals, etc.)
   */
  trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  },

  /**
   * Restore focus to a previously focused element
   */
  restoreFocus(element: HTMLElement): void {
    const previouslyFocused = document.activeElement as HTMLElement
    element.focus()
    // Store reference to restore later if needed
    ;(element as any).__previouslyFocused = previouslyFocused
  },

  /**
   * Return focus to previously focused element
   */
  returnFocus(element: HTMLElement): void {
    const previouslyFocused = (element as any).__previouslyFocused
    if (previouslyFocused && previouslyFocused.focus) {
      previouslyFocused.focus()
    }
  },
}

/**
 * Keyboard navigation utilities
 */
export const keyboardNavigation = {
  /**
   * Handle arrow key navigation for lists/menus
   */
  handleArrowKeys(
    event: React.KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onSelect: (index: number) => void
  ): void {
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        event.preventDefault()
        break
      case 'ArrowDown':
      case 'ArrowRight':
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        event.preventDefault()
        break
      case 'Home':
        newIndex = 0
        event.preventDefault()
        break
      case 'End':
        newIndex = items.length - 1
        event.preventDefault()
        break
      default:
        return
    }

    onSelect(newIndex)
    items[newIndex]?.focus()
  },

  /**
   * Check if a key is an activation key (Enter or Space)
   */
  isActivationKey(event: React.KeyboardEvent): boolean {
    return event.key === 'Enter' || event.key === ' '
  },
}

/**
 * ARIA utilities
 */
export const ariaUtils = {
  /**
   * Generate a unique ID for aria-labelledby/aria-describedby
   */
  generateId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Get accessible name for an element
   */
  getAccessibleName(element: HTMLElement): string {
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel) return ariaLabel

    // Check aria-labelledby
    const ariaLabelledBy = element.getAttribute('aria-labelledby')
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy)
      if (labelElement) return labelElement.textContent || ''
    }

    // Check associated label
    if (element instanceof HTMLInputElement) {
      const label = document.querySelector(`label[for="${element.id}"]`)
      if (label) return label.textContent || ''
    }

    // Fall back to text content
    return element.textContent || ''
  },
}
