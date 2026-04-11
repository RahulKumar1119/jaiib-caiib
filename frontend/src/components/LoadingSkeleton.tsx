/**
 * Loading Skeleton Component
 * Displays placeholder content while loading
 */

import React from 'react'
import '../styles/LoadingSkeleton.css'

interface LoadingSkeletonProps {
  type?: 'card' | 'text' | 'chart' | 'dashboard'
  count?: number
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  count = 1,
}) => {
  if (type === 'text') {
    return (
      <div className="skeleton-container">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-text"></div>
        ))}
      </div>
    )
  }

  if (type === 'chart') {
    return (
      <div className="skeleton-chart">
        <div className="skeleton-chart-header"></div>
        <div className="skeleton-chart-bars">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-bar"></div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'dashboard') {
    return (
      <div className="skeleton-dashboard">
        <div className="skeleton-header"></div>
        <div className="skeleton-stats">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-stat-card"></div>
          ))}
        </div>
        <div className="skeleton-content">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </div>
      </div>
    )
  }

  // Default card skeleton
  return (
    <div className="skeleton-container">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-card-header"></div>
          <div className="skeleton-card-content">
            <div className="skeleton-text"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text short"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LoadingSkeleton
