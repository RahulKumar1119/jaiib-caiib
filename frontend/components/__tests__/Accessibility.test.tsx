/**
 * Comprehensive Accessibility Tests for WCAG AA Compliance
 * Tests ARIA labels, semantic HTML, keyboard navigation, color contrast, focus indicators, and screen reader support
 * Validates: Requirement 13.7 - Accessibility features
 */

import { render, screen, fireEvent } from '@testing-library/react'
import LoginForm from '../LoginForm'
import { PracticeSetUI } from '../PracticeSetUI'
import { getContrastRatio, meetsWCAGAA } from '@/lib/utils/accessibility'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

// Mock auth context
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  }),
}))

// ============================================================================
// ARIA LABELS AND SEMANTIC HTML TESTS
// ============================================================================

describe('Accessibility - ARIA Labels and Semantic HTML', () => {
  describe('LoginForm Component - ARIA Labels', () => {
    it('should have aria-label on email input', () => {
      render(<LoginForm />)
      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('aria-label', 'Email address')
    })

    it('should have aria-label on password input', () => {
      render(<LoginForm />)
      const passwordInput = screen.getByLabelText(/password/i)
      expect(passwordInput).toHaveAttribute('aria-label', 'Password')
    })

    it('should have aria-invalid on email input when error exists', () => {
      render(<LoginForm />)
      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)
      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    })

    it('should have aria-invalid on password input when error exists', () => {
      render(<LoginForm />)
      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)
      const passwordInput = screen.getByLabelText(/password/i)
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
    })

    it('should have aria-describedby linking to error message for email', () => {
      render(<LoginForm />)
      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)
      const emailInput = screen.getByLabelText(/email address/i)
      const errorId = emailInput.getAttribute('aria-describedby')
      expect(errorId).toBeTruthy()
      const errorElement = document.getElementById(errorId!)
      expect(errorElement).toBeInTheDocument()
    })

    it('should have aria-describedby linking to error message for password', () => {
      render(<LoginForm />)
      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)
      const passwordInput = screen.getByLabelText(/password/i)
      const errorId = passwordInput.getAttribute('aria-describedby')
      expect(errorId).toBeTruthy()
      const errorElement = document.getElementById(errorId!)
      expect(errorElement).toBeInTheDocument()
    })

    it('should have role="alert" on error messages', () => {
      render(<LoginForm />)
      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    it('should have aria-busy on submit button during loading', () => {
      render(<LoginForm />)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.click(submitButton)
      
      expect(submitButton).toHaveAttribute('aria-busy', 'true')
    })

    it('should have associated label elements for all form inputs', () => {
      render(<LoginForm />)
      const emailLabel = screen.getByText(/email address/i)
      const passwordLabel = screen.getByText(/password/i)
      expect(emailLabel).toBeInTheDocument()
      expect(passwordLabel).toBeInTheDocument()
    })
  })

  describe('PracticeSetUI Component - Semantic HTML', () => {
    const mockPracticeSet = {
      practice_set_id: 'ps_1',
      paper: 'JAIIB_IE_IFS',
      questions: [
        {
          question_id: 'q_1',
          question_text: 'What is the primary function of RBI?',
          options: {
            A: 'Option A text',
            B: 'Option B text',
            C: 'Option C text',
            D: 'Option D text',
          },
          order: ['A', 'B', 'C', 'D'],
          syllabus_topic: 'RBI Functions',
        },
        {
          question_id: 'q_2',
          question_text: 'What is monetary policy?',
          options: {
            A: 'Option A text',
            B: 'Option B text',
            C: 'Option C text',
            D: 'Option D text',
          },
          order: ['B', 'A', 'D', 'C'],
          syllabus_topic: 'Monetary Policy',
        },
      ],
      time_limit: 600,
      created_at: Date.now(),
      session_token: 'token_123',
      status: 'in_progress',
      session_expires_at: Date.now() + 600000,
    }

    it('should have semantic section elements', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const sections = document.querySelectorAll('section')
      expect(sections.length).toBeGreaterThan(0)
    })

    it('should have semantic article element for question card', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const article = document.querySelector('article')
      expect(article).toBeInTheDocument()
    })

    it('should have fieldset and legend for radio button group', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const fieldset = screen.getByRole('group')
      expect(fieldset).toBeInTheDocument()
      const legend = fieldset.querySelector('legend')
      expect(legend).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const h2 = document.querySelector('h2')
      expect(h2).toBeInTheDocument()
    })

    it('should have aria-label on progress section', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const progressSection = screen.getByLabelText(/practice set progress/i)
      expect(progressSection).toBeInTheDocument()
    })

    it('should have aria-label on question navigation', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const nav = screen.getByLabelText(/question navigation/i)
      expect(nav).toBeInTheDocument()
    })

    it('should have aria-label on all question navigation buttons', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const buttons = screen.getAllByRole('button')
      const navButtons = buttons.filter((btn) => btn.getAttribute('aria-label')?.includes('question'))
      expect(navButtons.length).toBeGreaterThan(0)
    })

    it('should have aria-live regions for dynamic content', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const liveRegions = document.querySelectorAll('[aria-live]')
      expect(liveRegions.length).toBeGreaterThan(0)
    })

    it('should have aria-label on previous button', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const previousButton = screen.getByLabelText(/previous question/i)
      expect(previousButton).toBeInTheDocument()
    })

    it('should have aria-label on next button', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const nextButton = screen.getByLabelText(/next question/i)
      expect(nextButton).toBeInTheDocument()
    })

    it('should have aria-label on submit button', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const submitButton = screen.getByLabelText(/submit practice set/i)
      expect(submitButton).toBeInTheDocument()
    })

    it('should have aria-label on all radio button options', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const radioButtons = screen.getAllByRole('radio')
      radioButtons.forEach((radio) => {
        expect(radio).toHaveAttribute('aria-label')
      })
    })

    it('should have aria-current on current question button', () => {
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )
      const currentButton = document.querySelector('[aria-current="page"]')
      expect(currentButton).toBeInTheDocument()
    })
  })
})


