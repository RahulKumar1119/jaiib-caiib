export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateQuestionText(text: string): boolean {
  return text.length >= 10 && text.length <= 500
}

export function validateOption(option: string): boolean {
  return option.length > 0 && option.length <= 200
}

export function validateOptionsUnique(options: string[]): boolean {
  const uniqueOptions = new Set(options.map((o) => o.toLowerCase()))
  return uniqueOptions.size === options.length
}

export function validateCorrectAnswer(answer: string): boolean {
  return ['A', 'B', 'C', 'D'].includes(answer.toUpperCase())
}
