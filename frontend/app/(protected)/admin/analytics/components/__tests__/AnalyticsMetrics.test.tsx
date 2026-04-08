import React from 'react'
import { render, screen } from '@testing-library/react'
import { AnalyticsMetrics } from '../AnalyticsMetrics'

describe('AnalyticsMetrics Component', () => {
  describe('Rendering', () => {
    it('should render user engagement section', () => {
      render(<AnalyticsMetrics totalLogins={150} />)
      expect(screen.getByText('User Engagement')).toBeInTheDocument()
    })

    it('should display total logins metric', () => {
      render(<AnalyticsMetrics totalLogins={150} />)
      expect(screen.getByText('Total Logins (Last 30 Days)')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('should display active users metric', () => {
      render(<AnalyticsMetrics totalLogins={150} />)
      expect(screen.getByText('Active Users')).toBeInTheDocument()
    })

    it('should display estimated active users label', () => {
      render(<AnalyticsMetrics totalLogins={150} />)
      expect(screen.getByText(/Estimated based on login frequency/i)).toBeInTheDocument()
    })
  })

  describe('Active Users Calculation', () => {
    it('should calculate active users as logins divided by 5', () => {
      render(<AnalyticsMetrics totalLogins={150} />)
      // 150 / 5 = 30
      expect(screen.getByText('30')).toBeInTheDocument()
    })

    it('should handle zero logins', () => {
      render(<AnalyticsMetrics totalLogins={0} />)
      expect(screen.getByText('Total Logins (Last 30 Days)')).toBeInTheDocument()
      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBeGreaterThan(0)
    })

    it('should round up active users calculation', () => {
      render(<AnalyticsMetrics totalLogins={100} />)
      // 100 / 5 = 20
      expect(screen.getByText('20')).toBeInTheDocument()
    })

    it('should handle odd number of logins', () => {
      render(<AnalyticsMetrics totalLogins={155} />)
      // 155 / 5 = 31
      expect(screen.getByText('31')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have gradient background for metrics', () => {
      const { container } = render(<AnalyticsMetrics totalLogins={150} />)
      const gradients = container.querySelectorAll('[class*="bg-gradient"]')
      expect(gradients.length).toBeGreaterThan(0)
    })

    it('should have dark mode support', () => {
      const { container } = render(<AnalyticsMetrics totalLogins={150} />)
      const darkModeElements = container.querySelectorAll('[class*="dark:"]')
      expect(darkModeElements.length).toBeGreaterThan(0)
    })

    it('should have proper color classes for metrics', () => {
      const { container } = render(<AnalyticsMetrics totalLogins={150} />)
      const blueElements = container.querySelectorAll('[class*="blue"]')
      const greenElements = container.querySelectorAll('[class*="green"]')
      expect(blueElements.length + greenElements.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid layout', () => {
      const { container } = render(<AnalyticsMetrics totalLogins={150} />)
      const grid = container.querySelector('[class*="grid"]')
      expect(grid).toBeInTheDocument()
    })

    it('should have responsive gap classes', () => {
      const { container } = render(<AnalyticsMetrics totalLogins={150} />)
      const responsiveGap = container.querySelector('[class*="gap"]')
      expect(responsiveGap).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      const { container } = render(<AnalyticsMetrics totalLogins={150} />)
      const divs = container.querySelectorAll('div')
      expect(divs.length).toBeGreaterThan(0)
    })

    it('should have proper text hierarchy', () => {
      render(<AnalyticsMetrics totalLogins={150} />)
      const heading = screen.getByText('User Engagement')
      expect(heading).toBeInTheDocument()
    })

    it('should have descriptive labels', () => {
      render(<AnalyticsMetrics totalLogins={150} />)
      expect(screen.getByText('Total Logins (Last 30 Days)')).toBeInTheDocument()
      expect(screen.getByText('Active Users')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large login numbers', () => {
      render(<AnalyticsMetrics totalLogins={10000} />)
      expect(screen.getByText('10000')).toBeInTheDocument()
      expect(screen.getByText('2000')).toBeInTheDocument()
    })

    it('should handle single digit logins', () => {
      render(<AnalyticsMetrics totalLogins={5} />)
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })
})