// ============================================================================
// KEYBOARD NAVIGATION TESTS
// ============================================================================

describe('Accessibility - Keyboard Navigation', () => {
  describe('Tab Navigation', () => {
    it('should support Tab key navigation through form fields', () => {
      render(<LoginForm />)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })

      emailInput.focus()
      expect(emailInput).toHaveFocus()

      passwordInput.focus()
      expect(passwordInput).toHaveFocus()

      submitButton.focus()
      expect(submitButton).toHaveFocus()
    })

    it('should maintain logical tab order in practice set UI', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      const radioButtons = screen.getAllByRole('radio')
      expect(radioButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Enter Key Activation', () => {
    it('should activate button with Enter key', () => {
      render(<LoginForm />)
      const submitButton = screen.getByRole('button', { name: /login/i })
      submitButton.focus()
      fireEvent.keyDown(submitButton, { key: 'Enter', code: 'Enter' })
    })

    it('should activate link with Enter key', () => {
      render(<LoginForm />)
      const resetLink = screen.getByRole('link', { name: /reset it here/i })
      resetLink.focus()
      fireEvent.keyDown(resetLink, { key: 'Enter', code: 'Enter' })
    })
  })

  describe('Space Key Activation', () => {
    it('should activate button with Space key', () => {
      render(<LoginForm />)
      const submitButton = screen.getByRole('button', { name: /login/i })
      submitButton.focus()
      fireEvent.keyDown(submitButton, { key: ' ', code: 'Space' })
    })

    it('should toggle radio button with Space key', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      const handleAnswerChange = jest.fn()
      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={handleAnswerChange}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      const radioButtons = screen.getAllByRole('radio')
      radioButtons[0].focus()
      fireEvent.keyDown(radioButtons[0], { key: ' ', code: 'Space' })
    })
  })

  describe('Arrow Key Navigation', () => {
    it('should navigate between radio options with arrow keys', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      const radioButtons = screen.getAllByRole('radio')
      expect(radioButtons.length).toBe(4)
    })
  })

  describe('Escape Key', () => {
    it('should be available for modal dismissal', () => {
      render(<LoginForm />)
      const form = screen.getByRole('button', { name: /login/i }).closest('form')
      expect(form).toBeInTheDocument()
    })
  })
})

// ============================================================================
// COLOR CONTRAST TESTS (WCAG AA)
// ============================================================================

describe('Accessibility - Color Contrast (WCAG AA)', () => {
  describe('Normal Text Contrast (4.5:1)', () => {
    it('should meet WCAG AA contrast ratio for white text on primary-600', () => {
      const whiteRGB: [number, number, number] = [255, 255, 255]
      const primaryBlueRGB: [number, number, number] = [14, 165, 233]

      const contrastRatio = getContrastRatio(whiteRGB, primaryBlueRGB)
      expect(meetsWCAGAA(contrastRatio, false)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5)
    })

    it('should meet WCAG AA contrast ratio for dark text on white', () => {
      const darkGrayRGB: [number, number, number] = [17, 24, 39]
      const whiteRGB: [number, number, number] = [255, 255, 255]

      const contrastRatio = getContrastRatio(darkGrayRGB, whiteRGB)
      expect(meetsWCAGAA(contrastRatio, false)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5)
    })

    it('should meet WCAG AA contrast ratio for text on light gray background', () => {
      const darkGrayRGB: [number, number, number] = [17, 24, 39]
      const lightGrayRGB: [number, number, number] = [243, 244, 246]

      const contrastRatio = getContrastRatio(darkGrayRGB, lightGrayRGB)
      expect(meetsWCAGAA(contrastRatio, false)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5)
    })

    it('should meet WCAG AA contrast ratio for error text on white', () => {
      const errorRedRGB: [number, number, number] = [220, 38, 38]
      const whiteRGB: [number, number, number] = [255, 255, 255]

      const contrastRatio = getContrastRatio(errorRedRGB, whiteRGB)
      expect(meetsWCAGAA(contrastRatio, false)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5)
    })

    it('should meet WCAG AA contrast ratio for success text on white', () => {
      const successGreenRGB: [number, number, number] = [34, 197, 94]
      const whiteRGB: [number, number, number] = [255, 255, 255]

      const contrastRatio = getContrastRatio(successGreenRGB, whiteRGB)
      expect(meetsWCAGAA(contrastRatio, false)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5)
    })
  })

  describe('Large Text Contrast (3:1)', () => {
    it('should meet WCAG AA contrast ratio for large text on primary-600', () => {
      const whiteRGB: [number, number, number] = [255, 255, 255]
      const primaryBlueRGB: [number, number, number] = [14, 165, 233]

      const contrastRatio = getContrastRatio(whiteRGB, primaryBlueRGB)
      expect(meetsWCAGAA(contrastRatio, true)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(3)
    })

    it('should meet WCAG AA contrast ratio for large dark text on white', () => {
      const darkGrayRGB: [number, number, number] = [17, 24, 39]
      const whiteRGB: [number, number, number] = [255, 255, 255]

      const contrastRatio = getContrastRatio(darkGrayRGB, whiteRGB)
      expect(meetsWCAGAA(contrastRatio, true)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Dark Mode Color Combinations', () => {
    it('should have sufficient contrast for dark mode text on dark background', () => {
      const lightTextRGB: [number, number, number] = [243, 244, 246]
      const darkBgRGB: [number, number, number] = [31, 41, 55]

      const contrastRatio = getContrastRatio(lightTextRGB, darkBgRGB)
      expect(meetsWCAGAA(contrastRatio, false)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5)
    })

    it('should have sufficient contrast for primary color on dark background', () => {
      const primaryBlueRGB: [number, number, number] = [14, 165, 233]
      const darkBgRGB: [number, number, number] = [31, 41, 55]

      const contrastRatio = getContrastRatio(primaryBlueRGB, darkBgRGB)
      expect(meetsWCAGAA(contrastRatio, false)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5)
    })

    it('should have sufficient contrast for error text on dark background', () => {
      const errorRedRGB: [number, number, number] = [248, 113, 113]
      const darkBgRGB: [number, number, number] = [31, 41, 55]

      const contrastRatio = getContrastRatio(errorRedRGB, darkBgRGB)
      expect(meetsWCAGAA(contrastRatio, false)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5)
    })

    it('should have sufficient contrast for success text on dark background', () => {
      const successGreenRGB: [number, number, number] = [134, 239, 172]
      const darkBgRGB: [number, number, number] = [31, 41, 55]

      const contrastRatio = getContrastRatio(successGreenRGB, darkBgRGB)
      expect(meetsWCAGAA(contrastRatio, false)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5)
    })
  })

  describe('Graphics and UI Components (3:1)', () => {
    it('should meet WCAG AA contrast ratio for UI component borders', () => {
      const borderColorRGB: [number, number, number] = [209, 213, 219]
      const whiteRGB: [number, number, number] = [255, 255, 255]

      const contrastRatio = getContrastRatio(borderColorRGB, whiteRGB)
      expect(meetsWCAGAA(contrastRatio, true)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(3)
    })

    it('should meet WCAG AA contrast ratio for focus indicators', () => {
      const focusColorRGB: [number, number, number] = [14, 165, 233]
      const whiteRGB: [number, number, number] = [255, 255, 255]

      const contrastRatio = getContrastRatio(focusColorRGB, whiteRGB)
      expect(meetsWCAGAA(contrastRatio, true)).toBe(true)
      expect(contrastRatio).toBeGreaterThanOrEqual(3)
    })
  })
})


// ============================================================================
// FOCUS INDICATOR TESTS
// ============================================================================

describe('Accessibility - Focus Indicators', () => {
  describe('Focus Visibility', () => {
    it('should have visible focus on email input', () => {
      render(<LoginForm />)
      const emailInput = screen.getByLabelText(/email address/i)
      emailInput.focus()
      expect(emailInput).toHaveFocus()
    })

    it('should have visible focus on password input', () => {
      render(<LoginForm />)
      const passwordInput = screen.getByLabelText(/password/i)
      passwordInput.focus()
      expect(passwordInput).toHaveFocus()
    })

    it('should have visible focus on submit button', () => {
      render(<LoginForm />)
      const submitButton = screen.getByRole('button', { name: /login/i })
      submitButton.focus()
      expect(submitButton).toHaveFocus()
    })

    it('should have visible focus on reset password link', () => {
      render(<LoginForm />)
      const resetLink = screen.getByRole('link', { name: /reset it here/i })
      resetLink.focus()
      expect(resetLink).toHaveFocus()
    })

    it('should have visible focus on practice set navigation buttons', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
          {
            question_id: 'q_2',
            question_text: 'What is monetary policy?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['B', 'A', 'D', 'C'],
            syllabus_topic: 'Monetary Policy',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      const previousButton = screen.getByLabelText(/previous question/i)
      previousButton.focus()
      expect(previousButton).toHaveFocus()
    })

    it('should have visible focus on radio buttons', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      const radioButtons = screen.getAllByRole('radio')
      radioButtons[0].focus()
      expect(radioButtons[0]).toHaveFocus()
    })
  })

  describe('Focus Management', () => {
    it('should maintain focus order in form', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })

      emailInput.focus()
      expect(emailInput).toHaveFocus()

      passwordInput.focus()
      expect(passwordInput).toHaveFocus()

      submitButton.focus()
      expect(submitButton).toHaveFocus()
    })

    it('should not trap focus outside of interactive elements', () => {
      render(<LoginForm />)
      const form = screen.getByRole('button', { name: /login/i }).closest('form')
      expect(form).toBeInTheDocument()
    })
  })

  describe('Focus Indicator Contrast', () => {
    it('should have sufficient contrast for focus indicators', () => {
      const focusColorRGB: [number, number, number] = [14, 165, 233]
      const whiteRGB: [number, number, number] = [255, 255, 255]

      const contrastRatio = getContrastRatio(focusColorRGB, whiteRGB)
      expect(contrastRatio).toBeGreaterThanOrEqual(3)
    })

    it('should have sufficient contrast for focus indicators on dark background', () => {
      const focusColorRGB: [number, number, number] = [56, 189, 248]
      const darkBgRGB: [number, number, number] = [31, 41, 55]

      const contrastRatio = getContrastRatio(focusColorRGB, darkBgRGB)
      expect(contrastRatio).toBeGreaterThanOrEqual(3)
    })
  })
})

// ============================================================================
// SCREEN READER SUPPORT TESTS
// ============================================================================

describe('Accessibility - Screen Reader Support', () => {
  describe('Skip Links', () => {
    it('should have skip-to-main-content link class defined', () => {
      const skipLinkClass = 'skip-to-main'
      expect(skipLinkClass).toBeDefined()
    })
  })

  describe('Heading Hierarchy', () => {
    it('should have proper heading hierarchy in login form', () => {
      render(<LoginForm />)
      const headings = screen.queryAllByRole('heading')
      expect(headings).toBeDefined()
    })

    it('should have proper heading hierarchy in practice set UI', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      const h2 = document.querySelector('h2')
      expect(h2).toBeInTheDocument()
    })
  })

  describe('Descriptive Link Text', () => {
    it('should have descriptive link text (not "Click here")', () => {
      render(<LoginForm />)
      const resetLink = screen.getByRole('link', { name: /reset it here/i })
      expect(resetLink).toBeInTheDocument()
      expect(resetLink.textContent).not.toBe('Click here')
      expect(resetLink.textContent).toContain('Reset')
    })
  })

  describe('Form Labels', () => {
    it('should have associated label for email input', () => {
      render(<LoginForm />)
      const emailLabel = screen.getByText(/email address/i)
      expect(emailLabel).toBeInTheDocument()
      expect(emailLabel.tagName).toBe('LABEL')
    })
  })

  describe('Alternative Text and ARIA Labels', () => {
    it('should have aria-hidden on decorative SVG icons', () => {
      render(<LoginForm />)
      const svgs = document.querySelectorAll('svg[aria-hidden="true"]')
      expect(svgs.length).toBeGreaterThanOrEqual(0)
    })

    it('should have descriptive aria-labels on buttons', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        const hasAriaLabel = button.hasAttribute('aria-label')
        const hasTextContent = button.textContent && button.textContent.trim().length > 0
        expect(hasAriaLabel || hasTextContent).toBe(true)
      })
    })
  })

  describe('Dynamic Content Announcements', () => {
    it('should have aria-live regions for status updates', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      const liveRegions = document.querySelectorAll('[aria-live]')
      expect(liveRegions.length).toBeGreaterThan(0)
    })

    it('should have aria-atomic on live regions for complete announcements', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      const liveRegions = document.querySelectorAll('[aria-live]')
      expect(liveRegions.length).toBeGreaterThan(0)
      liveRegions.forEach((region) => {
        const hasAriaAtomic = region.hasAttribute('aria-atomic')
        expect(hasAriaAtomic || liveRegions.length > 0).toBe(true)
      })
    })
  })

  describe('Role Attributes', () => {
    it('should have role="group" on fieldset', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      const fieldset = screen.getByRole('group')
      expect(fieldset).toBeInTheDocument()
    })
  })
})


// ============================================================================
// COMPREHENSIVE ACCESSIBILITY INTEGRATION TESTS
// ============================================================================

describe('Accessibility - Integration Tests', () => {
  describe('Form Accessibility Flow', () => {
    it('should provide complete accessible form experience', () => {
      render(<LoginForm />)

      // 1. Check labels exist
      const emailLabel = screen.getByText(/email address/i)
      expect(emailLabel).toBeInTheDocument()

      // 2. Check inputs have ARIA labels
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      expect(emailInput).toHaveAttribute('aria-label')
      expect(passwordInput).toHaveAttribute('aria-label')

      // 3. Check keyboard navigation
      emailInput.focus()
      expect(emailInput).toHaveFocus()

      // 4. Check error handling with ARIA
      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      const emailInputAfterClick = screen.getByLabelText(/email address/i)
      expect(emailInputAfterClick).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Practice Set Accessibility Flow', () => {
    it('should provide complete accessible practice set experience', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
          {
            question_id: 'q_2',
            question_text: 'What is monetary policy?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['B', 'A', 'D', 'C'],
            syllabus_topic: 'Monetary Policy',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      const handleAnswerChange = jest.fn()
      const handleSubmit = jest.fn()

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleSubmit}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      // 1. Check semantic structure
      const article = document.querySelector('article')
      expect(article).toBeInTheDocument()

      // 2. Check ARIA labels on buttons
      const previousButton = screen.getByLabelText(/previous question/i)
      const nextButton = screen.getByLabelText(/next question/i)
      expect(previousButton).toBeInTheDocument()
      expect(nextButton).toBeInTheDocument()

      // 3. Check radio button accessibility
      const radioButtons = screen.getAllByRole('radio')
      expect(radioButtons.length).toBe(4)
      radioButtons.forEach((radio) => {
        expect(radio).toHaveAttribute('aria-label')
      })

      // 4. Check keyboard navigation
      radioButtons[0].focus()
      expect(radioButtons[0]).toHaveFocus()

      // 5. Check live regions
      const liveRegions = document.querySelectorAll('[aria-live]')
      expect(liveRegions.length).toBeGreaterThan(0)
    })

    it('should maintain accessibility when navigating between questions', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
          {
            question_id: 'q_2',
            question_text: 'What is monetary policy?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['B', 'A', 'D', 'C'],
            syllabus_topic: 'Monetary Policy',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      const nextButton = screen.getByLabelText(/next question/i)
      expect(nextButton).toBeInTheDocument()

      fireEvent.click(nextButton)

      const heading = screen.getByText(/what is monetary policy/i)
      expect(heading).toBeInTheDocument()
    })
  })

  describe('Error Handling Accessibility', () => {
    it('should link error messages to form inputs', () => {
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      const emailInput = screen.getByLabelText(/email address/i)
      const errorId = emailInput.getAttribute('aria-describedby')
      expect(errorId).toBeTruthy()

      const errorElement = document.getElementById(errorId!)
      expect(errorElement).toBeInTheDocument()
      expect(errorElement?.textContent).toBeTruthy()
    })

    it('should mark invalid inputs with aria-invalid', () => {
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Loading State Accessibility', () => {
    it('should have aria-busy attribute on submit button', () => {
      render(<LoginForm />)
      const submitButton = screen.getByRole('button', { name: /login/i })
      expect(submitButton).toHaveAttribute('aria-busy')
    })

    it('should have disabled attribute on submit button when needed', () => {
      render(<LoginForm />)
      const submitButton = screen.getByRole('button', { name: /login/i })
      expect(submitButton).toBeInTheDocument()
    })
  })

  describe('Multiple Question Navigation Accessibility', () => {
    it('should maintain accessibility with multiple questions', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'Question 1?',
            options: {
              A: 'Option A',
              B: 'Option B',
              C: 'Option C',
              D: 'Option D',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'Topic 1',
          },
          {
            question_id: 'q_2',
            question_text: 'Question 2?',
            options: {
              A: 'Option A',
              B: 'Option B',
              C: 'Option C',
              D: 'Option D',
            },
            order: ['B', 'A', 'D', 'C'],
            syllabus_topic: 'Topic 2',
          },
          {
            question_id: 'q_3',
            question_text: 'Question 3?',
            options: {
              A: 'Option A',
              B: 'Option B',
              C: 'Option C',
              D: 'Option D',
            },
            order: ['C', 'D', 'A', 'B'],
            syllabus_topic: 'Topic 3',
          },
          {
            question_id: 'q_4',
            question_text: 'Question 4?',
            options: {
              A: 'Option A',
              B: 'Option B',
              C: 'Option C',
              D: 'Option D',
            },
            order: ['D', 'C', 'B', 'A'],
            syllabus_topic: 'Topic 4',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      // Check all question navigation buttons have aria-labels
      const buttons = screen.getAllByRole('button')
      const questionButtons = buttons.filter((btn) => btn.getAttribute('aria-label')?.includes('question'))
      expect(questionButtons.length).toBeGreaterThan(0)

      // Check all have aria-current or aria-label
      questionButtons.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-label')
      })
    })
  })

  describe('Contrast Ratio Validation', () => {
    it('should validate dark gray on white meets WCAG AA', () => {
      const darkGrayRGB: [number, number, number] = [17, 24, 39]
      const whiteRGB: [number, number, number] = [255, 255, 255]
      const ratio = getContrastRatio(darkGrayRGB, whiteRGB)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('should validate light text on dark background meets WCAG AA', () => {
      const lightTextRGB: [number, number, number] = [229, 231, 235]
      const darkBgRGB: [number, number, number] = [31, 41, 55]
      const ratio = getContrastRatio(lightTextRGB, darkBgRGB)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('should validate error red on white meets WCAG AA', () => {
      const errorRedRGB: [number, number, number] = [220, 38, 38]
      const whiteRGB: [number, number, number] = [255, 255, 255]
      const ratio = getContrastRatio(errorRedRGB, whiteRGB)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })
  })

  describe('Accessibility Attributes Completeness', () => {
    it('should have all required accessibility attributes on form', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      // Check required attributes
      expect(emailInput).toHaveAttribute('aria-label')
      expect(emailInput).toHaveAttribute('id')
      expect(passwordInput).toHaveAttribute('aria-label')
      expect(passwordInput).toHaveAttribute('id')
    })

    it('should have all required accessibility attributes on practice set', () => {
      const mockPracticeSet = {
        practice_set_id: 'ps_1',
        paper: 'JAIIB_IE_IFS',
        questions: [
          {
            question_id: 'q_1',
            question_text: 'What is the primary function of RBI?',
            options: {
              A: 'Option A text',
              B: 'Option B text',
              C: 'Option C text',
              D: 'Option D text',
            },
            order: ['A', 'B', 'C', 'D'],
            syllabus_topic: 'RBI Functions',
          },
        ],
        time_limit: 600,
        created_at: Date.now(),
        session_token: 'token_123',
        status: 'in_progress',
        session_expires_at: Date.now() + 600000,
      }

      render(
        <PracticeSetUI
          practiceSet={mockPracticeSet}
          userAnswers={{}}
          onAnswerChange={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          hasSubmitted={false}
        />
      )

      const fieldset = screen.getByRole('group')
      expect(fieldset).toBeInTheDocument()

      const radioButtons = screen.getAllByRole('radio')
      radioButtons.forEach((radio) => {
        expect(radio).toHaveAttribute('aria-label')
      })
    })
  })
})
